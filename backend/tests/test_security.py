import uuid

import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from infrastructure.models.empresa_model import Empresa
from infrastructure.models.seguridad_model import Usuario


@pytest.mark.django_db
class TestTenantIsolation:

    def test_operador_no_accede_a_portal(self, api_client, operador):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(operador)
        access = str(refresh.access_token)
        response = api_client.get('/portal/api/empresas/', HTTP_AUTHORIZATION=f'Bearer {access}')
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)

    def test_admin_sistema_no_accede_a_tenant_sin_token(self, api_client):
        response = api_client.get('/tenant/api/inventario/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_admin_sistema_no_accede_a_portal_operador(self, api_client, operador):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(operador)
        access = str(refresh.access_token)
        response = api_client.get('/portal/api/empresas/', HTTP_AUTHORIZATION=f'Bearer {access}')
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED)

    def test_swagger_requiere_auth(self, api_client):
        response = api_client.get('/portal/swagger/')
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.django_db
class TestAuthSecurity:

    def test_password_reset_requiere_old_password(self, api_client, admin_sistema):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(admin_sistema)
        access = str(refresh.access_token)
        response = api_client.post(
            f'/portal/api/usuarios/{admin_sistema.idusuario}/reset-password/',
            {'new_password': 'nueva1234'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {access}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'old_password' in response.data.get('error', '')

    def test_password_reset_solo_propia_cuenta(self, api_client, admin_sistema, operador):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(admin_sistema)
        access = str(refresh.access_token)
        otro_uuid = operador.idusuario
        response = api_client.post(
            f'/portal/api/usuarios/{otro_uuid}/reset-password/',
            {'old_password': 'admin1234', 'new_password': 'nueva1234'},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {access}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_login_mensaje_generico(self, api_client):
        response = api_client.post('/portal/auth/', {
            'usuario': 'usuario_inexistente', 'password': 'cualquiercosa',
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert 'Credenciales inválidas' in data.get('error', '')


@pytest.mark.django_db
class TestRateLimit:

    def test_brute_force_rate_limit(self, api_client):
        ip = '1.2.3.4'
        cache_key = f'login_attempt_{ip}'
        cache.delete(cache_key)
        for _i in range(5):
            api_client.post('/portal/auth/', {
                'usuario': 'admin', 'password': 'wrong',
            }, format='json', REMOTE_ADDR=ip)
        response = api_client.post('/portal/auth/', {
            'usuario': 'admin', 'password': 'wrong',
        }, format='json', REMOTE_ADDR=ip)
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


@pytest.mark.django_db
class TestAuditSecurity:

    def test_audit_no_guarda_passwords(self, api_client, admin_sistema):
        from apps.base.audit_signals import serialize_instance
        data = serialize_instance(admin_sistema)
        if 'password' in data:
            assert data['password'] == '*** REDACTED ***'
