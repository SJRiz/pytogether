from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Group
from .serializers import GroupCreateSerializer, GroupDetailSerializer, GroupJoinSerializer, GroupUpdateSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_group(request):
    """ View to create a group """

    # Deserialize request
    serializer = GroupCreateSerializer(data=request.data)

    if serializer.is_valid():
        # Create group but inject owner manually
        group = Group.objects.create(
            owner=request.user,
            group_name=serializer.validated_data["group_name"]
        )
        # Add owner as first member
        group.group_members.add(request.user)
        group.save()

        # Serialize and send back
        return Response(GroupDetailSerializer(group).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def join_group(request):
    """ View to join a group via acesss code """

    serializer = GroupJoinSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        group = Group.objects.get(access_code=serializer.validated_data["access_code"])
        group.group_members.add(request.user)

        return Response(GroupDetailSerializer(group).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_groups(request):
    """ View to list all the groups a user is in """

    groups = Group.objects.filter(group_members=request.user)
    serializer = GroupDetailSerializer(groups, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def leave_group(request):
    """ View to leave a specified group """

    serializer = GroupUpdateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        group = serializer.get_group()
        group.group_members.remove(request.user)

        if group.group_members.count() == 0:
            group.delete()
            print("deleted the group")

        return Response({"message": f"Left group {group.group_name}"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_group(request):
    """ View to change the name of a group """

    serializer = GroupUpdateSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        group = serializer.get_group()
        group.group_name = serializer.validated_data["group_name"]
        group.save()
        return Response({"message": "Group updated successfully."}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
