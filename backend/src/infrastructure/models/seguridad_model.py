"""
Modelos del módulo de Seguridad.

Define la gestión de usuarios, roles, permisos y sesiones del sistema.
Utiliza un modelo de usuario personalizado basado en AbstractBaseUser.
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario.

    Proporciona métodos para crear usuarios regulares y superusuarios
    utilizando el campo 'usuario' como identificador principal (USERNAME_FIELD).
    """
    def create_user(self, usuario, correo, password=None, **extra_fields):
        if not usuario:
            raise ValueError('El nombre de usuario es obligatorio')
        if not correo:
            raise ValueError('El correo electrónico es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(usuario=usuario, correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, usuario, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(usuario, correo, password, **extra_fields)


class Usuario(AuditableBaseModel, AbstractBaseUser, PermissionsMixin):
    """Modelo personalizado de usuario para autenticación y autorización.

    Hereda de AbstractBaseUser (manejo de contraseñas) y PermissionsMixin
    (permisos y grupos de Django), además de AuditableBaseModel (auditoría).

    Relación FK:
        idempresa -> Empresa (opcional): Empresa a la que pertenece el usuario.
            Los administradores del sistema pueden no tener empresa asociada.

    Campos más importantes:
        tipo_usuario: Rol del sistema (admin_sistema, admin_empresa, operador).
        usuario: Nombre de usuario para iniciar sesión (único).
        correo: Correo electrónico (único).
        is_staff: Acceso al panel de administración de Django.
        is_active: Indica si la cuenta está activa.

    USERNAME_FIELD: Define 'usuario' como campo de autenticación principal.
    REQUIRED_FIELDS: Campos requeridos adicionales al crear un superusuario.
    """
    TIPO_USUARIO_CHOICES = [
        ('admin_sistema', 'Administrador SIPRO'),
        ('admin_empresa', 'Administrador de Empresa'),
        ('operador', 'Operador'),
    ]

    idusuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, null=True, blank=True, db_column='idempresa')
    tipo_usuario = models.CharField(max_length=20, choices=TIPO_USUARIO_CHOICES, default='operador')
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    usuario = models.CharField(max_length=50, unique=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    foto = models.CharField(max_length=255, null=True, blank=True)
    ultimologin = models.DateTimeField(null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'usuario'
    REQUIRED_FIELDS = ['correo', 'nombres', 'apellidos']

    class Meta:
        app_label = 'seguridad'  # Etiqueta de la aplicación Django
        db_table = 'usuario'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.usuario})"


class Rol(AuditableBaseModel):
    """Representa un rol o perfil de acceso en el sistema.

    Relación FK:
        idempresa -> Empresa (opcional): Rol asociado a una empresa específica.
            Los roles globales del sistema no tienen empresa asociada.

    Campos más importantes:
        nombre: Nombre del rol (único por empresa).
        descripcion: Descripción del alcance del rol.
    """
    idrol = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, null=True, blank=True, db_column='idempresa')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'seguridad'
        db_table = 'rol'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        unique_together = ('idempresa', 'nombre')  # El nombre del rol es único por empresa

    def __str__(self):
        return self.nombre


class Permiso(AuditableBaseModel):
    """Representa un permiso individual o acción disponible en el sistema.

    Campos más importantes:
        codigo: Identificador único del permiso (ej. 'productos.crear').
        nombre: Nombre legible del permiso (ej. 'Crear Producto').
        descripcion: Explicación de qué acción autoriza el permiso.
    """
    idpermiso = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'seguridad'
        db_table = 'permiso'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'

    def __str__(self):
        return self.nombre


class UsuarioRol(AuditableBaseModel):
    """Tabla intermedia que asigna roles a usuarios (relación muchos a muchos).

    Relación FK:
        idusuario -> Usuario: Usuario al que se asigna el rol.
        idrol -> Rol: Rol asignado al usuario.

    unique_together: Un usuario no puede tener el mismo rol asignado más de una vez.
    """
    idusuariorol = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idusuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idusuario')
    idrol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='idrol')

    class Meta:
        app_label = 'seguridad'
        db_table = 'usuariorol'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Usuario - Rol'
        verbose_name_plural = 'Usuarios - Roles'
        unique_together = ('idusuario', 'idrol')  # Un usuario no puede tener el mismo rol repetido


class RolPermiso(AuditableBaseModel):
    """Tabla intermedia que asigna permisos a roles (relación muchos a muchos).

    Relación FK:
        idrol -> Rol: Rol al que se asigna el permiso.
        idpermiso -> Permiso: Permiso asignado al rol.

    unique_together: Un rol no puede tener el mismo permiso asignado más de una vez.
    """
    idrolpermiso = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idrol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='idrol')
    idpermiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column='idpermiso')

    class Meta:
        app_label = 'seguridad'
        db_table = 'rolpermiso'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Rol - Permiso'
        verbose_name_plural = 'Roles - Permisos'
        unique_together = ('idrol', 'idpermiso')  # Un rol no puede tener el mismo permiso repetido


class SesionUsuario(AuditableBaseModel):
    """Registra las sesiones activas e históricas de los usuarios.

    Relación FK:
        idusuario -> Usuario: Usuario al que pertenece la sesión.

    Campos más importantes:
        tokenjwt: Token JWT activo de la sesión.
        refreshtoken: Token de refresco asociado.
        ip: Dirección IP desde donde se conectó.
        dispositivo: Información del dispositivo utilizado.
        navegador: User-agent del navegador.
        fechainicio, fechafin: Período de duración de la sesión.
        activa: Indica si la sesión sigue vigente.
    """
    idsesionusuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idusuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idusuario')
    tokenjwt = models.TextField()
    refreshtoken = models.TextField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    dispositivo = models.CharField(max_length=255, null=True, blank=True)
    navegador = models.CharField(max_length=255, null=True, blank=True)
    fechainicio = models.DateTimeField(auto_now_add=True)
    fechafin = models.DateTimeField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        app_label = 'seguridad'
        db_table = 'sesionusuario'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Sesión de Usuario'
        verbose_name_plural = 'Sesiones de Usuarios'
