# Generated by Django 4.1.2 on 2023-01-17 18:44

from django.db import migrations, models
import exam_board.tools


class Migration(migrations.Migration):

    dependencies = [
        ('general', '0004_remove_comment_subject_comment_student_comment_user'),
    ]

    operations = [
        migrations.DeleteModel(
            name='DegreeClassification',
        ),
        migrations.RemoveField(
            model_name='academicyear',
            name='settings',
        ),
        migrations.AddField(
            model_name='academicyear',
            name='degree_classification_settings',
            field=models.JSONField(default=exam_board.tools.default_degree_classification_settings_dict),
        ),
        migrations.DeleteModel(
            name='AcademicYearSettings',
        ),
    ]
