FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir \
    psycopg2-binary \
    djangorestframework-simplejwt \
    drf-yasg

# Copy project
COPY tracking_attendance /app/tracking_attendance

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=tracking_attendance.settings

WORKDIR /app/tracking_attendance

EXPOSE 8000
