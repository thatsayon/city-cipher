# from core.asgi import sio
# from .models import ChatRoom, ChatMessage
# from django.contrib.auth import get_user_model
# from asgiref.sync import sync_to_async
# from datetime import datetime
# import uuid
#
# User = get_user_model()
#
# @sio.event
# async def connect(sid, environ):
#     print(f"🔌 Client connected: {sid}")
#
# @sio.event
# async def disconnect(sid):
#     print(f"❌ Client disconnected: {sid}")
#
# @sio.event
# async def join_room(sid, data):
#     """
#     data = { "room_id": "<room_uuid>" }
#     """
#     room_id = data.get("room_id")
#     if not room_id:
#         await sio.emit("error", {"error": "Room ID is required"}, to=sid)
#         return
#
#     await sio.enter_room(sid, str(room_id))
#     await sio.emit("user_joined", {"sid": sid, "room_id": room_id}, room=str(room_id))
#     print(f"User {sid} joined room {room_id}")
#
# @sio.event
# async def send_message(sid, data):
#     """
#     data = {
#         "room_id": "<room_uuid>",
#         "sender_id": "<user_id>",
#         "message": "Hello!"
#     }
#     """
#     room_id = data.get("room_id")
#     sender_id = data.get("sender_id")
#     message = data.get("message")
#
#     # Validate required fields
#     if not room_id or not sender_id or not message:
#         await sio.emit("error", {"error": "Missing required fields: room_id, sender_id, message"}, to=sid)
#         return
#
#     # Validate message content
#     if not message.strip():
#         await sio.emit("error", {"error": "Message cannot be empty"}, to=sid)
#         return
#
#     try:
#         # Get sender and room from DB
#         sender = await sync_to_async(User.objects.get)(id=sender_id)
#         room = await sync_to_async(ChatRoom.objects.get)(id=room_id)
#
#         # Create and save message to DB
#         chat_message = await sync_to_async(ChatMessage.objects.create)(
#             room=room,
#             sender=sender,
#             message=message.strip()
#         )
#
#         # Get the created message ID and timestamp
#         message_id = str(chat_message.id)
#         created_at = chat_message.created_at.isoformat()
#
#         print(f"💬 Message saved: {sender.username} -> {message} (ID: {message_id})")
#
#     except User.DoesNotExist:
#         await sio.emit("error", {"error": f"User with ID {sender_id} not found"}, to=sid)
#         return
#     except ChatRoom.DoesNotExist:
#         await sio.emit("error", {"error": f"Chat room with ID {room_id} not found"}, to=sid)
#         return
#     except Exception as e:
#         print(f"❌ Error saving message: {str(e)}")
#         await sio.emit("error", {"error": f"Failed to save message: {str(e)}"}, to=sid)
#         return
#
#     # Broadcast message to all users in the room
#     message_data = {
#         "id": message_id,
#         "room_id": str(room_id),
#         "sender": sender.username,
#         "sender_id": str(sender_id),  # Make sure this is a string
#         "message": message.strip(),
#         "created_at": created_at,
#         "timestamp": created_at  # Alternative field name for compatibility
#     }
#
#     await sio.emit("new_message", message_data, room=str(room_id))
#     print(f"📤 Broadcasted message to room {room_id}: {message_data}")
#
# @sio.event
# async def leave_room(sid, data):
#     """
#     Optional: Handle user leaving room
#     data = { "room_id": "<room_uuid>" }
#     """
#     room_id = data.get("room_id")
#     if room_id:
#         await sio.leave_room(sid, str(room_id))
#         await sio.emit("user_left", {"sid": sid, "room_id": room_id}, room=str(room_id))
#         print(f"User {sid} left room {room_id}")
#
# @sio.event
# async def get_room_messages(sid, data):
#     """
#     Optional: Get recent messages for a room
#     data = { "room_id": "<room_uuid>", "limit": 50 }
#     """
#     room_id = data.get("room_id")
#     limit = data.get("limit", 50)
#
#     if not room_id:
#         await sio.emit("error", {"error": "Room ID is required"}, to=sid)
#         return
#
#     try:
#         # Get recent messages from DB
#         messages = await sync_to_async(list)(
#             ChatMessage.objects.filter(room_id=room_id)
#             .select_related('sender')
#             .order_by('-created_at')[:limit]
#         )
#
#         # Format messages for frontend
#         formatted_messages = []
#         for msg in reversed(messages):  # Reverse to get chronological order
#             formatted_messages.append({
#                 "id": str(msg.id),
#                 "sender": msg.sender.username,
#                 "sender_id": str(msg.sender.id),
#                 "message": msg.message,
#                 "created_at": msg.created_at.isoformat(),
#                 "is_mine": False  # Frontend will determine this
#             })
#
#         await sio.emit("room_messages", {
#             "room_id": str(room_id),
#             "messages": formatted_messages
#         }, to=sid)
#
#     except Exception as e:
#         print(f"❌ Error fetching messages: {str(e)}")
#         await sio.emit("error", {"error": f"Failed to fetch messages: {str(e)}"}, to=sid)

