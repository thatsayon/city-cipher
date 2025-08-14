from core.asgi import sio
from .models import ChatRoom, ChatMessage
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from datetime import datetime
import uuid

User = get_user_model()

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
    if not room_id:
        await sio.emit("error", {"error": "Room ID is required"}, to=sid)
        return
    
    await sio.enter_room(sid, str(room_id))
    await sio.emit("user_joined", {"sid": sid, "room_id": room_id}, room=str(room_id))
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
    
    # Validate required fields
    if not room_id or not sender_id or not message:
        await sio.emit("error", {"error": "Missing required fields: room_id, sender_id, message"}, to=sid)
        return
    
    # Validate message content
    if not message.strip():
        await sio.emit("error", {"error": "Message cannot be empty"}, to=sid)
        return
    
    try:
        # Get sender and room from DB
        sender = await sync_to_async(User.objects.get)(id=sender_id)
        room = await sync_to_async(ChatRoom.objects.get)(id=room_id)
        
        # Create and save message to DB
        chat_message = await sync_to_async(ChatMessage.objects.create)(
            room=room,
            sender=sender,
            message=message.strip()
        )
        
        # Get the created message ID and timestamp
        message_id = str(chat_message.id)
        created_at = chat_message.created_at.isoformat()
        
        print(f"💬 Message saved: {sender.username} -> {message} (ID: {message_id})")
        
    except User.DoesNotExist:
        await sio.emit("error", {"error": f"User with ID {sender_id} not found"}, to=sid)
        return
    except ChatRoom.DoesNotExist:
        await sio.emit("error", {"error": f"Chat room with ID {room_id} not found"}, to=sid)
        return
    except Exception as e:
        print(f"❌ Error saving message: {str(e)}")
        await sio.emit("error", {"error": f"Failed to save message: {str(e)}"}, to=sid)
        return
    
    # Broadcast message to all users in the room
    message_data = {
        "id": message_id,
        "room_id": str(room_id),
        "sender": sender.username,
        "sender_id": str(sender_id),  # Make sure this is a string
        "message": message.strip(),
        "created_at": created_at,
        "timestamp": created_at  # Alternative field name for compatibility
    }
    
    await sio.emit("new_message", message_data, room=str(room_id))
    print(f"📤 Broadcasted message to room {room_id}: {message_data}")

@sio.event
async def leave_room(sid, data):
    """
    Optional: Handle user leaving room
    data = { "room_id": "<room_uuid>" }
    """
    room_id = data.get("room_id")
    if room_id:
        await sio.leave_room(sid, str(room_id))
        await sio.emit("user_left", {"sid": sid, "room_id": room_id}, room=str(room_id))
        print(f"User {sid} left room {room_id}")

@sio.event
async def get_room_messages(sid, data):
    """
    Optional: Get recent messages for a room
    data = { "room_id": "<room_uuid>", "limit": 50 }
    """
    room_id = data.get("room_id")
    limit = data.get("limit", 50)
    
    if not room_id:
        await sio.emit("error", {"error": "Room ID is required"}, to=sid)
        return
    
    try:
        # Get recent messages from DB
        messages = await sync_to_async(list)(
            ChatMessage.objects.filter(room_id=room_id)
            .select_related('sender')
            .order_by('-created_at')[:limit]
        )
        
        # Format messages for frontend
        formatted_messages = []
        for msg in reversed(messages):  # Reverse to get chronological order
            formatted_messages.append({
                "id": str(msg.id),
                "sender": msg.sender.username,
                "sender_id": str(msg.sender.id),
                "message": msg.message,
                "created_at": msg.created_at.isoformat(),
                "is_mine": False  # Frontend will determine this
            })
        
        await sio.emit("room_messages", {
            "room_id": str(room_id),
            "messages": formatted_messages
        }, to=sid)
        
    except Exception as e:
        print(f"❌ Error fetching messages: {str(e)}")
        await sio.emit("error", {"error": f"Failed to fetch messages: {str(e)}"}, to=sid)
