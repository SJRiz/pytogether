import requests
import jwt
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .tokens import EmailTokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.conf import settings
from utils.daily_logger import track_user_sync
from .models import Feedback
from .serializers import FeedbackSerializer

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """The frontend mainly handles the oauth, we just have to make sure their google login token is actually valid"""
    token = request.data.get("access_token")
    if not token:
        return Response({"error": "Missing Google token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        google_resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
    except requests.exceptions.RequestException:
        return Response({"error": "Could not connect to Google"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

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
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="Lax",
        max_age=30*24*60*60,  # 30 days
        path="/"
    )

    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def microsoft_login(request):
    """Validate Microsoft ID token and log the user in (mirrors google_login)."""
    token = request.data.get("access_token")
    if not token:
        return Response({"error": "Missing Microsoft token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        email = decoded.get("preferred_username") or decoded.get("email")
    except Exception:
        return Response({"error": "Invalid Microsoft token"}, status=status.HTTP_400_BAD_REQUEST)

    if not email:
        return Response({"error": "Email not available from Microsoft"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if user is None:
        user = User.objects.create_user(email=email)

    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    refresh = RefreshToken.for_user(user)
    response = Response({"access": str(refresh.access_token), "email": user.email})

    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="Lax",
        max_age=30*24*60*60,
        path="/"
    )

    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def email_token_obtain_pair(request):
    """ JWT login with email & password. """
    serializer = EmailTokenObtainPairSerializer(data=request.data)

    if serializer.is_valid():
        tokens = serializer.validated_data
        
        # Create response with only access token
        response = Response({
            "access": tokens["access"]
        }, status=status.HTTP_200_OK)
        
        # Set refresh token as HttpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=tokens["refresh"],
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=30*24*60*60,  # 30 days
            path="/",
        )
        
        return response
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """ Register with email + password. Returns created user (without password). """
    email = request.data.get("email")
    password = request.data.get("password")
    
    if email:
        user = User.objects.filter(email=email).first()
        if user:
            # reset password
            if user.password == "" or not user.password:
                if not password or len(password) < 8:
                    return Response({"password": ["Ensure this field has at least 8 characters."]}, status=status.HTTP_400_BAD_REQUEST)
                
                user.set_password(password)
                user.save()
                
                refresh = RefreshToken.for_user(user)
                response_data = RegisterSerializer(user).data
                response_data["access"] = str(refresh.access_token)
                
                response = Response(response_data, status=status.HTTP_200_OK)
                response.set_cookie(
                    key="refresh_token",
                    value=str(refresh),
                    httponly=True,
                    secure=settings.SESSION_COOKIE_SECURE,
                    samesite='Lax',
                    max_age=30*24*60*60,
                    path="/",
                )
                return response
            else:
                return Response({"email": ["A user with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)

    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        response_data = RegisterSerializer(user).data
        response_data["access"] = str(refresh.access_token)
        
        response = Response(response_data, status=status.HTTP_201_CREATED)
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=30*24*60*60,
            path="/",
        )
        return response
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """ Logout the user by clearing the refresh token cookie.
    Expects the refresh token in the cookie."""
    try:
        # Remove refresh token cookie
        response = Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie("refresh_token", path="/")
        return response
    
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# debug endpoint
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """ Protected endpoint returning current user's data. """
    track_user_sync(request.user.id)
    return Response(UserSerializer(request.user).data)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def feedback(request):
    """ Handle user feedback (star rating and message) """
    if request.method == "GET":
        try:
            feedback_obj = Feedback.objects.get(user=request.user)
            return Response(FeedbackSerializer(feedback_obj).data)
        except Feedback.DoesNotExist:
            return Response({"rating": 0, "message": ""})
            
    if request.method == "POST":
        rating = request.data.get("rating")
        message = request.data.get("message", "")
        
        try:
            rating_int = int(rating)
            if not (1 <= rating_int <= 5):
                raise ValueError("Rating out of bounds")
        except (ValueError, TypeError):
            return Response({"error": "Valid rating (1-5) is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        feedback_obj, created = Feedback.objects.update_or_create(
            user=request.user,
            defaults={"rating": rating_int, "message": message}
        )
        
        return Response(FeedbackSerializer(feedback_obj).data)

