from rest_framework import serializers
from .models import Code, CodeVersion

class CodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Code
        fields = ["project", "content"]

class CodeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeVersion
        fields = ["id", "content", "created_at", "version_number"]
