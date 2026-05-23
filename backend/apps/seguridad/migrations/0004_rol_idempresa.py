# Generated manually - Add idempresa to Rol and fix unique constraints

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('empresa', '0002_alter_almacen_table_alter_empresa_table_and_more'),
        ('seguridad', '0003_add_tipo_usuario'),
    ]

    operations = [
        migrations.AddField(
            model_name='rol',
            name='idempresa',
            field=models.ForeignKey(blank=True, db_column='idempresa', null=True, on_delete=django.db.models.deletion.CASCADE, to='empresa.empresa'),
        ),
        migrations.AlterUniqueTogether(
            name='rol',
            unique_together={('idempresa', 'nombre')},
        ),
    ]
