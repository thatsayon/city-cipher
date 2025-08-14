// app/dashboard/messaging/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Common/Sidebar';
import useApi from '@/hook/useApi'; // Adjust the import path as needed
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Star,
  Archive,
  Trash2,
  Image,
  File,
  Plus,
  Circle,
  Filter,
  CheckCheck,
  Check,
  Users,
  User,
  MessageCircle,
  Loader2
} from 'lucide-react';

interface ChatRoom {
  id: string;
  room_type: string;
  room_name: string;
  created_at: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatRoom[];
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  status: 'online' | 'offline' | 'away';
  type: 'user' | 'team';
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

function MessagingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const { callApi, isLoading, error } = useApi<ApiResponse>();

  // Fetch chat rooms on component mount
  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await callApi({
        method: 'GET',
        url: '/chat/user-chat-room/'
      });

      if (response && response.results) {
        setChatRooms(response.results);
        
        // Transform chat rooms to contacts format
        const transformedContacts: Contact[] = response.results.map((room, index) => ({
          id: room.id,
          name: room.room_name,
          avatar: getAvatarInitials(room.room_name),
          lastMessage: 'No messages yet',
          timestamp: formatTimestamp(room.created_at),
          unreadCount: 0,
          isOnline: room.room_type === 'team',
          status: room.room_type === 'team' ? 'online' as const : 'offline' as const,
          type: room.room_type as 'user' | 'team'
        }));

        setContacts(transformedContacts);
        
        // Auto-select first room if available
        if (transformedContacts.length > 0) {
          setSelectedContact(transformedContacts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err);
    }
  };

  const getAvatarInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users size={14} className="text-blue-500" />;
      case 'user':
      default:
        return <User size={14} className="text-green-500" />;
    }
  };

  // Sample messages (you can replace this with actual API call for messages)
  const messages: Message[] = [
    {
      id: '1',
      senderId: 'other',
      content: 'Welcome to the chat room!',
      timestamp: '10:30 AM',
      isRead: true,
      type: 'text',
      status: 'read'
    }
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Add message logic here - you can integrate with your message API
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContactData = contacts.find(c => c.id === selectedContact);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="flex h-full">
          {/* Contacts Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={fetchChatRooms}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Filter size={18} />}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chat rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Chat Rooms List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && contacts.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading chat rooms...</p>
                  </div>
                </div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                      selectedContact === contact.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                        contact.type === 'team' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-gradient-to-br from-green-500 to-teal-600'
                      }`}>
                        {contact.avatar}
                      </div>
                      {contact.isOnline && (
                        <Circle
                          size={12}
                          className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full"
                        />
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {contact.name}
                          </h3>
                          {getRoomTypeIcon(contact.type)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {contact.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {contact.lastMessage}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No chat rooms found</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedContactData ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          selectedContactData.type === 'team' 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-br from-green-500 to-teal-600'
                        }`}>
                          {selectedContactData.avatar}
                        </div>
                        {selectedContactData.isOnline && (
                          <Circle
                            size={10}
                            className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full"
                          />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {selectedContactData.name}
                          </h3>
                          {getRoomTypeIcon(selectedContactData.type)}
                        </div>
                        <p className="text-sm text-gray-500 capitalize">
                          {selectedContactData.type} chat • {selectedContactData.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Phone size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Video size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Info size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === 'me' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === 'me'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{message.timestamp}</span>
                          {message.senderId === 'me' && getStatusIndicator(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-end space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Paperclip size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Image size={18} />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded">
                        <Smile size={18} />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No chat room selected
                  </h3>
                  <p className="text-gray-500">
                    Choose a chat room from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagingPage;