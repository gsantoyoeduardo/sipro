# Generated manually - Fix unique constraints for tenant isolation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('picking', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ordenpicking',
            name='numero_orden',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='ordenpicking',
            unique_together={('idalmacen', 'numero_orden')},
        ),
    ]
