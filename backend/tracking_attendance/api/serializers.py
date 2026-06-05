from rest_framework import serializers
from djoser.serializers import UserSerializer as DjoserUserSerializer

from attendance.models import Grade, Group, Subject, Lesson, User


class UserSerializer(DjoserUserSerializer):
    """Расширяет стандартный сериализатор djoser: добавляет поля role и group."""

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = DjoserUserSerializer.Meta.fields + ('role', 'group')
        read_only_fields = ('role',)


class SubjectSerializer(serializers.ModelSerializer):
    teacher = serializers.SlugRelatedField(
        slug_field='username',
        read_only=False,
        queryset=User.objects.filter(role=User.ROLE_TEACHER),
    )

    class Meta:
        model = Subject
        fields = ('id', 'name', 'teacher')


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')


class LessonSerializer(serializers.ModelSerializer):
    """
    Сериализатор занятия.

    При создании (POST) принимает поля повторяемости:
      - recurrence: 'once' | 'weekly' | 'biweekly'
      - weekday: 0-6 (обязательно для weekly/biweekly)
      - end_date: дата окончания (необязательно)

    Сервис в views.py использует Lesson.generate_dates() для создания
    всех экземпляров занятия.
    """

    subject_name = serializers.CharField(source='subject.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    teacher_username = serializers.CharField(source='subject.teacher.username', read_only=True)

    class Meta:
        model = Lesson
        fields = (
            'id',
            'subject',
            'subject_name',
            'group',
            'group_name',
            'teacher_username',
            'date',
            'lesson_number',
            'recurrence',
            'weekday',
            'end_date',
        )

    def validate(self, attrs):
        recurrence = attrs.get('recurrence', Lesson.ONCE)
        weekday = attrs.get('weekday')
        end_date = attrs.get('end_date')
        date = attrs.get('date')

        if recurrence != Lesson.ONCE and weekday is None:
            raise serializers.ValidationError(
                {'weekday': 'Для регулярных занятий необходимо указать день недели.'}
            )

        if end_date and date and end_date < date:
            raise serializers.ValidationError(
                {'end_date': 'Дата окончания не может быть раньше даты начала.'}
            )

        return attrs


class StudentSerializer(serializers.ModelSerializer):
    """Краткое представление студента для выбора при выставлении оценки."""

    group_name = serializers.CharField(source='group.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'group', 'group_name')


class GradeSerializer(serializers.ModelSerializer):
    """Сериализатор оценки."""

    student_username = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.SerializerMethodField(read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Grade
        fields = (
            'id',
            'student',
            'student_username',
            'student_full_name',
            'subject',
            'subject_name',
            'lesson',
            'value',
            'date_received',
        )
        read_only_fields = ('date_received', 'student_username', 'student_full_name', 'subject_name')

    def get_student_full_name(self, obj):
        full = f'{obj.student.first_name} {obj.student.last_name}'.strip()
        return full or obj.student.username

    def validate_value(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError('Оценка должна быть от 1 до 100.')
        return value
