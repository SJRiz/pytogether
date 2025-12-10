from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core import signing
from django.conf import settings
from decouple import config

from .models import Project
from usergroups.models import Group
from codes.models import Code
from .serializers import ProjectDetailSerializer, ProjectCreateSerializer, ProjectUpdateSerializer

# Helper functions
def get_group_or_error(group_id):
    try:
        return Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return None

def get_project_or_error(project_id):
    try:
        return Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return None

def check_membership_or_error(user, group):
    return group.group_members.filter(id=user.id).exists()

# Standard CRUD Routes

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_projects(request, group_id):
    group = get_group_or_error(group_id)
    if not group:
        return Response({"error": "Invalid group_id"}, status=400)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=403)

    projects = Project.objects.filter(group=group)
    serializer = ProjectDetailSerializer(projects, many=True)
    return Response(serializer.data, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_project(request, group_id):
    group = get_group_or_error(group_id)
    if not group:
        return Response({"error": "Invalid group_id"}, status=400)
    
    if not check_membership_or_error(request.user, group):
        return Response({"error": "You are not in this group"}, status=403)

    serializer = ProjectCreateSerializer(data=request.data, context={"request": request})
    
    if serializer.is_valid():
        project = serializer.save(group=group)
        
        return Response(ProjectDetailSerializer(project).data, status=201)

    return Response(serializer.errors, status=400)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_project(request, group_id, project_id):
    group = get_group_or_error(group_id)
    project = get_project_or_error(project_id)

    if not group: return Response({"error": "Invalid group"}, status=400)
    if not project: return Response({"error": "Project not found"}, status=404)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "Not authorized"}, status=403)

    serializer = ProjectUpdateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        if "project_name" in serializer.validated_data:
            project.project_name = serializer.validated_data["project_name"]
            project.save()
        return Response(ProjectDetailSerializer(project).data, status=200)

    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_project(request, group_id, project_id):
    group = get_group_or_error(group_id)
    project = get_project_or_error(project_id)

    if not group or not project: return Response({"error": "Not found"}, status=404)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "Not authorized"}, status=403)

    if hasattr(project, 'code'):
        project.code.delete()
        
    project.delete()
    return Response({"message": "Project deleted"}, status=200)


# SHARE LINKS & SNIPPETS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_share_link(request, group_id, project_id):
    """
    Generates a link for REAL-TIME COLLABORATION (Edit Mode).
    User must be logged in to use this link.
    """
    group = get_group_or_error(group_id)
    if not group: return Response({"error": "Group not found"}, status=404)
    
    if not check_membership_or_error(request.user, group):
        return Response({"error": "Not authorized"}, status=403)
            
    signer = signing.TimestampSigner()
    share_payload = {
        "pid": project_id,
        "gid": group_id,
        "type": "share_link"
    }
    token = signer.sign_object(share_payload)
    
    base_url = config('NAKED_ORIGIN', default='http://localhost:5173')
    return Response({
        "share_url": f"{base_url}/join-shared/{token}" 
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_share_link(request):
    """
    Exchanges a token for Project Details.
    Used when a guest clicks the /join-shared/:token link.
    """
    token = request.data.get('token')
    if not token:
        return Response({"error": "Token required"}, status=400)

    signer = signing.TimestampSigner()
    try:
        data = signer.unsign_object(token)
        
        if data.get('type') != 'share_link':
            return Response({"error": "Invalid token type"}, status=400)

        project = Project.objects.get(id=data['pid'])
        
        return Response({
            "project_id": project.id,
            "project_name": project.project_name,
            "group_id": data['gid'],
            "valid": True
        })
    except (signing.BadSignature, signing.SignatureExpired, Project.DoesNotExist):
        return Response({"error": "Invalid or expired link"}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_snippet_link(request, group_id, project_id):
    """
    Generates a READ-ONLY link for the Offline Playground.
    Anyone can open this link (no login required).
    """
    group = get_group_or_error(group_id)
    if not check_membership_or_error(request.user, group):
        return Response({"error": "Not authorized"}, status=403)

    signer = signing.TimestampSigner()
    snippet_payload = {
        "pid": project_id,
        "type": "snippet" # Distinguishes this from edit links
    }
    token = signer.sign_object(snippet_payload)
    
    base_url = config('NAKED_ORIGIN', default='http://localhost:5173')
    return Response({
        "snippet_url": f"{base_url}/snippet/{token}"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_snippet_content(request, token):
    """
    Fetches the code content for the Offline Playground.
    """
    signer = signing.TimestampSigner()
    try:
        data = signer.unsign_object(token)
        
        if data.get('type') != 'snippet':
            return Response({"error": "Invalid token type"}, status=400)

        project = Project.objects.get(id=data['pid'])
        
        code_obj = Code.objects.get(project=project)
        content = code_obj.content if hasattr(code_obj, 'content') else ""

        return Response({
            "code": content,
            "name": project.project_name
        })
    except (signing.BadSignature, signing.SignatureExpired, Project.DoesNotExist, Code.DoesNotExist):
        return Response({"error": "Snippet not found or expired"}, status=404)