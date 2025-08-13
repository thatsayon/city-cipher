from django.contrib import admin
from .models import ChatMessage, ChatRoom

class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_team_name', 'room_type', 'user', 'created_at')

    def get_team_name(self, obj):
        return obj.team.name if obj.team else "-"
    get_team_name.short_description = 'Team Name'
    get_team_name.admin_order_field = 'team__name'  # allows sorting by team name

admin.site.register(ChatRoom, ChatRoomAdmin)

admin.site.register(ChatMessage)
