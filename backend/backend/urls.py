from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # app endpoints
    path("api/", include("users.urls")),
    path("groups/", include("usergroups.urls")), # this app also includes projects
]
