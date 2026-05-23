"""Serializers del módulo de Layout.

Convierte los modelos de jerarquía física del almacén (Zona, Pasillo, Estante,
Nivel, Ubicacion) y los de navegación (Nodo, Conexion) a JSON.
Incluye serializers anidados para representar la jerarquía completa.
"""

from rest_framework import serializers
from src.infrastructure.models.layout_model import Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion


class NivelSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Nivel.

    Serializa todos los campos del nivel.
    Es usado como serializer anidado dentro de EstanteSerializer.
    """
    class Meta:
        model = Nivel
        fields = '__all__'


class UbicacionSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Ubicación.

    Serializa todos los campos de la ubicación, incluyendo su estado y capacidades.
    """
    class Meta:
        model = Ubicacion
        fields = '__all__'


class EstanteSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Estante con sus niveles anidados.

    Campos anidados:
        niveles: Lista de NivelSerializer con los niveles del estante (read-only).
    """
    niveles = NivelSerializer(source='nivel_set', many=True, read_only=True)

    class Meta:
        model = Estante
        fields = '__all__'


class EstanteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar estantes con conteo de niveles.

    Métodos personalizados:
        get_niveles_count: Retorna la cantidad de niveles que tiene el estante.
    """
    niveles_count = serializers.SerializerMethodField()

    class Meta:
        model = Estante
        fields = ['idestante', 'idpasillo', 'nombre', 'codigo', 'x', 'y', 'ancho', 'alto', 'lado', 'cantidadniveles', 'estado', 'niveles_count']

    def get_niveles_count(self, obj):
        return obj.nivel_set.count()


class PasilloSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Pasillo con sus estantes anidados.

    Campos anidados:
        estantes: Lista de EstanteListSerializer con los estantes del pasillo (read-only).
    """
    estantes = EstanteListSerializer(source='estante_set', many=True, read_only=True)

    class Meta:
        model = Pasillo
        fields = '__all__'


class PasilloListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar pasillos con conteo de estantes.

    Métodos personalizados:
        get_estantes_count: Retorna la cantidad de estantes en el pasillo.
    """
    estantes_count = serializers.SerializerMethodField()

    class Meta:
        model = Pasillo
        fields = ['idpasillo', 'idzona', 'nombre', 'codigo', 'x', 'y', 'ancho', 'largo', 'orientacion', 'estado', 'estantes_count']

    def get_estantes_count(self, obj):
        return obj.estante_set.count()


class ZonaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Zona con sus pasillos anidados.

    Campos anidados:
        pasillos: Lista de PasilloListSerializer con los pasillos de la zona (read-only).
    """
    pasillos = PasilloListSerializer(source='pasillo_set', many=True, read_only=True)

    class Meta:
        model = Zona
        fields = '__all__'


class ZonaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar zonas con conteo de pasillos.

    Métodos personalizados:
        get_pasillos_count: Retorna la cantidad de pasillos en la zona.
    """
    pasillos_count = serializers.SerializerMethodField()

    class Meta:
        model = Zona
        fields = ['idzona', 'idalmacen', 'nombre', 'codigo', 'tipo', 'x', 'y', 'ancho', 'alto', 'color', 'estado', 'pasillos_count']

    def get_pasillos_count(self, obj):
        return obj.pasillo_set.count()


class NodoSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Nodo.

    Serializa todos los campos del nodo, incluyendo su tipo y coordenadas.
    """
    class Meta:
        model = Nodo
        fields = '__all__'


class NodoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar nodos con conteo de conexiones.

    Métodos personalizados:
        get_conexiones_count: Suma las conexiones de salida y entrada del nodo.
    """
    conexiones_count = serializers.SerializerMethodField()

    class Meta:
        model = Nodo
        fields = ['idnodo', 'idalmacen', 'nombre', 'tipo', 'coordenada_x', 'coordenada_y', 'idubicacion', 'estado', 'conexiones_count']

    def get_conexiones_count(self, obj):
        return obj.conexiones_salida.count() + obj.conexiones_entrada.count()


class ConexionSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Conexión.

    Campos adicionales (read-only):
        origen_nombre: Nombre del nodo de origen.
        destino_nombre: Nombre del nodo de destino.

    Proporciona nombres legibles de los nodos origen y destino además de sus IDs.
    """
    origen_nombre = serializers.CharField(source='idnodoorigen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idnododestino.nombre', read_only=True)

    class Meta:
        model = Conexion
        fields = '__all__'
