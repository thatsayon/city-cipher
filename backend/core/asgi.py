# core/asgi.py
import os
import django
from django.core.asgi import get_asgi_application
import socketio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Create Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
django_asgi_app = get_asgi_application()

# Import event handlers after sio creation
from chat import socket_handlers

# Mount Socket.IO
application = socketio.ASGIApp(sio, django_asgi_app)

