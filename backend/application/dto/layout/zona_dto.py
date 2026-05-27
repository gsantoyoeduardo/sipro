from rest_framework import serializers

from infrastructure.models.layout_model import Zona

from .estante_dto import EstanteListSerializer


class ZonaSerializer(serializers.ModelSerializer):
    estantes = EstanteListSerializer(source='estante_set', many=True, read_only=True)

    class Meta:
        model = Zona
        fields = '__all__'

    def validate(self, data):
        if data.get('es_mascara') or (
            not data.get('idzona') and self.instance and self.instance.es_mascara
        ):
            idalmacen = data.get('idalmacen') or getattr(self.instance, 'idalmacen_id', None)
            if idalmacen:
                qs = Zona.objects.filter(idalmacen_id=idalmacen, es_mascara=True)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError(
                        'Ya existe una zona máscara para este almacén'
                    )
        return data


class ZonaListSerializer(serializers.ModelSerializer):
    estantes_count = serializers.SerializerMethodField()

    class Meta:
        model = Zona
        fields = ['idzona', 'idsucursal', 'idalmacen', 'nombre', 'codigo', 'tipo', 'x', 'y', 'poligono', 'z_base', 'z_techo', 'color', 'estado', 'estantes_count', 'es_mascara']

    def get_estantes_count(self, obj):
        return obj.estante_set.count()