# socket_handlers.py
from core.asgi import sio
from .models import ChatRoom, ChatMessage
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from datetime import datetime
import uuid

User = get_user_model()

# Store user sessions and their joined rooms
user_sessions = {}  # {sid: {'user_id': str, 'rooms': set()}}

@sio.event
async def connect(sid, environ):
    print(f"🔌 Client connected: {sid}")
    # Initialize user session
    user_sessions[sid] = {'user_id': None, 'rooms': set()}

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")
    # Clean up user session and leave all rooms
    if sid in user_sessions:
        user_data = user_sessions[sid]
        user_id = user_data.get('user_id')
        joined_rooms = user_data.get('rooms', set())
        
        # Leave all rooms the user was in
        for room_id in joined_rooms:
            await sio.leave_room(sid, str(room_id))
            # Notify other users in the room
            await sio.emit("user_left", {
                "sid": sid, 
                "user_id": user_id,
                "room_id": room_id
            }, room=str(room_id))
            print(f"User {sid} auto-left room {room_id} on disconnect")
        
        # Remove session
        del user_sessions[sid]

@sio.event
async def authenticate_user(sid, data):
    """
    Authenticate user and store their ID in session
    data = { "user_id": "<user_uuid>" }
    """
    user_id = data.get("user_id")
    if not user_id:
        await sio.emit("error", {"error": "User ID is required for authentication"}, to=sid)
        return
    
    try:
        # Verify user exists
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        # Store user ID in session
        if sid in user_sessions:
            user_sessions[sid]['user_id'] = str(user_id)
            
        await sio.emit("authentication_success", {
            "user_id": str(user_id),
            "username": user.username
        }, to=sid)
        
        print(f"✅ User authenticated: {user.username} ({user_id}) -> {sid}")
        
    except User.DoesNotExist:
        await sio.emit("error", {"error": f"User with ID {user_id} not found"}, to=sid)
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        await sio.emit("error", {"error": f"Authentication failed: {str(e)}"}, to=sid)

@sio.event
async def join_room(sid, data):
    """
    data = { "room_id": "<room_uuid>", "user_id": "<user_uuid>" }
    """
    room_id = data.get("room_id")
    user_id = data.get("user_id")
    
    if not room_id:
        await sio.emit("error", {"error": "Room ID is required"}, to=sid)
        return
    
    # Get user_id from session if not provided
    if not user_id and sid in user_sessions:
        user_id = user_sessions[sid].get('user_id')
    
    if not user_id:
        await sio.emit("error", {"error": "User authentication required. Please authenticate first."}, to=sid)
        return
    
    try:
        # Verify room exists and user has access
        room = await sync_to_async(ChatRoom.objects.get)(id=room_id)
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        # Check if user already in this room
        if sid in user_sessions and room_id in user_sessions[sid]['rooms']:
            await sio.emit("already_in_room", {"room_id": room_id}, to=sid)
            return
        
        # Join the socket room
        await sio.enter_room(sid, str(room_id))
        
        # Update session data
        if sid in user_sessions:
            user_sessions[sid]['rooms'].add(room_id)
            user_sessions[sid]['user_id'] = str(user_id)  # Ensure user_id is stored
        
        # Notify others in the room
        await sio.emit("user_joined", {
            "sid": sid,
            "user_id": str(user_id),
            "username": user.username,
            "room_id": room_id
        }, room=str(room_id))
        
        # Confirm to the user
        await sio.emit("room_joined", {
            "room_id": room_id,
            "room_name": room.team_name or room.user_name,
            "total_rooms": len(user_sessions[sid]['rooms'])
        }, to=sid)
        
        print(f"✅ User {user.username} ({sid}) joined room {room_id}")
        
    except ChatRoom.DoesNotExist:
        await sio.emit("error", {"error": f"Chat room with ID {room_id} not found"}, to=sid)
    except User.DoesNotExist:
        await sio.emit("error", {"error": f"User with ID {user_id} not found"}, to=sid)
    except Exception as e:
        print(f"❌ Error joining room: {str(e)}")
        await sio.emit("error", {"error": f"Failed to join room: {str(e)}"}, to=sid)

