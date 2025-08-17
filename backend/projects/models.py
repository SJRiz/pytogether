from django.db import models
from usergroups.models import Group

class Project(models.Model):
    project_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='projects')
