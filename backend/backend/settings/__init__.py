# When docker compose launches the django container, it'll import the correct settings depending on the environment
# This makes my life so much easier when trying to develop new features locally and not having to toy with the settings everytime
# Putting this in an __init__ script assures that this is ran first.

import os

# Get the value and clean it up
ENV_MODE = os.getenv("PROD", "development").lower()

if ENV_MODE == "true":
    print("--- PRODUCTION (VPS) MODE DETECTED ---")
    from .prod import *
elif ENV_MODE == "selfhost":
    print("--- SELF-HOSTING MODE DETECTED ---")
    from .selfhost import *
else:
    print("--- DEVELOPMENT MODE DETECTED ---")
    from .dev import *