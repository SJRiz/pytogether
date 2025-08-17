from django.db import models
from projects.models import Project

# Model for the current code
class Code(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="code")
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Code for project {self.project_id}"

# Model that keeps track of code versions
class CodeVersion(models.Model):
    code = models.ForeignKey(Code, on_delete=models.CASCADE, related_name="versions")
    content = models.TextField()

    # Increments on change
    version_number = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = ("code", "version_number")

    def __str__(self):
        return f"{self.code.project_id} v{self.version_number}"
