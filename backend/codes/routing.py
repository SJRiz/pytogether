from django.urls import re_path
from .consumers import YjsCodeConsumer

websocket_urlpatterns = [
    # Route: /ws/groups/<group_id>/projects/<project_id>/code/
    re_path(r'ws/groups/(?P<group_id>\d+)/projects/(?P<project_id>\d+)/code/$', YjsCodeConsumer.as_asgi()),
]