@sio.event
async def leave_room(sid, data):
    """
    data = { "room_id": "<room_uuid>" }
    """
    room_id = data.get("room_id")
    if not room_id:
        await sio.emit("error", {"error": "Room ID is required"}, to=sid)
        return
    
    try:
        # Leave the socket room
        await sio.leave_room(sid, str(room_id))
        
        # Update session data
        if sid in user_sessions and room_id in user_sessions[sid]['rooms']:
            user_sessions[sid]['rooms'].remove(room_id)
            user_id = user_sessions[sid].get('user_id')
            
            # Notify others in the room
            await sio.emit("user_left", {
                "sid": sid,
                "user_id": user_id,
                "room_id": room_id
            }, room=str(room_id))
            
            # Confirm to the user
            await sio.emit("room_left", {
                "room_id": room_id,
                "total_rooms": len(user_sessions[sid]['rooms'])
            }, to=sid)
            
            print(f"✅ User {sid} left room {room_id}")
        else:
            await sio.emit("error", {"error": "You are not in this room"}, to=sid)
            
    except Exception as e:
        print(f"❌ Error leaving room: {str(e)}")
        await sio.emit("error", {"error": f"Failed to leave room: {str(e)}"}, to=sid)

@sio.event
async def send_message(sid, data):
    """
    data = {
        "room_id": "<room_uuid>",
        "sender_id": "<user_id>",  # Optional - will use session if not provided
        "message": "Hello!"
    }
    """
    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    message = data.get("message")
    
    # Get sender_id from session if not provided
    if not sender_id and sid in user_sessions:
        sender_id = user_sessions[sid].get('user_id')
    
    # Validate required fields
    if not room_id or not sender_id or not message:
        await sio.emit("error", {"error": "Missing required fields: room_id, sender_id, message"}, to=sid)
        return
    
    # Validate message content
    if not message.strip():
        await sio.emit("error", {"error": "Message cannot be empty"}, to=sid)
        return
    
    # Check if user is in the room
    if sid not in user_sessions or room_id not in user_sessions[sid]['rooms']:
        await sio.emit("error", {"error": "You must join the room before sending messages"}, to=sid)
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
        
        print(f"💬 Message saved: {sender.username} -> {message} (ID: {message_id}) in room {room_id}")
        
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
        "sender_id": str(sender_id),
        "message": message.strip(),
        "created_at": created_at,
        "timestamp": created_at
    }
    
    await sio.emit("new_message", message_data, room=str(room_id))
    print(f"📤 Broadcasted message to room {room_id}: {message_data}")

@sio.event
async def get_room_messages(sid, data):
    """
    Get recent messages for a room
    data = { "room_id": "<room_uuid>", "limit": 50 }
    """
    room_id = data.get("room_id")
    limit = data.get("limit", 50)
    
    if not room_id:
        await sio.emit("error", {"error": "Room ID is required"}, to=sid)
        return
    
    # Check if user is in the room
    if sid not in user_sessions or room_id not in user_sessions[sid]['rooms']:
        await sio.emit("error", {"error": "You must join the room before fetching messages"}, to=sid)
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
        
        print(f"📋 Sent {len(formatted_messages)} messages for room {room_id} to {sid}")
        
    except Exception as e:
        print(f"❌ Error fetching messages: {str(e)}")
        await sio.emit("error", {"error": f"Failed to fetch messages: {str(e)}"}, to=sid)

@sio.event
async def get_user_rooms(sid, data):
    """
    Get list of rooms the user has joined in this session
    data = {} (no parameters needed)
    """
    if sid not in user_sessions:
        await sio.emit("error", {"error": "Session not found"}, to=sid)
        return
    
    user_data = user_sessions[sid]
    joined_rooms = list(user_data['rooms'])
    user_id = user_data.get('user_id')
    
    await sio.emit("user_rooms", {
        "user_id": user_id,
        "joined_rooms": joined_rooms,
        "total_rooms": len(joined_rooms)
    }, to=sid)
    
    print(f"📋 Sent room list to {sid}: {joined_rooms}")

# Optional: Add a utility function to get session info
@sio.event
async def get_session_info(sid, data):
    """
    Get current session information
    """
    if sid not in user_sessions:
        await sio.emit("session_info", {
            "authenticated": False,
            "joined_rooms": [],
            "total_rooms": 0
        }, to=sid)
        return
    
    user_data = user_sessions[sid]
    await sio.emit("session_info", {
        "authenticated": user_data.get('user_id') is not None,
        "user_id": user_data.get('user_id'),
        "joined_rooms": list(user_data['rooms']),
        "total_rooms": len(user_data['rooms'])
    }, to=sid)
