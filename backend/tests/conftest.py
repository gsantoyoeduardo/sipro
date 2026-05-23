import uuid
import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from src.infrastructure.models.seguridad_model import Usuario
from src.infrastructure.models.empresa_model import Empresa


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def empresa():
    empresa, _ = Empresa.objects.get_or_create(
        ruc='20123456789',
        defaults={
            'razonsocial': 'Test S.A.C.',
            'nombrecomercial': 'Test',
            'correo': 'test@test.pe',
        },
    )
    return empresa


@pytest.fixture
def admin_sistema(db):
    user, _ = Usuario.objects.get_or_create(
        usuario='admin',
        defaults={
            'correo': 'admin@sipro.com',
            'nombres': 'Admin',
            'apellidos': 'Sistema',
            'tipo_usuario': 'admin_sistema',
            'is_staff': True,
            'is_superuser': True,
        },
    )
    user.set_password('admin1234')
    user.save(update_fields=['password'])
    return user


@pytest.fixture
def admin_empresa(db, empresa):
    user, _ = Usuario.objects.get_or_create(
        usuario='admin_emp',
        defaults={
            'correo': 'admin_emp@test.pe',
            'nombres': 'Admin',
            'apellidos': 'Empresa',
            'idempresa': empresa,
            'tipo_usuario': 'admin_empresa',
        },
    )
    user.set_password('test1234')
    user.save(update_fields=['password'])
    return user


@pytest.fixture
def operador(db, empresa):
    user, _ = Usuario.objects.get_or_create(
        usuario='operario_test',
        defaults={
            'correo': 'operario@test.pe',
            'nombres': 'Operario',
            'apellidos': 'Test',
            'idempresa': empresa,
            'tipo_usuario': 'operador',
        },
    )
    user.set_password('test1234')
    user.save(update_fields=['password'])
    return user


@pytest.fixture
def portal_auth_headers(api_client, admin_sistema):
    response = api_client.post('/portal/auth/', {
        'usuario': 'admin',
        'password': 'admin1234',
    }, format='json')
    token = response.data['access']
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


@pytest.fixture
def tenant_auth_headers(api_client, admin_empresa, empresa):
    response = api_client.post('/tenant/auth/', {
        'ruc': '20123456789',
        'usuario': 'admin_emp',
        'password': 'test1234',
    }, format='json')
    token = response.data['access']
    return {
        'HTTP_AUTHORIZATION': f'Bearer {token}',
        'HTTP_X_TENANT_ID': str(empresa.idempresa),
    }
