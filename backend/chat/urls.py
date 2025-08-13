from django.urls import path
from .views import ChatHistoryView

urlpatterns = [
    path('<int:room_id>/', ChatHistoryView.as_view(), name='chat-history'),
]
