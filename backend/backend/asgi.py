# ASGI handles both sync and async, perfect because we need both
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from .jwt_auth_middleware import JWTAuthMiddleware

# function for lazy import, because i keep getting errors
def get_ws_urlpatterns():
    from codes.routing import websocket_urlpatterns
    return websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),     # do django's usual stuff for http requests
    "websocket": JWTAuthMiddleware(
        URLRouter(
            get_ws_urlpatterns()        # for websockets, check if they are authenticated, then route them to their respective room
        )
    ),
})
