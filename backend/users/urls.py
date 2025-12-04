from django.urls import path
from .views import register, me, google_login, logout
from .tokens import CookieTokenRefreshView
from users.views import email_token_obtain_pair

urlpatterns = [
    # JWT token obtain (email + password) and refresh
    path("auth/token/", email_token_obtain_pair, name="token_obtain_pair"),
    path("auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", logout, name="logout"),

    # Google login
    path("auth/google/", google_login, name="google_login"),

    # others
    path("auth/register/", register, name="register"),
    path("me/", me, name="me"),
]