"""
Modelos del módulo de Layout.

Define la jerarquía física del almacén: Zona -> Pasillo -> Estante -> Nivel -> Ubicación.
También incluye los modelos Nodo y Conexión para la representación de rutas y navegación
dentro del almacén.
"""

import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Zona(AuditableBaseModel):
    """Representa una zona funcional dentro de un almacén.

    Relación FK:
        idalmacen -> Almacen: Cada zona pertenece a un único almacén.

    Campos más importantes:
        nombre: Nombre descriptivo de la zona (ej. "Zona A").
        codigo: Código interno único por almacén.
        tipo: Tipo de zona (recepción, almacenamiento, despacho, picking, devoluciones).
        x, y, ancho, alto: Posición y dimensiones para la representación visual.
        color: Color hexadecimal para la interfaz gráfica.
    """
    TIPO_CHOICES = [
        ('recepcion', 'Recepción'),
        ('almacenamiento', 'Almacenamiento'),
        ('despacho', 'Despacho'),
        ('picking', 'Picking'),
        ('devoluciones', 'Devoluciones'),
    ]
    idzona = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idalmacen = models.ForeignKey('empresa.Almacen', on_delete=models.CASCADE, db_column='idalmacen')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    ancho = models.IntegerField(default=100)
    alto = models.IntegerField(default=100)
    color = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        app_label = 'layout'  # Etiqueta de la aplicación Django
        db_table = 'zona'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Zona'
        verbose_name_plural = 'Zonas'
        unique_together = ('idalmacen', 'codigo')  # El código de zona es único por almacén

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Pasillo(AuditableBaseModel):
    """Representa un pasillo dentro de una zona del almacén.

    Relación FK:
        idzona -> Zona: Cada pasillo pertenece a una zona específica.

    Campos más importantes:
        nombre: Nombre descriptivo del pasillo.
        codigo: Código interno único por zona.
        orientacion: Dirección del pasillo (horizontal o vertical).
        x, y, ancho, largo: Posición y dimensiones para representación visual.
    """
    idpasillo = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idzona = models.ForeignKey(Zona, on_delete=models.CASCADE, db_column='idzona')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    ancho = models.IntegerField(default=40)
    largo = models.IntegerField(default=60)
    orientacion = models.CharField(max_length=10, choices=[('horizontal', 'Horizontal'), ('vertical', 'Vertical')], default='horizontal')

    class Meta:
        app_label = 'layout'
        db_table = 'pasillo'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Pasillo'
        verbose_name_plural = 'Pasillos'
        unique_together = ('idzona', 'codigo')  # El código de pasillo es único por zona

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Estante(AuditableBaseModel):
    """Representa un estante o rack ubicado en un pasillo.

    Relación FK:
        idpasillo -> Pasillo: Cada estante pertenece a un pasillo.

    Campos más importantes:
        nombre: Nombre descriptivo del estante.
        codigo: Código interno único por pasillo.
        lado: Lado del pasillo donde se ubica (izquierda o derecha).
        cantidadniveles: Número de niveles que tiene el estante.
        ancho, alto, profundidad: Dimensiones físicas del estante.
    """
    idestante = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idpasillo = models.ForeignKey(Pasillo, on_delete=models.CASCADE, db_column='idpasillo')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    ancho = models.IntegerField(default=20)
    alto = models.IntegerField(default=30)
    profundidad = models.IntegerField(default=20)
    lado = models.CharField(max_length=10, choices=[('izquierda', 'Izquierda'), ('derecha', 'Derecha')], default='derecha')
    cantidadniveles = models.IntegerField(default=3)

    class Meta:
        app_label = 'layout'
        db_table = 'estante'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Estante'
        verbose_name_plural = 'Estantes'
        unique_together = ('idpasillo', 'codigo')  # El código de estante es único por pasillo

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Nivel(AuditableBaseModel):
    """Representa un nivel horizontal dentro de un estante.

    Relación FK:
        idestante -> Estante: Cada nivel pertenece a un estante.

    Campos más importantes:
        numero: Número de nivel (1, 2, 3, ...) dentro del estante.
        altura: Altura del nivel en unidades de medida.
        unique_together: El número de nivel debe ser único dentro de un mismo estante.
    """
    idnivel = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idestante = models.ForeignKey(Estante, on_delete=models.CASCADE, db_column='idestante')
    nombre = models.CharField(max_length=100)
    numero = models.IntegerField()
    altura = models.IntegerField(default=10)

    class Meta:
        app_label = 'layout'
        db_table = 'nivel'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Nivel'
        verbose_name_plural = 'Niveles'
        unique_together = ('idestante', 'numero')  # El número de nivel es único por estante

    def __str__(self):
        return f"Nivel {self.numero} — {self.nombre}"


