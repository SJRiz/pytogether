from django.contrib import admin
from .models import Group

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'group_name', 'owner', 'access_code')
    search_fields = ('group_name', 'owner__email', 'access_code')
    filter_horizontal = ('group_members',)  # makes ManyToMany field easier to manage
