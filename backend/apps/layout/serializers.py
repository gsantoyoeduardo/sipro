from rest_framework import serializers
from .models import Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion


class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        fields = '__all__'


class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = '__all__'


class EstanteSerializer(serializers.ModelSerializer):
    niveles = NivelSerializer(source='nivel_set', many=True, read_only=True)

    class Meta:
        model = Estante
        fields = '__all__'


class EstanteListSerializer(serializers.ModelSerializer):
    niveles_count = serializers.SerializerMethodField()

    class Meta:
        model = Estante
        fields = ['idestante', 'idpasillo', 'nombre', 'codigo', 'x', 'y', 'ancho', 'alto', 'lado', 'cantidadniveles', 'estado', 'niveles_count']

    def get_niveles_count(self, obj):
        return obj.nivel_set.count()


class PasilloSerializer(serializers.ModelSerializer):
    estantes = EstanteListSerializer(source='estante_set', many=True, read_only=True)

    class Meta:
        model = Pasillo
        fields = '__all__'


class PasilloListSerializer(serializers.ModelSerializer):
    estantes_count = serializers.SerializerMethodField()

    class Meta:
        model = Pasillo
        fields = ['idpasillo', 'idzona', 'nombre', 'codigo', 'x', 'y', 'ancho', 'largo', 'orientacion', 'estado', 'estantes_count']

    def get_estantes_count(self, obj):
        return obj.estante_set.count()


class ZonaSerializer(serializers.ModelSerializer):
    pasillos = PasilloListSerializer(source='pasillo_set', many=True, read_only=True)

    class Meta:
        model = Zona
        fields = '__all__'


class ZonaListSerializer(serializers.ModelSerializer):
    pasillos_count = serializers.SerializerMethodField()

    class Meta:
        model = Zona
        fields = ['idzona', 'idalmacen', 'nombre', 'codigo', 'tipo', 'x', 'y', 'ancho', 'alto', 'color', 'estado', 'pasillos_count']

    def get_pasillos_count(self, obj):
        return obj.pasillo_set.count()


class NodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nodo
        fields = '__all__'


class NodoListSerializer(serializers.ModelSerializer):
    conexiones_count = serializers.SerializerMethodField()

    class Meta:
        model = Nodo
        fields = ['idnodo', 'idalmacen', 'nombre', 'tipo', 'coordenada_x', 'coordenada_y', 'idubicacion', 'estado', 'conexiones_count']

    def get_conexiones_count(self, obj):
        return obj.conexiones_salida.count() + obj.conexiones_entrada.count()


class ConexionSerializer(serializers.ModelSerializer):
    origen_nombre = serializers.CharField(source='idnodoorigen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idnododestino.nombre', read_only=True)

    class Meta:
        model = Conexion
        fields = '__all__'
