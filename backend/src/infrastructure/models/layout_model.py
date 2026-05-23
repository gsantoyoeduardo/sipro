import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Zona(AuditableBaseModel):
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
        app_label = 'layout'
        db_table = 'zona'
        verbose_name = 'Zona'
        verbose_name_plural = 'Zonas'
        unique_together = ('idalmacen', 'codigo')

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Pasillo(AuditableBaseModel):
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
        db_table = 'pasillo'
        verbose_name = 'Pasillo'
        verbose_name_plural = 'Pasillos'
        unique_together = ('idzona', 'codigo')

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Estante(AuditableBaseModel):
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
        db_table = 'estante'
        verbose_name = 'Estante'
        verbose_name_plural = 'Estantes'
        unique_together = ('idpasillo', 'codigo')

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Nivel(AuditableBaseModel):
    idnivel = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idestante = models.ForeignKey(Estante, on_delete=models.CASCADE, db_column='idestante')
    nombre = models.CharField(max_length=100)
    numero = models.IntegerField()
    altura = models.IntegerField(default=10)

    class Meta:
        app_label = 'layout'
        db_table = 'nivel'
        verbose_name = 'Nivel'
        verbose_name_plural = 'Niveles'
        unique_together = ('idestante', 'numero')

    def __str__(self):
        return f"Nivel {self.numero} — {self.nombre}"


class Ubicacion(AuditableBaseModel):
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
        db_table = 'ubicacion'
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        unique_together = ('idnivel', 'codigo')

    def __str__(self):
        return self.codigo


class Nodo(AuditableBaseModel):
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
        db_table = 'nodo'
        verbose_name = 'Nodo'
        verbose_name_plural = 'Nodos'

    def __str__(self):
        return f"{self.nombre} ({self.tipo}) [{self.coordenada_x}, {self.coordenada_y}]"


class Conexion(AuditableBaseModel):
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
        db_table = 'conexion'
        verbose_name = 'Conexión'
        verbose_name_plural = 'Conexiones'
        unique_together = ('idnodoorigen', 'idnododestino')

    def __str__(self):
        return f"{self.idnodoorigen.nombre} → {self.idnododestino.nombre} ({self.distancia}m)"
