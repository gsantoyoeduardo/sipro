# Generated manually - Fix unique constraints for tenant isolation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transferencia', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transferencia',
            name='numero_transferencia',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='transferencia',
            unique_together={('idalmacen_origen', 'numero_transferencia')},
        ),
    ]
