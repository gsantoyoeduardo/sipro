import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.base.models import AuditableBaseModel


class UsuarioManager(BaseUserManager):
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
    idusuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, null=True, blank=True, db_column='idempresa')
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
        db_table = 'public"."usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.usuario})"


class Rol(AuditableBaseModel):
    idrol = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'public"."rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class Permiso(AuditableBaseModel):
    idpermiso = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'public"."permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'

    def __str__(self):
        return self.nombre


class UsuarioRol(AuditableBaseModel):
    idusuariorol = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idusuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idusuario')
    idrol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='idrol')

    class Meta:
        db_table = 'public"."usuariorol'
        verbose_name = 'Usuario - Rol'
        verbose_name_plural = 'Usuarios - Roles'
        unique_together = ('idusuario', 'idrol')


class RolPermiso(AuditableBaseModel):
    idrolpermiso = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idrol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='idrol')
    idpermiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column='idpermiso')

    class Meta:
        db_table = 'public"."rolpermiso'
        verbose_name = 'Rol - Permiso'
        verbose_name_plural = 'Roles - Permisos'
        unique_together = ('idrol', 'idpermiso')


class SesionUsuario(AuditableBaseModel):
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
        db_table = 'public"."sesionusuario'
        verbose_name = 'Sesión de Usuario'
        verbose_name_plural = 'Sesiones de Usuarios'
