# Generated manually - Fix unique constraints for tenant isolation

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('layout', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='ubicacion',
            unique_together={('idnivel', 'codigo')},
        ),
    ]
