from .base import *
from decouple import config

DEBUG = False
ALLOWED_HOSTS = ['django', 'localhost', config("DOMAIN"), config("VPS_IP")]

# HTTPS / security
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    config("ORIGIN"),
    f"https://{config('DOMAIN')}",
]

# CORS
CORS_ALLOWED_ORIGINS = [config("ORIGIN")]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "OPTIONS",
    "DELETE",
    "PUT"
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# DRF permissions
REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = ("rest_framework.permissions.IsAuthenticated",)

# Static files
STATIC_ROOT = BASE_DIR / "staticfiles"

# Allauth
ACCOUNT_EMAIL_VERIFICATION = "mandatory"

# Make sure Django knows it's behind a proxy
USE_TZ = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')