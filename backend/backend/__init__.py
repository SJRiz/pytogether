# This is just to make sure celery properly discovers all the tasks
from .celery import app as celery_app
__all__ = ("celery_app",)