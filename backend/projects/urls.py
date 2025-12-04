from django.urls import path
from .views import create_project, list_projects, edit_project, delete_project

urlpatterns = [
    # Listing and creating projects under a group
    path("", list_projects, name="list_projects"),
    path("create/", create_project, name="create_project"),
    
    # Operations on a specific project
    path("<int:project_id>/edit/", edit_project, name="edit_project"),
    path("<int:project_id>/delete/", delete_project, name="delete_project"),
]