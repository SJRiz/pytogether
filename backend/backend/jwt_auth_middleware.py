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

    def __call__(self, scope):
        return JWTAuthMiddlewareInstance(scope, self.inner)


class JWTAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = scope
        self.inner = inner

    async def __call__(self, receive, send):
        self.scope['user'] = await self.get_user_from_jwt()
        inner = self.inner(self.scope)
        return await inner(receive, send)

    async def get_user_from_jwt(self):
        from django.contrib.auth.models import AnonymousUser
        token = None

        # Check query string
        query_string = self.scope.get("query_string", b"").decode()
        if "token=" in query_string:
            token = query_string.split("token=")[-1].split("&")[0]

        # Check headers (Authorization: Bearer <token>)
        if not token:
            headers = dict((k.decode(), v.decode()) for k, v in self.scope.get("headers", []))
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
        except Exception:
            return AnonymousUser()
