"""Repositorios de la capa de infraestructura para la gestión de empresas.

Proporciona el acceso a datos (CRUD + consultas específicas) para las
entidades **Empresa**, **Sucursal** y **Almacén**, utilizando el ORM de
Django sobre el esquema ``public`` de la base de datos.
"""

import uuid

from infrastructure.models.empresa_model import Almacen, Empresa, Sucursal

from .base_repository import BaseRepository


class EmpresaRepository(BaseRepository[Empresa]):
    """Repositorio para la entidad Empresa (razón social, RUC, datos fiscales)."""

    def __init__(self):
        super().__init__(Empresa)

    def get_sucursales(self, idempresa: uuid.UUID):
        """Retorna todas las sucursales de una empresa."""
        return Sucursal.objects.filter(idempresa_id=idempresa)


class SucursalRepository(BaseRepository[Sucursal]):
    """Repositorio para la entidad Sucursal (sedes de una empresa)."""

    def __init__(self):
        super().__init__(Sucursal)

    def get_by_empresa(self, idempresa: uuid.UUID):
        """Retorna las sucursales pertenecientes a una empresa."""
        return Sucursal.objects.filter(idempresa_id=idempresa)

    def get_almacenes(self, idsucursal: uuid.UUID):
        """Retorna los almacenes de una sucursal."""
        return Almacen.objects.filter(idsucursal_id=idsucursal)


class AlmacenRepository(BaseRepository[Almacen]):
    """Repositorio para la entidad Almacén (depósitos físicos/logísticos)."""

    def __init__(self):
        super().__init__(Almacen)

    def get_by_sucursal(self, idsucursal: uuid.UUID):
        """Retorna los almacenes de una sucursal."""
        return Almacen.objects.filter(idsucursal_id=idsucursal)
