# Tracking Attendance App

A full-stack web application for managing student attendance, grades, lessons, and schedules in an educational institution.

## Overview

The application consists of:
- **Backend**: Django + Django REST Framework with PostgreSQL
- **Frontend**: React.js
- **Reverse Proxy**: Nginx

## Features

- **User Management**: Students and Teachers with role-based access
- **Groups**: Manage student groups
- **Subjects**: Assign subjects to teachers
- **Lessons**: Create single or recurring lessons (weekly/biweekly)
- **Attendance**: Track student attendance per lesson
- **Grades**: Record and manage student grades
- **Schedule**: View schedule filtered by date range, group, or subject
- **JWT Authentication**: Secure API access via djoser

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Django 4+, Django REST Framework    |
| Database   | PostgreSQL 15                       |
| Frontend   | React 18, React Scripts             |
| Auth       | Djoser + JWT                        |
| Reverse Proxy | Nginx                           |
| Container  | Docker, Docker Compose              |

## Project Structure

```
tracking_attendance_app/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── tracking_attendance/
│       ├── manage.py
│       ├── api/                  # REST API (views, serializers, urls)
│       ├── attendance/           # Core models (User, Group, Subject, Lesson, Attendance, Grade)
│       └── tracking_attendance/  # Django settings
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── api.js
│       ├── App.js
│       └── pages/                # GradesPage, GroupsPage, LessonsPage, LoginPage, SchedulePage, SubjectsPage
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── diagram/
```

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run with Docker Compose

```bash
cd tracking_attendance_app
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Nginx**: http://localhost:80

### Local Development (without Docker)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm install
npm start
```

## API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/v1/groups/`           | List all groups                    |
| POST   | `/api/v1/groups/`           | Create a group                     |
| GET    | `/api/v1/subjects/`         | List all subjects                  |
| POST   | `/api/v1/subjects/`         | Create a subject                   |
| GET    | `/api/v1/lessons/`          | List lessons (filterable)          |
| POST   | `/api/v1/lessons/`          | Create lesson(s)                   |
| GET    | `/api/v1/grades/`           | List grades (filterable)           |
| POST   | `/api/v1/grades/`           | Create a grade                     |
| GET    | `/api/v1/schedule/`         | Get schedule (date/group filter)   |
| GET    | `/api/v1/my-subjects/`      | Teacher's subjects                 |
| GET    | `/api/v1/students/`         | List students (by group)           |
| POST   | `/api/v1/auth/users/`       | Register user                      |
| POST   | `/api/v1/auth/jwt/create/`  | Obtain JWT token                   |
| POST   | `/api/v1/auth/jwt/refresh/` | Refresh JWT token                  |

## Data Models

- **User** — username, role (student/teacher), group (for students)
- **Group** — name
- **Subject** — name, teacher
- **Lesson** — subject, group, date, lesson_number, recurrence (once/weekly/biweekly)
- **Attendance** — student, lesson, status (present/absent)
- **Grade** — student, lesson, subject, value, date_received

## Lesson Recurrence

When creating a lesson via API, set `recurrence` field:
- `once` — single lesson
- `weekly` — repeats every week on specified weekday
- `biweekly` — repeats every 2 weeks on specified weekday

The system generates all lesson instances up to 365 days ahead (or until `end_date`).

## Environment Variables

| Variable          | Default                          |
|-------------------|----------------------------------|
| `DEBUG`           | True                             |
| `DB_NAME`         | tracking_attendance              |
| `DB_USER`         | postgres                         |
| `DB_PASSWORD`     | postgres                         |
| `DB_HOST`         | db                               |
| `DB_PORT`         | 5432                             |
| `SECRET_KEY`      | (insecure default for dev)       |
| `REACT_APP_API_URL` | http://localhost:8000/api/v1   |
