from datetime import timedelta
from pathlib import Path

from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-ci-default-key-not-for-prod')

DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1,backend').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'csp',
]

try:
    import drf_spectacular  # noqa: F401
    THIRD_PARTY_APPS += ['drf_spectacular']
except ImportError:
    pass

LOCAL_APPS = [
    'apps.base',
    'apps.empresa',
    'apps.seguridad',
    'apps.layout',
    'apps.inventario',
    'apps.picking',
    'apps.transferencia',

    'portal',
    'tenant',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'infrastructure.middleware.tenant_middleware.TenantMiddleware',
    'infrastructure.middleware.tenant_guard.TenantGuardMiddleware',
    'infrastructure.middleware.portal_guard.PortalGuardMiddleware',
    'infrastructure.middleware.audit_middleware.AuditMiddleware',
]

ROOT_URLCONF = 'config.urls'

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

WSGI_APPLICATION = 'config.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'static'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'seguridad.Usuario'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'infrastructure.auth.jwt_auth.TenantJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'infrastructure.permissions.RolePermission',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'PAGE_SIZE': 25,
    'DEFAULT_RENDERER_CLASSES': (
        'infrastructure.renderers.UTF8JSONRenderer',
    ),
    'DEFAULT_SCHEMA_CLASS': 'infrastructure.swagger_utils.TagsAutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'USER_ID_FIELD': 'idusuario',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

FERNET_KEYS = [config('FERNET_KEY')]

if not DEBUG:
    if not SECRET_KEY or SECRET_KEY.startswith('django-insecure'):
        raise RuntimeError('DJANGO_SECRET_KEY must be changed in production')
    fernet_default = 'dGhpcyBpcyBhIHRlc3QgZmVybmV0IGtleSBmb3IgZGV2=='
    if any(k == fernet_default for k in FERNET_KEYS):
        raise RuntimeError('FERNET_KEY must be changed in production')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
    }
}

REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
]
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100000/hour',
    'user': '500000/hour',
}

CSRF_TRUSTED_ORIGINS = [origin for origin in config('CSRF_TRUSTED_ORIGINS', default='http://localhost:8080,http://localhost:8081,http://127.0.0.1:8080,http://127.0.0.1:8081').split(',') if origin]

CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:8080,http://localhost:8081').split(',')
CORS_ALLOW_CREDENTIALS = True

CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'style-src': ("'self'", "'unsafe-inline'"),
        'script-src': ("'self'",),
        'img-src': ("'self'", "data:"),
        'font-src': ("'self'",),
    }
}

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True

SPECTACULAR_SETTINGS = {
    'TITLE': 'SIPRO API',
    'DESCRIPTION': 'Sistema SIPRO WMS',
    'VERSION': 'v1',
    'CONTACT': {'email': 'admin@sipro.com'},
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'] if DEBUG else ['rest_framework.permissions.IsAuthenticated'],
    'SCHEMA_PATH_PREFIX': r'/api/',
    'POSTPROCESSING_HOOKS': ['infrastructure.swagger_hooks.add_examples'],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'defaultModelRendering': 'example',
        'defaultModelsExpandDepth': 3,
        'docExpansion': 'list',
        'displayOperationId': False,
        'tryItOutEnabled': True,
    },
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
