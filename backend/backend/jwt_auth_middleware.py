import jwt
from django.conf import settings
from channels.db import database_sync_to_async

# fetch the user from the database
@database_sync_to_async
def get_user(user_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom JWT auth middleware for Django Channels.
    Looks for 'token' in query string or 'Authorization' header.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Set the user in scope
        scope['user'] = await self.get_user_from_jwt(scope)
        
        # Call the inner application with the modified scope
        return await self.inner(scope, receive, send)  # <-- Fixed this line

    async def get_user_from_jwt(self, scope):
        from django.contrib.auth.models import AnonymousUser
        token = None

        # Check query string
        query_string = scope.get("query_string", b"").decode()
        if "token=" in query_string:
            token = query_string.split("token=")[-1].split("&")[0]

        # Check headers (Authorization: Bearer <token>)
        if not token:
            headers = dict((k.decode(), v.decode()) for k, v in scope.get("headers", []))
            auth_header = headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return AnonymousUser()

        # Decode JWT and fetch user
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            return await get_user(user_id)
        except Exception as e:
            print(f"JWT decode error: {e}")
            return AnonymousUser()