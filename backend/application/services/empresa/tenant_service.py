import uuid
import os
import django
from django.conf import settings
from django.db import connection
from infrastructure.repositories.empresa_repo import EmpresaRepository

empresa_repo = EmpresaRepository()


class TenantService:
    @staticmethod
    def crear_schema_tenant(idempresa: uuid.UUID):
        schema_name = f"empresa_{idempresa}".replace('-', '_')
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\"")
        return schema_name

    @staticmethod
    def ejecutar_migraciones_tenant(schema_name: str):
        from django.core.management import call_command
        original_search_path = connection.settings_dict.get('OPTIONS', {}).get('options', {}).get('-c search_path')
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SET search_path TO \"{schema_name}\", public")
            call_command('migrate', run_syncdb=True, verbosity=0)
        finally:
            if original_search_path:
                with connection.cursor() as cursor:
                    cursor.execute(f"SET search_path TO {original_search_path}")

    @staticmethod
    def seed_datos_tenant(schema_name: str, empresa):
        from django.core.management import call_command
        original_search_path = connection.settings_dict.get('OPTIONS', {}).get('options', {}).get('-c search_path')
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SET search_path TO \"{schema_name}\", public")
            call_command('seed_demo', empresa_id=str(empresa.idempresa), verbosity=0)
        finally:
            if original_search_path:
                with connection.cursor() as cursor:
                    cursor.execute(f"SET search_path TO {original_search_path}")
