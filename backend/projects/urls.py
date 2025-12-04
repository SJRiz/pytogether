from django.urls import path
from . import views

urlpatterns = [
    # Listing and creating projects
    # (Matches: /groups/1/projects/ and /groups/1/projects/create/)
    path("", views.list_projects, name="list_projects"),
    path("create/", views.create_project, name="create_project"),
    
    # Operations on a specific project
    path("<int:project_id>/edit/", views.edit_project, name="edit_project"),
    path("<int:project_id>/delete/", views.delete_project, name="delete_project"),

    # SHARE GENERATION (Relative paths)
    # These generate the links. You must be in the group to click these.
    # (Matches: /groups/1/projects/5/share/)
    path('<int:project_id>/share/', views.generate_share_link, name="generate_share_link"),
    path('<int:project_id>/share-snippet/', views.generate_snippet_link, name="generate_snippet_link"),
]