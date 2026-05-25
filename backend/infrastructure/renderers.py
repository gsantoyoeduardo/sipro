from rest_framework.renderers import JSONRenderer

class UTF8JSONRenderer(JSONRenderer):
    """
    Renderer JSON que no escapa caracteres con tildes ni ñ.

    Por defecto, Django REST Framework escapa caracteres no-ASCII
    (ej: 'José' → 'Jos\\u00e9'). Este renderer los conserva como UTF-8
    para que el frontend reciba texto legible sin necesidad de decodificar.
    """
    charset = 'utf-8'
    ensure_ascii = False
