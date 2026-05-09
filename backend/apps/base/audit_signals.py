import uuid
from datetime import datetime
from django.db import models
from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver

AUDIT_MAP = {}
AUDIT_ENABLED = True


def register_audit(model_class, audit_model_class):
    AUDIT_MAP[model_class] = audit_model_class


def serialize_instance(instance):
    data = {}
    for field in instance._meta.fields:
        value = getattr(instance, field.name)
        if isinstance(value, models.Model):
            data[field.name] = str(value.pk)
        elif isinstance(value, uuid.UUID):
            data[field.name] = str(value)
        elif isinstance(value, datetime):
            data[field.name] = value.isoformat()
        elif hasattr(value, 'isoformat'):
            data[field.name] = value.isoformat()
        else:
            data[field.name] = value
    return data


def get_client_ip(request):
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
    return None


@receiver(pre_save)
def capture_pre_save_state(sender, instance, **kwargs):
    if not AUDIT_ENABLED or sender not in AUDIT_MAP or not instance.pk:
        return
    try:
        old = sender.objects.get(pk=instance.pk)
        instance._old_data = serialize_instance(old)
    except sender.DoesNotExist:
        pass


@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    if not AUDIT_ENABLED or sender not in AUDIT_MAP:
        return
    audit_model = AUDIT_MAP[sender]
    new_data = serialize_instance(instance)
    old_data = getattr(instance, '_old_data', None)
    op = 'CREATE' if created else 'UPDATE'

    import threading
    request = getattr(threading.current_thread(), 'current_request', None)
    usuario_id = None
    ip = None
    if request:
        if hasattr(request, 'user') and request.user.is_authenticated:
            usuario_id = getattr(request.user, 'idusuario', None) or getattr(request.user, 'id', None)
        ip = get_client_ip(request)

    audit = audit_model.objects.create(
        idregistro=instance.pk,
        idusuario=usuario_id,
        tipooperacion=op,
        datosanteriores=old_data if not created else None,
        datosnuevos=new_data,
        ip=ip,
    )

    sender.objects.filter(pk=instance.pk).update(idultimaauditoria=audit.idauditoria)


@receiver(pre_delete)
def audit_pre_delete(sender, instance, **kwargs):
    if not AUDIT_ENABLED or sender not in AUDIT_MAP:
        return
    audit_model = AUDIT_MAP[sender]
    old_data = serialize_instance(instance)

    import threading
    request = getattr(threading.current_thread(), 'current_request', None)
    usuario_id = None
    ip = None
    if request:
        if hasattr(request, 'user') and request.user.is_authenticated:
            usuario_id = getattr(request.user, 'idusuario', None) or getattr(request.user, 'id', None)
        ip = get_client_ip(request)

    audit_model.objects.create(
        idregistro=instance.pk,
        idusuario=usuario_id,
        tipooperacion='DELETE',
        datosanteriores=old_data,
        ip=ip,
    )
