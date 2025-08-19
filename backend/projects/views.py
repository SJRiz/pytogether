from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Project
from usergroups.models import Group
from codes.models import Code
from .serializers import ProjectDetailSerializer, ProjectCreateSerializer, ProjectUpdateSerializer


# Helper functions
def get_group_or_error(group_id):
    """Fetches a group or returns None if it doesn't exist"""
    try:
        return Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return None

def get_project_or_error(project_id):
    """Fetches a project or returns None if it doesn't exist"""
    try:
        return Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return None

def check_membership_or_error(user, group):
    """Returns True if user is in group, else False"""
    return user in group.group_members.all()

# API routes
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_projects(request, group_id):
    """Lists projects in a group"""

    group = get_group_or_error(group_id)
    if not group:
        return Response({"error": "Invalid group_id"}, status=status.HTTP_400_BAD_REQUEST)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=status.HTTP_403_FORBIDDEN)

    projects = Project.objects.filter(group=group)
    serializer = ProjectDetailSerializer(projects, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_project(request, group_id):
    """Create a new project in a group"""

    group = get_group_or_error(group_id)
    if not group:
        return Response({"error": "Invalid group_id"}, status=status.HTTP_400_BAD_REQUEST)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=status.HTTP_403_FORBIDDEN)

    serializer = ProjectCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        project = Project.objects.create(
            project_name=serializer.validated_data["project_name"],
            group=group
        )

        # give the project an initial code block
        Code.objects.create(
            project=project
        )

        return Response(ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_project(request, group_id, project_id):
    """Edit a project"""

    group = get_group_or_error(group_id)
    project = get_project_or_error(project_id)

    if not group:
        return Response({"error": "Invalid group_id"}, status=status.HTTP_400_BAD_REQUEST)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=status.HTTP_403_FORBIDDEN)
    if not project:
        return Response({"error": "Project does not exist in this group"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProjectUpdateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        if "project_name" in serializer.validated_data:
            project.project_name = serializer.validated_data["project_name"]
            project.save()
        return Response(ProjectDetailSerializer(project).data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_project(request, group_id, project_id):
    """Delete a project"""

    group = get_group_or_error(group_id)
    project = get_project_or_error(project_id)

    if not group:
        return Response({"error": "Invalid group_id"}, status=status.HTTP_400_BAD_REQUEST)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=status.HTTP_403_FORBIDDEN)
    if not project:
        return Response({"error": "Project does not exist in this group"}, status=status.HTTP_404_NOT_FOUND)

    project.delete()
    return Response({"message": "Project deleted"}, status=status.HTTP_200_OK)
