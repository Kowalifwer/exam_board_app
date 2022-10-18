# Generated by Django 4.1.2 on 2022-10-18 14:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('general', '0002_academicyear_academicyearsettings_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='student',
            name='comment',
        ),
        migrations.RemoveField(
            model_name='student',
            name='degree_level',
        ),
        migrations.AddField(
            model_name='student',
            name='is_masters',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='student',
            name='is_faster_route',
            field=models.BooleanField(default=False),
        ),
    ]
