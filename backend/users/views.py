from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .tokens import EmailTokenObtainPairSerializer

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """ Protected endpoint returning current user's data. """
    return Response(UserSerializer(request.user).data)
