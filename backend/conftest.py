import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

import django
from django.test import override_settings

django.setup()

# Use local memory cache for tests (no Redis dependency)
_cache_overrides = override_settings(
    CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}},
    REST_FRAMEWORK={
        'DEFAULT_THROTTLE_CLASSES': [],
        'DEFAULT_THROTTLE_RATES': {},
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework_simplejwt.authentication.JWTAuthentication',
            'rest_framework.authentication.SessionAuthentication',
        ),
        'DEFAULT_PERMISSION_CLASSES': (
            'infrastructure.permissions.RolePermission',
        ),
        'DEFAULT_RENDERER_CLASSES': (
            'infrastructure.renderers.UTF8JSONRenderer',
        ),
    },
)
_cache_overrides.enable()
