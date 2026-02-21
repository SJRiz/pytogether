from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework import status
from django.utils import timezone
from django.conf import settings

class CookieTokenRefreshView(TokenRefreshView):
    """
    Custom TokenRefreshView that reads refresh token from HttpOnly cookie
    instead of request body
    """
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token not found in cookies"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Add refresh token to request data
        request.data['refresh'] = refresh_token
        
        try:
            response = super().post(request, *args, **kwargs)
            
            # If token rotation is enabled, update the cookie with new refresh token
            if 'refresh' in response.data:
                response.set_cookie(
                    key="refresh_token",
                    value=response.data['refresh'],
                    httponly=True,
                    secure=settings.SESSION_COOKIE_SECURE,
                    samesite="Lax",
                    max_age=30*24*60*60,  # 30 days
                    path="/"
                )
                # Remove refresh token from response body (it's in cookie now)
                del response.data['refresh']
            print("ok!")
            return response
            
        except InvalidToken as e:
            return Response(
                {"error": "Invalid or expired refresh token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email is None or password is None:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError("Unable to log in with provided credentials.")

        if not getattr(user, "is_active", True):
            raise serializers.ValidationError("User account is disabled.")
        
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])


        refresh = RefreshToken.for_user(user)
        
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }