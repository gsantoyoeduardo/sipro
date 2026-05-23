import pytest
from rest_framework import status


class TestPortalAuth:
    def test_login_success(self, api_client, admin_sistema):
        response = api_client.post('/portal/auth/', {
            'usuario': 'admin',
            'password': 'admin1234',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_wrong_password(self, api_client):
        response = api_client.post('/portal/auth/', {
            'usuario': 'admin',
            'password': 'wrong',
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        response = api_client.post('/portal/auth/', {
            'usuario': 'admin',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout(self, api_client, portal_auth_headers):
        from rest_framework_simplejwt.tokens import RefreshToken
        from src.infrastructure.models.seguridad_model import Usuario
        admin = Usuario.objects.get(usuario='admin')
        refresh = RefreshToken.for_user(admin)
        response = api_client.post('/portal/auth/logout/', {
            'refresh': str(refresh),
        }, format='json', **portal_auth_headers)
        assert response.status_code == status.HTTP_200_OK


class TestTenantAuth:
    def test_login_success(self, api_client, admin_empresa, empresa):
        response = api_client.post('/tenant/auth/', {
            'ruc': '20123456789',
            'usuario': 'admin_emp',
            'password': 'test1234',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_wrong_ruc(self, api_client):
        response = api_client.post('/tenant/auth/', {
            'ruc': '00000000000',
            'usuario': 'admin_emp',
            'password': 'test1234',
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_wrong_empresa_user(self, api_client, admin_sistema):
        response = api_client.post('/tenant/auth/', {
            'ruc': '20123456789',
            'usuario': 'admin',
            'password': 'admin1234',
        }, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        response = api_client.post('/tenant/auth/', {
            'usuario': 'admin_emp',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestAuthRefresh:
    def test_token_refresh(self, api_client, admin_sistema):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(admin_sistema)
        response = api_client.post('/auth/refresh/', {
            'refresh': str(refresh),
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data


class TestUnauthenticatedAccess:
    def test_tenant_endpoint_requires_auth(self, api_client):
        response = api_client.get('/tenant/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_portal_endpoint_requires_auth(self, api_client):
        response = api_client.get('/portal/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
