import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.test import Client

c = Client()

# Step 1: Login
print("=== Step 1: Login ===")
r = c.post(
    '/auth/portal/login/',
    data=json.dumps({"usuario": "admin", "password": "admin1234"}),
    content_type='application/json',
    HTTP_HOST='localhost'
)
print(f"Login Status: {r.status_code}")
print(f"Login Content: {r.content[:200]}")

if r.status_code == 200:
    d = json.loads(r.content)
    token = d.get('access')
    print(f"Token: {token[:50]}...")
    
    # Step 2: Create empresa
    print("\n=== Step 2: Create Empresa ===")
    r2 = c.post(
        '/admin/empresas/',
        data=json.dumps({
            "razonsocial": "Test Company",
            "ruc": "12345678901",
            "correo": "test@test.com",
            "admin_usuario": "testadmin",
            "admin_nombres": "Test",
            "admin_correo": "test@test.com",
            "admin_password": "test1234"
        }),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}',
        HTTP_HOST='localhost'
    )
    print(f"Create Status: {r2.status_code}")
    print(f"Create Content: {r2.content[:500]}")
else:
    print("Login failed, cannot test create")
