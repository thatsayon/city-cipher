from django.contrib import admin
from .models import ChatMessage, ChatRoom


# @admin.register(ChatRoom)
# class ChatRoomAdmin(admin.ModelAdmin):
#     list_display = ('id', 'room_type', 'team', 'user_1', 'user_2', 'created_at')
#     list_filter = ('room_type', 'created_at')
#     search_fields = ('team__name', 'user_1__username', 'user_2__username')
#
admin.site.register(ChatRoom)

admin.site.register(ChatMessage)
