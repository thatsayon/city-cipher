from asgiref.sync import sync_to_async

@staticmethod
@sync_to_async
def get_room(room_id):
    from .models import ChatRoom
    try:
        return ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return None

