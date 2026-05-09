import urllib.request, json

BASE = 'http://127.0.0.1:8005'

# Login
data = json.dumps({'usuario': 'admin', 'password': 'Sipro2026!'}).encode()
req = urllib.request.Request(f'{BASE}/auth/login/', data=data,
                             headers={'Content-Type': 'application/json'}, method='POST')
resp = urllib.request.urlopen(req, timeout=5)
result = json.loads(resp.read())
token = result['access']
print(f'[OK] Login: {result["user"]["usuario"]}')

# Auth me
req2 = urllib.request.Request(f'{BASE}/auth/me/',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp2 = urllib.request.urlopen(req2, timeout=5)
me = json.loads(resp2.read())
print(f'[OK] Me: {me["usuario"]} - {me["nombres"]} {me["apellidos"]}')

# Usuarios
req3 = urllib.request.Request(f'{BASE}/usuarios/',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp3 = urllib.request.urlopen(req3, timeout=5)
users = json.loads(resp3.read())
print(f'[OK] Usuarios: {len(users) if isinstance(users, list) else users["count"]} users')

# Roles
req4 = urllib.request.Request(f'{BASE}/roles/',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp4 = urllib.request.urlopen(req4, timeout=5)
roles = json.loads(resp4.read())
print(f'[OK] Roles: {len(roles) if isinstance(roles, list) else roles["count"]} roles')

# Permisos
req5 = urllib.request.Request(f'{BASE}/permisos/',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp5 = urllib.request.urlopen(req5, timeout=5)
permisos = json.loads(resp5.read())
print(f'[OK] Permisos: {len(permisos) if isinstance(permisos, list) else permisos["count"]} permisos')

# Sesiones
req6 = urllib.request.Request(f'{BASE}/sesiones/?activa=true',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp6 = urllib.request.urlopen(req6, timeout=5)
sesiones = json.loads(resp6.read())
print(f'[OK] Sesiones activas: {len(sesiones) if not isinstance(sesiones, dict) else sesiones["count"]}')

# Empresas (is_admin)
req7 = urllib.request.Request(f'{BASE}/empresas/',
                              headers={'Authorization': f'Bearer {token}'}, method='GET')
resp7 = urllib.request.urlopen(req7, timeout=5)
empresas = json.loads(resp7.read())
print(f'[OK] Empresas: {len(empresas) if isinstance(empresas, list) else empresas["count"]}')

# Refresh
data_refresh = json.dumps({'refresh': result['refresh']}).encode()
req8 = urllib.request.Request(f'{BASE}/auth/refresh/', data=data_refresh,
                              headers={'Content-Type': 'application/json'}, method='POST')
resp8 = urllib.request.urlopen(req8, timeout=5)
refresh_result = json.loads(resp8.read())
print(f'[OK] Refresh: new access token: {refresh_result["access"][:30]}...')

print('\nAll endpoints tested successfully!')
