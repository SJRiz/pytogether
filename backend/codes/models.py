from django.db import models
from projects.models import Project

# Model for the current code
class Code(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="code")
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Code for project {self.project_id}"
