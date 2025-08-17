from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "project_name", "group", "created_at")
    list_filter = ("group", "created_at")
    search_fields = ("project_name", "group__name")
    ordering = ("-created_at",)
