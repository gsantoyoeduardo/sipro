"""Repositorios de la capa de infraestructura para la gestión de empresas.

Proporciona el acceso a datos (CRUD + consultas específicas) para las
entidades **Empresa**, **Sucursal** y **Almacén**, utilizando el ORM de
Django sobre el esquema ``public`` de la base de datos.
"""

import uuid
from src.infrastructure.models.empresa_model import Empresa, Sucursal, Almacen

class EmpresaRepository:
    """Repositorio para la entidad Empresa (razón social, RUC, datos fiscales)."""

    def get_all(self):
        """Retorna todas las empresas registradas."""
        return Empresa.objects.all()

    def get_by_id(self, idempresa: uuid.UUID):
        """Obtiene una empresa por su UUID.
        
        Lanza ``Empresa.DoesNotExist`` si no existe.
        """
        return Empresa.objects.get(idempresa=idempresa)

    def create(self, data: dict):
        """Crea una nueva empresa con los datos proporcionados."""
        return Empresa.objects.create(**data)

    def update(self, idempresa: uuid.UUID, data: dict):
        """Actualiza los campos indicados de una empresa.

        Itera sobre el diccionario ``data`` y aplica cada atributo
        mediante ``setattr``, luego guarda.
        """
        empresa = self.get_by_id(idempresa)
        for k, v in data.items():
            setattr(empresa, k, v)
        empresa.save()
        return empresa

    def delete(self, idempresa: uuid.UUID):
        """Elimina (borrado físico) una empresa."""
        empresa = self.get_by_id(idempresa)
        empresa.delete()

    def toggle_estado(self, idempresa: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo de la empresa.
        
        Returns:
            bool: Nuevo estado después del cambio.
        """
        empresa = self.get_by_id(idempresa)
        empresa.estado = not empresa.estado
        empresa.save(update_fields=['estado'])
        return empresa.estado

    def get_sucursales(self, idempresa: uuid.UUID):
        """Retorna todas las sucursales de una empresa."""
        return Sucursal.objects.filter(idempresa_id=idempresa)


class SucursalRepository:
    """Repositorio para la entidad Sucursal (sedes de una empresa)."""

    def get_all(self, idempresa: uuid.UUID | None = None):
        """Retorna todas las sucursales, filtradas por empresa si se indica."""
        qs = Sucursal.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idsucursal: uuid.UUID):
        """Obtiene una sucursal por su UUID."""
        return Sucursal.objects.get(idsucursal=idsucursal)

    def create(self, data: dict):
        """Crea una nueva sucursal."""
        return Sucursal.objects.create(**data)

    def update(self, idsucursal: uuid.UUID, data: dict):
        """Actualiza los campos de una sucursal."""
        obj = self.get_by_id(idsucursal)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idsucursal: uuid.UUID):
        """Elimina una sucursal."""
        self.get_by_id(idsucursal).delete()

    def toggle_estado(self, idsucursal: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo de la sucursal."""
        obj = self.get_by_id(idsucursal)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_by_empresa(self, idempresa: uuid.UUID):
        """Retorna las sucursales pertenecientes a una empresa."""
        return Sucursal.objects.filter(idempresa_id=idempresa)

    def get_almacenes(self, idsucursal: uuid.UUID):
        """Retorna los almacenes de una sucursal."""
        return Almacen.objects.filter(idsucursal_id=idsucursal)


class AlmacenRepository:
    """Repositorio para la entidad Almacén (depósitos físicos/logísticos)."""

    def get_all(self, idsucursal: uuid.UUID | None = None):
        """Retorna todos los almacenes, filtrados por sucursal si se indica."""
        qs = Almacen.objects.all()
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        return qs

    def get_by_id(self, idalmacen: uuid.UUID):
        """Obtiene un almacén por su UUID."""
        return Almacen.objects.get(idalmacen=idalmacen)

    def create(self, data: dict):
        """Crea un nuevo almacén."""
        return Almacen.objects.create(**data)

    def update(self, idalmacen: uuid.UUID, data: dict):
        """Actualiza los campos de un almacén."""
        obj = self.get_by_id(idalmacen)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idalmacen: uuid.UUID):
        """Elimina un almacén."""
        self.get_by_id(idalmacen).delete()

    def toggle_estado(self, idalmacen: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del almacén."""
        obj = self.get_by_id(idalmacen)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_by_sucursal(self, idsucursal: uuid.UUID):
        """Retorna los almacenes de una sucursal."""
        return Almacen.objects.filter(idsucursal_id=idsucursal)
