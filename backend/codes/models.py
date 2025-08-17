from django.db import models
from projects.models import Project

# Model for the current code
class Code(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="code")
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

# Model that keeps track of code versions
class CodeVersion(models.Model):
    code = models.ForeignKey(Code, on_delete=models.CASCADE, related_name="versions")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Will be incremented after a new change
    version_number = models.PositiveIntegerField()
