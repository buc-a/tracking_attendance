from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    GradeViewSet,
    GroupViewSet,
    LessonViewSet,
    MySubjectsView,
    ScheduleView,
    StudentsByGroupView,
    SubjectViewSet,
)

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'grades', GradeViewSet, basename='grade')

urlpatterns = [
    path('', include(router.urls)),
    # Расписание
    path('schedule/', ScheduleView.as_view(), name='schedule'),
    # Предметы текущего преподавателя
    path('my-subjects/', MySubjectsView.as_view(), name='my-subjects'),
    # Студенты (все, с ролью student)
    path('students/', StudentsByGroupView.as_view(), name='students'),
    # Аутентификация через djoser + JWT
    path('', include('djoser.urls')),
    path('', include('djoser.urls.jwt')),
]
