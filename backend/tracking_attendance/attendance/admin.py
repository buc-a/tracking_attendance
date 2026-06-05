from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Group, Subject, Lesson, Attendance, Grade


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Панель управления пользователями с полем role."""

    # Добавляем role и group в список отображаемых колонок
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'group', 'is_staff')
    list_filter = ('role', 'group', 'is_staff', 'is_superuser', 'is_active')

    # Добавляем секцию «Роль и группа» на страницу редактирования пользователя
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Роль и группа', {'fields': ('role', 'group')}),
    )

    # Добавляем role и group в форму создания нового пользователя
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Роль и группа', {'fields': ('role', 'group')}),
    )


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'teacher')
    list_filter = ('teacher',)
    search_fields = ('name',)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'group', 'date', 'lesson_number', 'recurrence')
    list_filter = ('group', 'subject', 'date', 'recurrence')
    search_fields = ('subject__name', 'group__name')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'lesson', 'status')
    list_filter = ('status', 'lesson__group')


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'subject', 'lesson', 'value', 'date_received')
    list_filter = ('subject',)