class Ubicacion(AuditableBaseModel):
    """Representa una ubicación física específica dentro de un nivel.

    Es la unidad más atómica del layout: aquí se almacena físicamente el inventario.

    Relación FK:
        idnivel -> Nivel: Cada ubicación pertenece a un nivel.

    Campos más importantes:
        codigo: Código único que identifica la ubicación (ej. A-01-01-001).
        capacidadpeso: Capacidad máxima de peso soportada.
        capacidadvolumen: Capacidad máxima de volumen.
        estado_ubicacion: Estado actual (disponible, ocupada, reservada, bloqueada).
        x, y: Coordenadas para representación visual dentro del nivel.
    """
    idubicacion = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idnivel = models.ForeignKey(Nivel, on_delete=models.CASCADE, db_column='idnivel')
    codigo = models.CharField(max_length=30)
    capacidadpeso = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    capacidadvolumen = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estado_ubicacion = models.CharField(
        max_length=15, default='disponible',
        choices=[('disponible', 'Disponible'), ('ocupada', 'Ocupada'), ('reservada', 'Reservada'), ('bloqueada', 'Bloqueada')]
    )
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)

    class Meta:
        app_label = 'layout'
        db_table = 'ubicacion'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        unique_together = ('idnivel', 'codigo')  # El código de ubicación es único por nivel

    def __str__(self):
        return self.codigo


class Nodo(AuditableBaseModel):
    """Representa un nodo en el grafo de navegación del almacén.

    Los nodos se conectan entre sí mediante Conexiones para formar rutas
    de desplazamiento dentro del almacén (ej. desde recepción hasta una ubicación).

    Relación FK:
        idalmacen -> Almacen: Cada nodo pertenece a un almacén.
        idubicacion -> Ubicacion (opcional): Nodo asociado a una ubicación física.

    Campos más importantes:
        tipo: Tipo de nodo (entrada, salida, esquina, intersección, punto_recogida).
        coordenada_x, coordenada_y: Coordenadas en el plano del almacén.
    """
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('esquina', 'Esquina'),
        ('interseccion', 'Intersección'),
        ('punto_recogida', 'Punto de Recogida'),
    ]
    idnodo = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idalmacen = models.ForeignKey('empresa.Almacen', on_delete=models.CASCADE, db_column='idalmacen')
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    coordenada_x = models.IntegerField()
    coordenada_y = models.IntegerField()
    idubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, blank=True, db_column='idubicacion')

    class Meta:
        app_label = 'layout'
        db_table = 'nodo'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Nodo'
        verbose_name_plural = 'Nodos'
        # Sin unique_together: un nodo puede aparecer varias veces si se necesitan nodos duplicados

    def __str__(self):
        return f"{self.nombre} ({self.tipo}) [{self.coordenada_x}, {self.coordenada_y}]"


class Conexion(AuditableBaseModel):
    """Representa una conexión o arista entre dos nodos del grafo de navegación.

    Relación FK:
        idnodoorigen -> Nodo: Nodo de inicio de la conexión.
        idnododestino -> Nodo: Nodo de destino de la conexión.
        Ambos con related_name para acceso inverso diferenciado.

    Campos más importantes:
        distancia: Distancia en metros entre los dos nodos.
        tipo: Tipo de conexión (pasillo, cruce, acceso directo).
        bidireccional: Indica si se puede recorrer en ambos sentidos.
    """
    TYPE_CHOICES = [
        ('pasillo', 'Pasillo'),
        ('cruce', 'Cruce'),
        ('acceso', 'Acceso Directo'),
    ]
    idconexion = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idnodoorigen = models.ForeignKey(Nodo, on_delete=models.CASCADE, related_name='conexiones_salida', db_column='idnodoorigen')
    idnododestino = models.ForeignKey(Nodo, on_delete=models.CASCADE, related_name='conexiones_entrada', db_column='idnododestino')
    distancia = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=20, choices=TYPE_CHOICES, default='pasillo')
    bidireccional = models.BooleanField(default=True)

    class Meta:
        app_label = 'layout'
        db_table = 'conexion'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Conexión'
        verbose_name_plural = 'Conexiones'
        unique_together = ('idnodoorigen', 'idnododestino')  # Solo una conexión por par origen-destino

    def __str__(self):
        return f"{self.idnodoorigen.nombre} → {self.idnododestino.nombre} ({self.distancia}m)"
