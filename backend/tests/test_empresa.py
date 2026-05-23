import pytest
from rest_framework import status
from src.infrastructure.models.empresa_model import Empresa


class TestEmpresa:
    def test_list_empresas(self, api_client, portal_auth_headers, empresa):
        response = api_client.get('/portal/api/empresas/', **portal_auth_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_create_empresa_via_registro(self, api_client, portal_auth_headers):
        response = api_client.post('/portal/api/registro/', {
            'razonsocial': 'Nueva Empresa S.A.C.',
            'nombrecomercial': 'Nueva',
            'ruc': '10987654321',
            'correo': 'nueva@empresa.pe',
            'telefono': '01-555-0200',
            'direccion': 'Av. Nueva 456',
            'admin_usuario': 'admin_nueva',
            'admin_nombres': 'Admin Nueva',
            'admin_correo': 'admin@nueva.pe',
            'admin_password': 'segura123',
        }, format='json', **portal_auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        assert Empresa.objects.filter(ruc='10987654321').exists()

    def test_create_empresa_missing_required(self, api_client, portal_auth_headers):
        response = api_client.post('/portal/api/registro/', {
            'razonsocial': 'Incomplete',
        }, format='json', **portal_auth_headers)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_tenant_cannot_access_portal(self, api_client, tenant_auth_headers):
        response = api_client.get('/portal/api/empresas/', **tenant_auth_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
