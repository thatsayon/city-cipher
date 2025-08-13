from core.asgi import sio
from .models import ChatRoom, ChatMessage
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

User = get_user_model()

# hi

@sio.event
async def connect(sid, environ):
    print(f"🔌 Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    """
    data = { "room_id": "<room_uuid>" }
    """
    room_id = data.get("room_id")
    await sio.enter_room(sid, str(room_id))
    await sio.emit("user_joined", {"sid": sid}, room=str(room_id))
    print(f"User {sid} joined room {room_id}")

@sio.event
async def send_message(sid, data):
    """
    data = {
        "room_id": "<room_uuid>",
        "sender_id": "<user_id>",
        "message": "Hello!"
    }
    """
    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    message = data.get("message")

    if not room_id or not sender_id or not message:
        await sio.emit("error", {"error": "Missing fields"}, to=sid)
        return

    try:
        # Save message to DB
        sender = await sync_to_async(User.objects.get)(id=sender_id)
        room = await sync_to_async(ChatRoom.objects.get)(id=room_id)
        await sync_to_async(ChatMessage.objects.create)(
            room=room,
            sender=sender,
            message=message
        )
    except Exception as e:
        await sio.emit("error", {"error": str(e)}, to=sid)
        return

    # Broadcast to room
    await sio.emit(
        "new_message",
        {"sender": sender.username, "message": message},
        room=str(room_id)
    )

