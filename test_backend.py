import requests
import json

# Step 1: Login directly to backend
print("=== Step 1: Login ===")
r1 = requests.post(
    'http://localhost:8000/auth/portal/login/',
    json={"usuario": "admin", "password": "gsantoyoeduardo"}
)
print(f"Login Status: {r1.status_code}")
print(f"Login Content: {r1.text[:200]}")

if r1.status_code == 200:
    data = r1.json()
    token = data.get('access')
    print(f"\nToken: {token[:50]}...")
    
    # Step 2: Create empresa
    print("\n=== Step 2: Create Empresa ===")
    r2 = requests.post(
        'http://localhost:8000/registro/empresas/',
        json={
            "razonsocial": "Test Company",
            "ruc": "12345678901",
            "correo": "test@test.com",
            "admin_usuario": "testadmin",
            "admin_nombres": "Test",
            "admin_correo": "test@test.com",
            "admin_password": "test1234"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Create Status: {r2.status_code}")
    print(f"Create Content: {r2.text[:500]}")
    
    # Step 3: List empresas
    print("\n=== Step 3: List Empresas ===")
    r3 = requests.get(
        'http://localhost:8000/empresas/',
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"List Status: {r3.status_code}")
    print(f"List Content: {r3.text[:500]}")
else:
    print("Login failed")
