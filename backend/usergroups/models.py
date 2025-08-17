from django.db import models
from users.models import User
import secrets
import string

def generate_access_code(length=12):
    """ Function to randomly generate a function's access code """
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

class Group(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    group_name = models.CharField(max_length=100)
    group_members = models.ManyToManyField(User, related_name="groups")

    # Each group will have an auto-generated code to join
    access_code = models.CharField(max_length=20, unique=True, default=generate_access_code)

    def __str__(self):
        return self.group_name