from rest_framework import serializers


class ToggleEstadoSerializer(serializers.Serializer):
    activo = serializers.BooleanField(
        required=False,
        default=None,
        help_text='true para activar, false para desactivar. Si no se envía, invierte el estado actual.',
    )

    class Meta:
        ref_name = 'ToggleEstado'
