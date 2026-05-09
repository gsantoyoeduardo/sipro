from django.test import TestCase
from apps.inventario.models import Categoria, Producto
from apps.inventario.fefo_fifo import calcular_picking


class InventarioModelTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Test Cat')
        self.producto = Producto.objects.create(
            idcategoria=self.categoria,
            codigo='TEST001', nombre='Producto Test',
            unidad_medida='unidad', maneja_lotes=False
        )

    def test_categoria_creation(self):
        self.assertEqual(self.categoria.nombre, 'Test Cat')
        self.assertTrue(self.categoria.estado)

    def test_producto_creation(self):
        self.assertEqual(self.producto.codigo, 'TEST001')
        self.assertFalse(self.producto.maneja_lotes)

    def test_calcular_picking_producto_sin_stock(self):
        result = calcular_picking(str(self.producto.idproducto), 10)
        self.assertFalse(result.get('completo', False))

    def test_calcular_picking_producto_no_existente(self):
        result = calcular_picking('00000000-0000-0000-0000-000000000000', 10)
        self.assertIn('error', result)


class FEFOFIFOTests(TestCase):
    def test_picking_sin_inventario_devuelve_faltante(self):
        cat = Categoria.objects.create(nombre='Test')
        prod = Producto.objects.create(
            idcategoria=cat, codigo='P001', nombre='P Test',
            unidad_medida='unidad', maneja_lotes=True
        )
        result = calcular_picking(str(prod.idproducto), 5)
        self.assertEqual(result['faltante'], 5)
        self.assertFalse(result['completo'])
