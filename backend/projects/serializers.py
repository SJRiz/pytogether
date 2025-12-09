from rest_framework import serializers
from .models import Project
from codes.models import Code
from django.conf import settings

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
    template = serializers.ChoiceField(
        choices=["none", "pytest", "plt"], 
        write_only=True,
        required=False,
        default="none"
    )

    class Meta:
        model = Project
        fields = ["project_name", "template"]

    def create(self, validated_data):
        template_type = validated_data.pop('template', 'none')
        
        project = Project.objects.create(**validated_data)

        initial_code = ""
        if template_type == "none":
            initial_code = settings.NONE_TEMPLATE

        elif template_type == "pytest":
            initial_code = settings.PYTEST_TEMPLATE
            
        elif template_type == "plt":
            initial_code = settings.PLT_TEMPLATE
        
        Code.objects.create(project=project, content=initial_code)
        
        return project

class ProjectUpdateSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False)