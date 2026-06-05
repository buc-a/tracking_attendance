from datetime import date

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsTeacher, IsTeacherOfSubject
from .serializers import (
    GradeSerializer,
    GroupSerializer,
    LessonSerializer,
    StudentSerializer,
    SubjectSerializer,
)
from attendance.models import Grade, Group, Lesson, Subject, User


# ──────────────────────────────────────────────
# Subjects
# ──────────────────────────────────────────────

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer



# ──────────────────────────────────────────────
# Groups
# ──────────────────────────────────────────────

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


# ──────────────────────────────────────────────
# Lessons
# ──────────────────────────────────────────────

class LessonViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/lessons/                        — список занятий
         ?subject=<id>  — фильтр по предмету
         ?group=<id>    — фильтр по группе
         ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD — фильтр по диапазону дат

    POST /api/v1/lessons/                        — создать занятие (или серию)
    {
        "subject": 1,
        "group": 2,
        "date": "2026-09-01",          // дата первого занятия
        "lesson_number": 3,
        "recurrence": "weekly",        // "once" | "weekly" | "biweekly"
        "weekday": 0,                  // 0=Пн…6=Вс; обязательно для weekly/biweekly
        "end_date": "2027-01-31"       // необязательно
    }

    При recurrence != "once" создаётся несколько Lesson-записей
    (по одной на каждую дату из generate_dates()).
    Возвращает список созданных занятий.
    """

    serializer_class = LessonSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related('subject', 'group').all()

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        group_id = self.request.query_params.get('group')
        if group_id:
            qs = qs.filter(group_id=group_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs.order_by('date', 'lesson_number')

    def create(self, request, *args, **kwargs):
        """
        Создаёт одно или несколько занятий в зависимости от recurrence.
        Возвращает список созданных объектов.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        recurrence = validated.get('recurrence', Lesson.ONCE)

        # Строим «шаблонный» объект для генерации дат (не сохраняем)
        template = Lesson(**validated)
        dates = template.generate_dates()

        created_lessons = []
        for lesson_date in dates:
            lesson, _ = Lesson.objects.get_or_create(
                subject=validated['subject'],
                group=validated['group'],
                date=lesson_date,
                lesson_number=validated['lesson_number'],
                defaults={
                    'recurrence': recurrence,
                    'weekday': validated.get('weekday'),
                    'end_date': validated.get('end_date'),
                },
            )
            created_lessons.append(lesson)

        out_serializer = self.get_serializer(created_lessons, many=True)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Schedule (convenience view — queries Lesson table)
# ──────────────────────────────────────────────

class ScheduleView(APIView):
    """
    GET /api/v1/schedule/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Необязательные фильтры: ?group_id=<id>  ?subject_id=<id>

    Возвращает занятия из таблицы Lesson в указанном диапазоне дат,
    отсортированные по дате и номеру пары.
    """

    def get(self, request):
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        if not date_from_str or not date_to_str:
            return Response(
                {'detail': 'Параметры date_from и date_to обязательны (формат YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            date_from = date.fromisoformat(date_from_str)
            date_to = date.fromisoformat(date_to_str)
        except ValueError:
            return Response(
                {'detail': 'Неверный формат даты. Используйте YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if date_from > date_to:
            return Response(
                {'detail': 'date_from не может быть позже date_to.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Lesson.objects.select_related('subject', 'subject__teacher', 'group').filter(
            date__gte=date_from,
            date__lte=date_to,
        )

        group_id = request.query_params.get('group_id')
        if group_id:
            qs = qs.filter(group_id=group_id)

        subject_id = request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        qs = qs.order_by('date', 'lesson_number')
        serializer = LessonSerializer(qs, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────
# Grades
# ──────────────────────────────────────────────

class GradeViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/grades/                — список (фильтры: ?student=<id> ?subject=<id>)
    POST /api/v1/grades/                — выставить оценку (только преподаватель предмета)
    PATCH/PUT/DELETE /api/v1/grades/<id>/
    """

    serializer_class = GradeSerializer
    permission_classes = [IsTeacherOfSubject]

    def get_queryset(self):
        qs = Grade.objects.select_related('student', 'subject', 'lesson').all()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs

    def perform_create(self, serializer):
        subject = serializer.validated_data['subject']
        if subject.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                'Вы можете выставлять оценки только по предметам, которые ведёте.'
            )
        serializer.save()


# ──────────────────────────────────────────────
# Users / Students
# ──────────────────────────────────────────────

class MySubjectsView(APIView):
    """GET /api/v1/my-subjects/ — предметы текущего преподавателя."""

    permission_classes = [IsTeacher]

    def get(self, request):
        subjects = Subject.objects.filter(teacher=request.user)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)


class StudentsByGroupView(APIView):
    """
    GET /api/v1/students/            — все студенты
    GET /api/v1/students/?group=<id> — студенты указанной группы
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = User.objects.filter(role=User.ROLE_STUDENT).select_related('group')
        group_id = request.query_params.get('group')
        if group_id:
            qs = qs.filter(group_id=group_id)
        qs = qs.order_by('last_name', 'first_name', 'username')
        serializer = StudentSerializer(qs, many=True)
        return Response(serializer.data)
