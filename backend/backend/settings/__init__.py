# When docker compose launches the django container, it'll import the correct settings depending on the environment
# This makes my life so much easier when trying to develop new features locally and not having to toy with the settings everytime
# Putting this in an __init__ script assures that this is ran first.

import os   # i alternate between config and os a lot, i should probably stick to only one

ENV = os.getenv("PROD", "False").lower() in ("true", "1", "yes")

if ENV:
    print("PRODUCTION ENV DETECTED")
    from .prod import *
else:
    print("setting up development env")
    from .dev import *