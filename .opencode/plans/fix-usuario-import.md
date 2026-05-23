# Fix: NameError en tenant_login - Usuario no definido

## Problema
`NameError at /auth/tenant/login/` - `name 'Usuario' is not defined`

## Causa
En `backend/src/application/seguridad/auth_service.py` línea 76, se usa `Usuario.objects.filter()` pero el modelo `Usuario` nunca se importa en el método `tenant_login`. Solo se importa `Empresa`.

## Solución
Agregar el import faltante en `tenant_login`:

**Archivo:** `backend/src/application/seguridad/auth_service.py`

**Línea 70-71, cambiar:**
```python
from src.infrastructure.models.empresa_model import Empresa
```

**Por:**
```python
from src.infrastructure.models.empresa_model import Empresa
from src.infrastructure.models.seguridad_model import Usuario
```

## Verificación
Después del fix, reiniciar el servidor Django y probar:
```bash
curl -X POST http://localhost/auth/tenant/login/ \
  -H "Content-Type: application/json" \
  -d '{"ruc":"20123456789","usuario":"supervisor1","password":"demo1234"}'
```
