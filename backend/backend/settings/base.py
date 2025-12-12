from pathlib import Path
from decouple import config
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = config("DJANGO_SECRET_KEY")
AUTH_USER_MODEL = "users.User"

# Application definition
INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Apps
    "users",
    "projects",
    "usergroups",
    "codes",
    
    # Third-party
    'rest_framework',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google', # im actually unsure if i need all this allauth stuff, because i made the frontend deal with oauth instead but ill keep it just incase if i wanna change
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'corsheaders',
    'rest_framework.authtoken',
    'django_celery_beat'
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("POSTGRES_DB"),
        "USER": config("POSTGRES_USER"),
        "PASSWORD": config("POSTGRES_PASSWORD"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default=5432, cast=int),
    }
}

# Redis stuff; used as a broker for celery, channel layers, and also for caching active projects
# I dockerized redis so its url is redis://redis:6379, putting it in an env file is quite overkill but eh it looks cleaner
REDIS_HOST = config("REDIS_HOST", default="localhost")
REDIS_PORT = config("REDIS_PORT", default=6379, cast=int)

# I'll probably add another redis cache for faster project and group querying, for now it seems fine tho
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

CELERY_BROKER_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/0" 
CELERY_RESULT_BACKEND = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [(REDIS_HOST, REDIS_PORT)]},
    }
}

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
)

# DRF stuff
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/minute',
        'anon': '20/minute',
    }
}

# JWT stuff
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_USE_JWT = True

# Allauth settings (will add email verification later)
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'none'

# App specific settings
MAX_MESSAGE_SIZE = 200 * 1024    # ~0.20MB
HEARTBEAT_INTERVAL = 10         # how long we wait till we check if the user is still alive
USER_COLORS = [
  {"color": "#F06292", "light": "#F0629233"},
  {"color": "#BA68C8", "light": "#BA68C833"},
  {"color": "#9575CD", "light": "#9575CD33"},
  {"color": "#7986CB", "light": "#7986CB33"},
  {"color": "#64B5F6", "light": "#64B5F633"},
  {"color": "#4FC3F7", "light": "#4FC3F733"},
  {"color": "#4DD0E1", "light": "#4DD0E133"},
  {"color": "#4DB6AC", "light": "#4DB6AC33"},
  {"color": "#81C784", "light": "#81C78433"},
  {"color": "#AED581", "light": "#AED58133"},
  {"color": "#DCE775", "light": "#DCE77533"},
  {"color": "#FFF176", "light": "#FFF17633"},
  {"color": "#FFD54F", "light": "#FFD54F33"},
  {"color": "#FFB74D", "light": "#FFB74D33"},
  {"color": "#FF8A65", "light": "#FF8A6533"},
  {"color": "#E57373", "light": "#E5737333"},
  {"color": "#A1887F", "light": "#A1887F33"},
  {"color": "#90A4AE", "light": "#90A4AE33"},
  {"color": "#F9A825", "light": "#F9A82533"},
  {"color": "#00ACC1", "light": "#00ACC133"}
]

# ------------------ CODE TEMPLATES ---------------------

NONE_TEMPLATE = """name = input("Whats your name? ")
print(f"Hello from PyTogether, {name}!")"""

PYTEST_TEMPLATE = """# ----------------------------------------------
# WRITE YOUR SOLUTION HERE
# ----------------------------------------------

def solve(n):
  # TODO: Implement this
  return 1




# ==========================================
# TEST CASES
# ==========================================

def test_basic():
  assert solve(1) == 1

def test_basic2():
  assert solve(2) == 2


  

# ==========================================
# PYTEST RUNNER (do not modify)
# ==========================================

if __name__ == "__main__":
  import pytest, sys, os
  
  module_name = os.path.splitext(os.path.basename(__file__))[0]
  if module_name in sys.modules:
    del sys.modules[module_name]

  pytest.main(["-s", "-v", "-p", "no:cacheprovider", "--tb=short", "--color=yes", __file__])"""

PLT_TEMPLATE = """import matplotlib.pyplot as plt
import numpy as np

# 1. Generate Data (Sine Wave)
x = np.linspace(0, 10, 100)
y = np.sin(x)

# 2. Setup Plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, label='sin(x)', color='#4CAF50', linewidth=2)

# 3. Styling
plt.title("Test Plot: Sine Wave")
plt.xlabel("Time (s)")
plt.ylabel("Amplitude")
plt.grid(True, linestyle='--', alpha=0.7)
plt.legend()

# 4. Render
plt.show()"""