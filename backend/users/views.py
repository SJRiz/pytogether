import requests
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .tokens import EmailTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """The frontend mainly handles the oauth, we just have to make sure their google login token is actually valid"""
    token = request.data.get("access_token")
    if not token:
        return Response({"error": "Missing Google token"}, status=status.HTTP_400_BAD_REQUEST)

    google_resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
    if google_resp.status_code != 200:
        return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

    google_data = google_resp.json()
    email = google_data.get("email")
    if not email:
        return Response({"error": "Email not available"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if user is None:
        user = User.objects.create_user(email=email)

    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    # issue tokens
    refresh = RefreshToken.for_user(user)
    response = Response({"access": str(refresh.access_token), "email": user.email})

    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=True,
        samesite="Lax",
        path="/api/auth/token/refresh/"
    )

    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def email_token_obtain_pair(request):
    """ JWT login with email & password. """
    serializer = EmailTokenObtainPairSerializer(data=request.data)

    if serializer.is_valid():
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """ Register with email + password. Returns created user (without password). """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(RegisterSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """ Logout the user by clearing the refresh token cookie.
    Expects the refresh token in the cookie."""
    try:
        # Remove refresh token cookie
        response = Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie("refresh_token", path="/api/auth/token/refresh/")
        return response
    
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# debug endpoint
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """ Protected endpoint returning current user's data. """
    return Response(UserSerializer(request.user).data)

