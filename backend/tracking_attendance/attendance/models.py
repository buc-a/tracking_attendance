from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_STUDENT = 'student'
    ROLE_TEACHER = 'teacher'
    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Студент'),
        (ROLE_TEACHER, 'Преподаватель'),
    ]
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_STUDENT,
        verbose_name='Роль',
    )
    # Группа актуальна только для студентов; для преподавателей оставляем пустым
    group = models.ForeignKey(
        'Group',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        verbose_name='Группа',
        help_text='Заполняется только для студентов',
    )

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'


class Group(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Группа'
        verbose_name_plural = 'Группы'

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=100)
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.ROLE_TEACHER},
        related_name='subjects',
        verbose_name='Преподаватель',
    )

    class Meta:
        verbose_name = 'Предмет'
        verbose_name_plural = 'Предметы'

    def __str__(self):
        return self.name


class Lesson(models.Model):
    """
    Конкретное занятие.

    Поддерживает повторяемость: при создании через API с recurrence != 'once'
    сервис генерирует все дочерние экземпляры Lesson в диапазоне дат.

    recurrence:
      - 'once'     — разовое занятие (только поле date)
      - 'weekly'   — каждую неделю в день weekday начиная с date
      - 'biweekly' — каждые 2 недели в день weekday начиная с date

    weekday: 0=Пн … 6=Вс (используется для weekly/biweekly)
    end_date: последняя дата генерации (None = бессрочно, ограничено MAX_HORIZON_DAYS)
    """

    ONCE = 'once'
    WEEKLY = 'weekly'
    BIWEEKLY = 'biweekly'
    RECURRENCE_CHOICES = [
        (ONCE, 'Разово'),
        (WEEKLY, 'Каждую неделю'),
        (BIWEEKLY, 'Каждые 2 недели'),
    ]

    WEEKDAY_CHOICES = [
        (0, 'Понедельник'),
        (1, 'Вторник'),
        (2, 'Среда'),
        (3, 'Четверг'),
        (4, 'Пятница'),
        (5, 'Суббота'),
        (6, 'Воскресенье'),
    ]

    # Горизонт генерации для бессрочных шаблонов (1 учебный год)
    MAX_HORIZON_DAYS = 365

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, verbose_name='Предмет')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, verbose_name='Группа')
    date = models.DateField(verbose_name='Дата занятия')
    lesson_number = models.IntegerField(verbose_name='Номер пары')

    # ── Поля повторяемости (заполняются только при создании шаблона) ──────
    recurrence = models.CharField(
        max_length=10,
        choices=RECURRENCE_CHOICES,
        default=ONCE,
        verbose_name='Периодичность',
    )
    weekday = models.SmallIntegerField(
        choices=WEEKDAY_CHOICES,
        null=True, blank=True,
        verbose_name='День недели',
        help_text='Для weekly/biweekly: день недели повторения',
    )
    end_date = models.DateField(
        null=True, blank=True,
        verbose_name='Дата окончания',
        help_text='До какой даты генерировать занятия (пусто = на год вперёд)',
    )

    class Meta:
        verbose_name = 'Занятие'
        verbose_name_plural = 'Занятия'
        ordering = ['date', 'lesson_number']

    def __str__(self):
        return f'{self.subject} — {self.group} ({self.date}, пара №{self.lesson_number})'

    # ── Генерация дат ─────────────────────────────────────────────────────

    def generate_dates(self):
        """
        Возвращает список дат (datetime.date) для всех экземпляров занятия.
        Для 'once' — список из одной даты (self.date).
        Для 'weekly'/'biweekly' — все даты от self.date до self.end_date
        (или на MAX_HORIZON_DAYS вперёд).
        """
        if self.recurrence == self.ONCE:
            return [self.date]

        step = 7 if self.recurrence == self.WEEKLY else 14
        target_weekday = self.weekday if self.weekday is not None else self.date.weekday()

        # Первая дата с нужным weekday >= self.date
        delta = (target_weekday - self.date.weekday()) % 7
        first = self.date + timedelta(days=delta)

        upper = self.end_date or (self.date + timedelta(days=self.MAX_HORIZON_DAYS))

        dates = []
        current = first
        while current <= upper:
            dates.append(current)
            current += timedelta(days=step)

        return dates


class Attendance(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.ROLE_STUDENT},
        related_name='attendances',
        verbose_name='Студент',
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, verbose_name='Занятие')
    STATUS_CHOICES = [('present', 'Был'), ('absent', 'Не был')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, verbose_name='Статус')

    class Meta:
        verbose_name = 'Посещаемость'
        verbose_name_plural = 'Посещаемость'

    def __str__(self):
        return f'{self.student} — {self.lesson}: {self.status}'


class Grade(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.ROLE_STUDENT},
        related_name='grades',
        verbose_name='Студент',
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, verbose_name='Занятие')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, verbose_name='Предмет')
    value = models.IntegerField(verbose_name='Оценка')  # 2,3,4,5 или 0-100
    date_received = models.DateField(auto_now_add=True, verbose_name='Дата получения')

    class Meta:
        verbose_name = 'Оценка'
        verbose_name_plural = 'Оценки'

    def __str__(self):
        return f'{self.student} — {self.subject}: {self.value}'
