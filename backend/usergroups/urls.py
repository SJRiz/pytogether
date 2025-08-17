from django.urls import path
from .views import create_group, join_group, leave_group, list_groups

urlpatterns = [
    path("create/", create_group, name="create_group"),
    path("join/", join_group, name="join_group"),
    path("leave/", leave_group, name="leave_group"),
    path("list/", list_groups, name="list_groups"),
]