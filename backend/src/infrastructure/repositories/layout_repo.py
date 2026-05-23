"""Repositorios de la capa de infraestructura para el layout del almacén.

Proporciona acceso a datos (CRUD + consultas jerárquicas) para las
entidades del layout: **Zona**, **Pasillo**, **Estante**, **Nivel**,
**Ubicación**, **Nodo** y **Conexión**, todas bajo el esquema del tenant.
"""

import uuid
from src.infrastructure.models.layout_model import Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion

class ZonaRepository:
    """Repositorio para la entidad Zona (área funcional del almacén)."""

    def get_all(self, idalmacen: uuid.UUID | None = None):
        """Retorna todas las zonas, filtradas por almacén si se indica."""
        qs = Zona.objects.all()
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    def get_by_id(self, idzona: uuid.UUID):
        """Obtiene una zona por su UUID."""
        return Zona.objects.get(idzona=idzona)

    def create(self, data: dict):
        """Crea una nueva zona."""
        return Zona.objects.create(**data)

    def update(self, idzona: uuid.UUID, data: dict):
        """Actualiza los campos de una zona."""
        obj = self.get_by_id(idzona)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idzona: uuid.UUID):
        """Elimina una zona."""
        self.get_by_id(idzona).delete()

    def toggle_estado(self, idzona: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo de la zona."""
        obj = self.get_by_id(idzona)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_pasillos(self, idzona: uuid.UUID):
        """Retorna los pasillos que pertenecen a una zona."""
        return Pasillo.objects.filter(idzona_id=idzona)


class PasilloRepository:
    """Repositorio para la entidad Pasillo (corredor dentro de una zona)."""

    def get_all(self, idzona: uuid.UUID | None = None):
        """Retorna todos los pasillos, filtrados por zona si se indica."""
        qs = Pasillo.objects.all()
        if idzona:
            qs = qs.filter(idzona_id=idzona)
        return qs

    def get_by_id(self, idpasillo: uuid.UUID):
        """Obtiene un pasillo por su UUID."""
        return Pasillo.objects.get(idpasillo=idpasillo)

    def create(self, data: dict):
        """Crea un nuevo pasillo."""
        return Pasillo.objects.create(**data)

    def update(self, idpasillo: uuid.UUID, data: dict):
        """Actualiza los campos de un pasillo."""
        obj = self.get_by_id(idpasillo)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idpasillo: uuid.UUID):
        """Elimina un pasillo."""
        self.get_by_id(idpasillo).delete()

    def toggle_estado(self, idpasillo: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del pasillo."""
        obj = self.get_by_id(idpasillo)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_estantes(self, idpasillo: uuid.UUID):
        """Retorna los estantes que pertenecen a un pasillo."""
        return Estante.objects.filter(idpasillo_id=idpasillo)


class EstanteRepository:
    """Repositorio para la entidad Estante (estructura de almacenamiento)."""

    def get_all(self, idpasillo: uuid.UUID | None = None):
        """Retorna todos los estantes, filtrados por pasillo si se indica."""
        qs = Estante.objects.all()
        if idpasillo:
            qs = qs.filter(idpasillo_id=idpasillo)
        return qs

    def get_by_id(self, idestante: uuid.UUID):
        """Obtiene un estante por su UUID."""
        return Estante.objects.get(idestante=idestante)

    def create(self, data: dict):
        """Crea un nuevo estante."""
        return Estante.objects.create(**data)

    def update(self, idestante: uuid.UUID, data: dict):
        """Actualiza los campos de un estante."""
        obj = self.get_by_id(idestante)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idestante: uuid.UUID):
        """Elimina un estante."""
        self.get_by_id(idestante).delete()

    def toggle_estado(self, idestante: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del estante."""
        obj = self.get_by_id(idestante)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_niveles(self, idestante: uuid.UUID):
        """Retorna los niveles que pertenecen a un estante."""
        return Nivel.objects.filter(idestante_id=idestante)


class NivelRepository:
    """Repositorio para la entidad Nivel (altura/bandeja de un estante)."""

    def get_all(self, idestante: uuid.UUID | None = None):
        """Retorna todos los niveles, filtrados por estante si se indica."""
        qs = Nivel.objects.all()
        if idestante:
            qs = qs.filter(idestante_id=idestante)
        return qs

    def get_by_id(self, idnivel: uuid.UUID):
        """Obtiene un nivel por su UUID."""
        return Nivel.objects.get(idnivel=idnivel)

    def create(self, data: dict):
        """Crea un nuevo nivel."""
        return Nivel.objects.create(**data)

    def update(self, idnivel: uuid.UUID, data: dict):
        """Actualiza los campos de un nivel."""
        obj = self.get_by_id(idnivel)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idnivel: uuid.UUID):
        """Elimina un nivel."""
        self.get_by_id(idnivel).delete()

    def toggle_estado(self, idnivel: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del nivel."""
        obj = self.get_by_id(idnivel)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_ubicaciones(self, idnivel: uuid.UUID):
        """Retorna las ubicaciones que pertenecen a un nivel."""
        return Ubicacion.objects.filter(idnivel_id=idnivel)


class UbicacionRepository:
    """Repositorio para la entidad Ubicación (posición física final de almacenaje)."""

    def get_all(self, idnivel: uuid.UUID | None = None):
        """Retorna todas las ubicaciones, filtradas por nivel si se indica."""
        qs = Ubicacion.objects.all()
        if idnivel:
            qs = qs.filter(idnivel_id=idnivel)
        return qs

    def get_by_id(self, idubicacion: uuid.UUID):
        """Obtiene una ubicación por su UUID."""
        return Ubicacion.objects.get(idubicacion=idubicacion)

    def create(self, data: dict):
        """Crea una nueva ubicación."""
        return Ubicacion.objects.create(**data)

    def update(self, idubicacion: uuid.UUID, data: dict):
        """Actualiza los campos de una ubicación."""
        obj = self.get_by_id(idubicacion)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idubicacion: uuid.UUID):
        """Elimina una ubicación."""
        self.get_by_id(idubicacion).delete()

    def toggle_estado(self, idubicacion: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo de la ubicación."""
        obj = self.get_by_id(idubicacion)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def cambiar_estado_ubicacion(self, idubicacion: uuid.UUID, estado_ubicacion: str):
        """Cambia el estado operativo de la ubicación (libre, ocupada, bloqueada, etc.)."""
        obj = self.get_by_id(idubicacion)
        obj.estado_ubicacion = estado_ubicacion
        obj.save(update_fields=['estado_ubicacion'])
        return obj


class NodoRepository:
    """Repositorio para la entidad Nodo (punto del grafo de navegación)."""

    def get_all(self, idalmacen: uuid.UUID | None = None):
        """Retorna todos los nodos, filtrados por almacén si se indica."""
        qs = Nodo.objects.all()
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    def get_by_id(self, idnodo: uuid.UUID):
        """Obtiene un nodo por su UUID."""
        return Nodo.objects.get(idnodo=idnodo)

    def create(self, data: dict):
        """Crea un nuevo nodo."""
        return Nodo.objects.create(**data)

    def update(self, idnodo: uuid.UUID, data: dict):
        """Actualiza los campos de un nodo."""
        obj = self.get_by_id(idnodo)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idnodo: uuid.UUID):
        """Elimina un nodo."""
        self.get_by_id(idnodo).delete()

    def toggle_estado(self, idnodo: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del nodo."""
        obj = self.get_by_id(idnodo)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_conexiones_salida(self, idnodo: uuid.UUID):
        """Retorna las conexiones donde el nodo es origen."""
        return Conexion.objects.filter(idnodoorigen_id=idnodo)

    def get_conexiones_entrada(self, idnodo: uuid.UUID):
        """Retorna las conexiones donde el nodo es destino."""
        return Conexion.objects.filter(idnododestino_id=idnodo)


class ConexionRepository:
    """Repositorio para la entidad Conexión (arista del grafo de navegación)."""

    def get_all(self, idempresa: uuid.UUID | None = None):
        """Retorna todas las conexiones, filtradas por empresa si se indica.

        Utiliza ``select_related`` para optimizar las relaciones
        Nodo → Almacén → Sucursal → Empresa.
        """
        qs = Conexion.objects.select_related('idnodoorigen__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idnodoorigen__idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, idconexion: uuid.UUID):
        """Obtiene una conexión por su UUID."""
        return Conexion.objects.get(idconexion=idconexion)

    def create(self, data: dict):
        """Crea una nueva conexión entre dos nodos."""
        return Conexion.objects.create(**data)

    def update(self, idconexion: uuid.UUID, data: dict):
        """Actualiza los campos de una conexión."""
        obj = self.get_by_id(idconexion)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idconexion: uuid.UUID):
        """Elimina una conexión."""
        self.get_by_id(idconexion).delete()

    def toggle_estado(self, idconexion: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo de la conexión."""
        obj = self.get_by_id(idconexion)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado
