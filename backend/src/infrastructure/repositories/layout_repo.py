import uuid
from src.infrastructure.models.layout_model import Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion

class ZonaRepository:
    def get_all(self, idalmacen: uuid.UUID | None = None):
        qs = Zona.objects.all()
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    def get_by_id(self, idzona: uuid.UUID):
        return Zona.objects.get(idzona=idzona)

    def create(self, data: dict):
        return Zona.objects.create(**data)

    def update(self, idzona: uuid.UUID, data: dict):
        obj = self.get_by_id(idzona)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idzona: uuid.UUID):
        self.get_by_id(idzona).delete()

    def toggle_estado(self, idzona: uuid.UUID) -> bool:
        obj = self.get_by_id(idzona)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_pasillos(self, idzona: uuid.UUID):
        return Pasillo.objects.filter(idzona_id=idzona)


class PasilloRepository:
    def get_all(self, idzona: uuid.UUID | None = None):
        qs = Pasillo.objects.all()
        if idzona:
            qs = qs.filter(idzona_id=idzona)
        return qs

    def get_by_id(self, idpasillo: uuid.UUID):
        return Pasillo.objects.get(idpasillo=idpasillo)

    def create(self, data: dict):
        return Pasillo.objects.create(**data)

    def update(self, idpasillo: uuid.UUID, data: dict):
        obj = self.get_by_id(idpasillo)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idpasillo: uuid.UUID):
        self.get_by_id(idpasillo).delete()

    def toggle_estado(self, idpasillo: uuid.UUID) -> bool:
        obj = self.get_by_id(idpasillo)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_estantes(self, idpasillo: uuid.UUID):
        return Estante.objects.filter(idpasillo_id=idpasillo)


class EstanteRepository:
    def get_all(self, idpasillo: uuid.UUID | None = None):
        qs = Estante.objects.all()
        if idpasillo:
            qs = qs.filter(idpasillo_id=idpasillo)
        return qs

    def get_by_id(self, idestante: uuid.UUID):
        return Estante.objects.get(idestante=idestante)

    def create(self, data: dict):
        return Estante.objects.create(**data)

    def update(self, idestante: uuid.UUID, data: dict):
        obj = self.get_by_id(idestante)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idestante: uuid.UUID):
        self.get_by_id(idestante).delete()

    def toggle_estado(self, idestante: uuid.UUID) -> bool:
        obj = self.get_by_id(idestante)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_niveles(self, idestante: uuid.UUID):
        return Nivel.objects.filter(idestante_id=idestante)


class NivelRepository:
    def get_all(self, idestante: uuid.UUID | None = None):
        qs = Nivel.objects.all()
        if idestante:
            qs = qs.filter(idestante_id=idestante)
        return qs

    def get_by_id(self, idnivel: uuid.UUID):
        return Nivel.objects.get(idnivel=idnivel)

    def create(self, data: dict):
        return Nivel.objects.create(**data)

    def update(self, idnivel: uuid.UUID, data: dict):
        obj = self.get_by_id(idnivel)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idnivel: uuid.UUID):
        self.get_by_id(idnivel).delete()

    def toggle_estado(self, idnivel: uuid.UUID) -> bool:
        obj = self.get_by_id(idnivel)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_ubicaciones(self, idnivel: uuid.UUID):
        return Ubicacion.objects.filter(idnivel_id=idnivel)


class UbicacionRepository:
    def get_all(self, idnivel: uuid.UUID | None = None):
        qs = Ubicacion.objects.all()
        if idnivel:
            qs = qs.filter(idnivel_id=idnivel)
        return qs

    def get_by_id(self, idubicacion: uuid.UUID):
        return Ubicacion.objects.get(idubicacion=idubicacion)

    def create(self, data: dict):
        return Ubicacion.objects.create(**data)

    def update(self, idubicacion: uuid.UUID, data: dict):
        obj = self.get_by_id(idubicacion)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idubicacion: uuid.UUID):
        self.get_by_id(idubicacion).delete()

    def toggle_estado(self, idubicacion: uuid.UUID) -> bool:
        obj = self.get_by_id(idubicacion)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def cambiar_estado_ubicacion(self, idubicacion: uuid.UUID, estado_ubicacion: str):
        obj = self.get_by_id(idubicacion)
        obj.estado_ubicacion = estado_ubicacion
        obj.save(update_fields=['estado_ubicacion'])
        return obj


class NodoRepository:
    def get_all(self, idalmacen: uuid.UUID | None = None):
        qs = Nodo.objects.all()
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    def get_by_id(self, idnodo: uuid.UUID):
        return Nodo.objects.get(idnodo=idnodo)

    def create(self, data: dict):
        return Nodo.objects.create(**data)

    def update(self, idnodo: uuid.UUID, data: dict):
        obj = self.get_by_id(idnodo)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idnodo: uuid.UUID):
        self.get_by_id(idnodo).delete()

    def toggle_estado(self, idnodo: uuid.UUID) -> bool:
        obj = self.get_by_id(idnodo)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_conexiones_salida(self, idnodo: uuid.UUID):
        return Conexion.objects.filter(idnodoorigen_id=idnodo)

    def get_conexiones_entrada(self, idnodo: uuid.UUID):
        return Conexion.objects.filter(idnododestino_id=idnodo)


class ConexionRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Conexion.objects.select_related('idnodoorigen__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idnodoorigen__idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, idconexion: uuid.UUID):
        return Conexion.objects.get(idconexion=idconexion)

    def create(self, data: dict):
        return Conexion.objects.create(**data)

    def update(self, idconexion: uuid.UUID, data: dict):
        obj = self.get_by_id(idconexion)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idconexion: uuid.UUID):
        self.get_by_id(idconexion).delete()

    def toggle_estado(self, idconexion: uuid.UUID) -> bool:
        obj = self.get_by_id(idconexion)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado
