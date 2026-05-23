from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('empresa', '0002_alter_almacen_table_alter_empresa_table_and_more'),
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='categoria',
            name='idempresa',
            field=models.ForeignKey(db_column='idempresa', null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, to='empresa.empresa'),
        ),
        migrations.AlterUniqueTogether(
            name='categoria',
            unique_together={('idempresa', 'nombre')},
        ),
        migrations.AlterField(
            model_name='producto',
            name='codigo',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='producto',
            unique_together={('idcategoria', 'codigo')},
        ),
    ]
