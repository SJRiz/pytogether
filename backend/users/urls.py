from django.urls import path
from .views import register, me

urlpatterns = [
    path("auth/register/", register, name="register"),
    path("me/", me, name="me"),
    # token endpoints are in backend/urls.py
]