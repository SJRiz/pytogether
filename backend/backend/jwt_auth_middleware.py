import jwt
from urllib.parse import parse_qs
from django.conf import settings
from channels.db import database_sync_to_async
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

# Fetch the user from the database
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
    Custom auth middleware for Django Channels.
    Handles:
    1. JWT Auth ('token' param) for logged-in users.
    2. Share Token Auth ('share_token' param) for shared project access.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        scope['user'] = AnonymousUser()
        scope['share_context'] = None

        # parse_qs handles the split logic safely for us
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        
        # Get raw tokens (parse_qs returns lists, e.g. {'token': ['xyz']})
        token = query_params.get("token", [None])[0]
        share_token = query_params.get("share_token", [None])[0]

        if token:
            scope['user'] = await self.get_user_from_jwt(token)

        if share_token and ":" in share_token:
            share_data = await self.validate_share_token(share_token)
            if share_data:
                # Add the share data to scope so consumers can use it
                scope['share_context'] = share_data
                print(f"Share Token Validated: {share_data}")

        return await self.inner(scope, receive, send)

    async def get_user_from_jwt(self, token):
        try:
            # Decode JWT and fetch user
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            return await get_user(user_id)
        except (jwt.ExpiredSignatureError, jwt.DecodeError, jwt.InvalidTokenError) as e:
            print(f"JWT Error: {e}")
            from django.contrib.auth.models import AnonymousUser
            return AnonymousUser()
        except Exception as e:
            print(f"Generic JWT Error: {e}")
            return AnonymousUser()

    @database_sync_to_async
    def validate_share_token(self, token_string):
        """
        Validates the share_token using Django's TimestampSigner.
        Expected format: 'payload:timestamp:signature'
        """
        signer = TimestampSigner()
        try:
            # unsign_object validates the signature and returns the original python object
            original_data = signer.unsign_object(token_string) 
            return original_data
        except SignatureExpired:
            print("Share link expired")
            return None
        except BadSignature:
            print("Invalid share link signature")
            return None