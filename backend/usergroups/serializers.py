from rest_framework import serializers
from .models import Group

class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["group_name"]

class GroupDetailSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField()
    group_members = serializers.StringRelatedField(many=True)

    class Meta:
        model = Group
        fields = ["id", "group_name", "access_code", "owner", "group_members"]

class GroupJoinSerializer(serializers.Serializer):
    access_code = serializers.CharField()

    # will automatically get called from .is_valid()
    def validate_access_code(self, value):

        # Check if the group exists with that access code
        try:
            group = Group.objects.get(access_code=value)
        except Group.DoesNotExist:
            raise serializers.ValidationError("Invalid access code.")

        # Access the current user via the serializer context
        user = self.context['request'].user
        if user in group.group_members.all():
            raise serializers.ValidationError("You are already a member of this group.")
        
        return value
    
class GroupLeaveSerializer(serializers.Serializer):
    id = serializers.IntegerField()

    def validate_id(self, value):

        # Check if the group exists
        try:
            group = Group.objects.get(id=value)
        except Group.DoesNotExist:
            raise serializers.ValidationError("Invalid group ID.")

        user = self.context['request'].user
        if user not in group.group_members.all():
            raise serializers.ValidationError("You are not a member of this group.")

        return value