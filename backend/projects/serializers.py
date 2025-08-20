from rest_framework import serializers
from .models import Project

class ProjectDetailSerializer(serializers.ModelSerializer):
    updated_at = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "project_name", "created_at", "group", "updated_at"]

    def get_updated_at(self, obj):
        if hasattr(obj, "code") and obj.code is not None:
            return obj.code.updated_at
        return None

class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["project_name"]

class ProjectUpdateSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False)