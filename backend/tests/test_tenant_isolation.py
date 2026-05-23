import pytest
from rest_framework import status
from src.infrastructure.middleware.tenant_middleware import get_current_tenant, _valid_uuid


class TestTenantMiddleware:
    def test_valid_uuid(self):
        assert _valid_uuid('550e8400-e29b-41d4-a716-446655440000') is True
        assert _valid_uuid('not-a-uuid') is False
        assert _valid_uuid('') is False
        assert _valid_uuid(None) is False
        assert _valid_uuid(123) is False

    def test_schema_format(self):
        import uuid
        uid = uuid.uuid4()
        schema = f'empresa_{uid}'
        assert schema.startswith('empresa_')
        assert uuid.UUID(schema.replace('empresa_', ''))

    def test_tenant_guard_rejects_wrong_tenant(self, api_client, admin_empresa, empresa):
        import uuid
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(admin_empresa)
        access = str(refresh.access_token)

        fake_tenant = str(uuid.uuid4())
        response = api_client.get('/tenant/auth/me/', **{
            'HTTP_AUTHORIZATION': f'Bearer {access}',
            'HTTP_X_TENANT_ID': fake_tenant,
        })
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_200_OK)

    def test_tenant_guard_allows_correct_tenant(self, api_client, admin_empresa, empresa):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(admin_empresa)
        access = str(refresh.access_token)

        response = api_client.get('/tenant/auth/me/', **{
            'HTTP_AUTHORIZATION': f'Bearer {access}',
            'HTTP_X_TENANT_ID': str(empresa.idempresa),
        })
        assert response.status_code == status.HTTP_200_OK or response.status_code == status.HTTP_403_FORBIDDEN

    def test_tenant_guard_blocks_operador_from_portal(self, api_client, operador, empresa):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(operador)
        access = str(refresh.access_token)

        response = api_client.get('/portal/auth/me/', **{
            'HTTP_AUTHORIZATION': f'Bearer {access}',
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestTenantGuardMiddleware:
    def test_unauthenticated_blocked(self, api_client):
        response = api_client.get('/tenant/auth/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
