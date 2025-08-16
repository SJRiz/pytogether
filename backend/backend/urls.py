from django.contrib import admin
from django.urls import path, include
from users.views import email_token_obtain_pair
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT token obtain (email + password) and refresh
    path("api/auth/token/", email_token_obtain_pair, name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # dj-rest-auth + allauth needed for social endpoints
    path("api/auth/", include("dj_rest_auth.urls")),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),

    # app endpoints
    path("api/", include("users.urls")),
]
