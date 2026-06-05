from rest_framework.permissions import BasePermission, SAFE_METHODS

from attendance.models import User


class IsTeacher(BasePermission):
    """Разрешает доступ только пользователям с ролью 'teacher'."""

    message = 'Доступ разрешён только преподавателям.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_TEACHER
        )


class IsTeacherOfSubject(BasePermission):
    """
    На уровне объекта: разрешает запись только преподавателю,
    который ведёт предмет, указанный в оценке.
    Чтение разрешено всем аутентифицированным пользователям.
    """

    message = 'Выставлять оценки может только преподаватель, ведущий данный предмет.'

    def has_permission(self, request, view):
        # Любой аутентифицированный пользователь может читать
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # Запись — только преподаватели
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_TEACHER
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # obj — экземпляр Grade; проверяем, что текущий пользователь
        # является преподавателем предмета этой оценки
        return obj.subject.teacher == request.user
