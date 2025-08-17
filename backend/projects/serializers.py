from rest_framework import serializers
from .models import Project

class ProjectDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "project_name", "created_at", "group"]

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["project_name"]

class ProjectUpdateSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False)