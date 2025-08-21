import os

ENV = os.getenv("PROD", "False").lower() in ("true", "1", "yes")

if ENV:
    print("PRODUCTION ENV DETECTED")
    from .prod import *
else:
    print("setting up development env")
    from .dev import *