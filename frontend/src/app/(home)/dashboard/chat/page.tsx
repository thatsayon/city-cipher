// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import Sidebar from '@/components/Common/Sidebar';
// import useApi from '@/hook/useApi';
// import { 
//   Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Info, 
//   Star, Archive, Trash2, Image, File, Plus, Circle, Filter, CheckCheck, 
//   Check, Users, User, MessageCircle, Loader2 
// } from 'lucide-react';

// interface LatestMessage {
//   id: string;
//   sender: string;
//   sender_id: string;
//   message: string;
//   created_at: string;
//   is_mine: boolean;
// }

// interface ChatRoom {
//   id: string;
//   room_type: string;
//   team_name: string;
//   user_name: string;
//   created_at: string;
//   latest_messages: LatestMessage[];
// }

// interface ApiResponse {
//   count: number;
//   next: string | null;
//   previous: string | null;
//   results: ChatRoom[];
// }

// interface Contact {
//   id: string;
//   name: string;
//   avatar: string;
//   lastMessage: string;
//   timestamp: string;
//   unreadCount: number;
//   isOnline: boolean;
//   status: 'online' | 'offline' | 'away';
//   type: 'user' | 'team';
// }

// interface Message {
//   id: string;
//   senderId: string;
//   sender: string;
//   content: string;
//   timestamp: string;
//   isRead: boolean;
//   type: 'text' | 'image' | 'file';
//   status: 'sent' | 'delivered' | 'read';
//   isMine: boolean;
//   roomId: string;
// }

// function MessagingPage() {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [selectedContact, setSelectedContact] = useState<string>('');
//   const [messageInput, setMessageInput] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
//   const [contacts, setContacts] = useState<Contact[]>([]);
  
//   // Store messages for ALL rooms, not just current room
//   const [allMessages, setAllMessages] = useState<{ [roomId: string]: Message[] }>({});
  
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [authenticated, setAuthenticated] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [loadingMessages, setLoadingMessages] = useState<{ [roomId: string]: boolean }>({});
//   const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
//   const [joiningRooms, setJoiningRooms] = useState<Set<string>>(new Set());
  
//   const socketRef = useRef<Socket | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const { callApi, isLoading, error } = useApi<ApiResponse>();
  
//   const getCookie = (name: string): string | null => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) {
//       return parts.pop()?.split(';').shift() || null;
//     }
//     return null;
//   };

//   // Get current user ID
//   const getCurrentUserId = () => {
//     try {
//       const accessToken = getCookie('access_token');
      
//       if (!accessToken) {
//         console.error('No access token found in cookies');
//         return null;
//       }

//       const tokenParts = accessToken.split('.');
//       if (tokenParts.length !== 3) {
//         console.error('Invalid JWT token format');
//         return null;
//       }

//       const payload = JSON.parse(atob(tokenParts[1]));
//       const userId = payload.user_id || payload.userId || payload.sub || payload.id;
      
//       if (!userId) {
//         console.error('No user ID found in token payload');
//         return null;
//       }

//       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
//       if (!uuidRegex.test(userId)) {
//         console.error('User ID is not a valid UUID format:', userId);
//         return null;
//       }

//       return userId;
//     } catch (error) {
//       console.error('Error extracting user ID from JWT token:', error);
//       return null;
//     }
//   };

//   // Auto-scroll to bottom of messages for current room only
//   const scrollToBottom = () => {
//     if (selectedContact) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   };

//   // Get messages for the currently selected room
//   const currentRoomMessages = selectedContact ? (allMessages[selectedContact] || []) : [];

//   useEffect(() => {
//     scrollToBottom();
//   }, [currentRoomMessages, selectedContact]);

//   // Initialize current user ID
//   useEffect(() => {
//     const userId = getCurrentUserId();
//     setCurrentUserId(userId);
//   }, []);

//   // Initialize Socket.IO connection ONCE when component mounts
//   useEffect(() => {
//     const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    
//     console.log('🔌 Initializing socket connection...');
//     socketRef.current = io(SOCKET_URL, {
//       transports: ['websocket', 'polling'],
//     });

//     const socket = socketRef.current;

//     socket.on('connect', () => {
//       console.log('🔌 Connected to socket server');
//       setSocketConnected(true);
//     });

//     socket.on('disconnect', () => {
//       console.log('❌ Disconnected from socket server');
//       setSocketConnected(false);
//       setAuthenticated(false);
//       setJoinedRooms(new Set());
//       setJoiningRooms(new Set());
//     });

//     // Handle authentication response
//     socket.on('authentication_success', (data) => {
//       console.log('✅ Authentication successful:', data);
//       setAuthenticated(true);
//     });

//     // Handle room join confirmation
//     socket.on('room_joined', (data) => {
//       console.log('✅ Successfully joined room:', data);
//       setJoinedRooms(prev => new Set([...prev, data.room_id]));
//       setJoiningRooms(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(data.room_id);
//         return newSet;
//       });
//     });

//     // Handle room leave confirmation
//     socket.on('room_left', (data) => {
//       console.log('👋 Successfully left room:', data);
//       setJoinedRooms(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(data.room_id);
//         return newSet;
//       });
//     });

//     // Handle already in room
//     socket.on('already_in_room', (data) => {
//       console.log('ℹ️ Already in room:', data.room_id);
//       setJoinedRooms(prev => new Set([...prev, data.room_id]));
//       setJoiningRooms(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(data.room_id);
//         return newSet;
//       });
//     });

//     socket.on('user_joined', (data) => {
//       console.log('👤 User joined room:', data);
//     });

//     socket.on('user_left', (data) => {
//       console.log('👋 User left room:', data);
//     });

//     // Global message listener - THIS IS THE KEY FIX
//     socket.on('new_message', (data) => {
//       console.log('📨 New message received:', data);
      
//       const messageRoomId = data.room_id;
      
//       // Create new message object
//       const newMessage: Message = {
//         id: data.id || Date.now().toString(),
//         senderId: data.sender_id || 'unknown',
//         sender: data.sender,
//         content: data.message,
//         timestamp: formatTimestamp(data.created_at || data.timestamp || new Date().toISOString()),
//         isRead: false,
//         type: 'text',
//         status: 'delivered',
//         isMine: data.sender_id === currentUserId,
//         roomId: messageRoomId,
//       };

//       // Add message to the specific room's message array
//       setAllMessages(prev => {
//         const existingMessages = prev[messageRoomId] || [];
        
//         // Check if message already exists (to prevent duplicates)
//         const messageExists = existingMessages.some(msg => 
//           msg.id === newMessage.id || 
//           (msg.content === newMessage.content && 
//            msg.senderId === newMessage.senderId && 
//            Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000)
//         );
        
//         if (messageExists) {
//           console.log('Message already exists, skipping duplicate');
//           return prev;
//         }
        
//         return {
//           ...prev,
//           [messageRoomId]: [...existingMessages, newMessage]
//         };
//       });
      
//       // Update the contact's last message and unread count
//       setContacts(prev => prev.map(contact => {
//         if (contact.id === messageRoomId) {
//           return {
//             ...contact,
//             lastMessage: data.message,
//             timestamp: newMessage.timestamp,
//             unreadCount: selectedContact === messageRoomId ? 0 : contact.unreadCount + 1
//           };
//         }
//         return contact;
//       }));
//     });

//     // Room messages listener - handles initial message loading for a room
//     socket.on('room_messages', (data) => {
//       console.log('📋 Room messages received:', data);
//       const roomId = data.room_id;
      
//       setLoadingMessages(prev => ({ ...prev, [roomId]: false }));
      
//       if (data.messages) {
//         const roomMessages: Message[] = data.messages.map((msg: any) => ({
//           id: msg.id,
//           senderId: msg.sender_id,
//           sender: msg.sender,
//           content: msg.message,
//           timestamp: formatTimestamp(msg.created_at),
//           isRead: true,
//           type: 'text',
//           status: msg.sender_id === currentUserId ? 'read' : 'delivered',
//           isMine: msg.sender_id === currentUserId,
//           roomId: roomId,
//         }));
        
//         // Store messages for this specific room
//         setAllMessages(prev => ({
//           ...prev,
//           [roomId]: roomMessages
//         }));
//       }
//     });

//     socket.on('error', (error) => {
//       console.error('❌ Socket error:', error);
//       if (error.error) {
//         console.error('Backend error:', error.error);
        
//         // Handle specific error cases
//         if (error.error.includes('authentication required')) {
//           setAuthenticated(false);
//         }
        
//         // Remove from joining rooms if join failed
//         if (error.error.includes('join')) {
//           setJoiningRooms(prev => {
//             const newSet = new Set(prev);
//             newSet.clear(); // Clear all joining rooms on error
//             return newSet;
//           });
//         }
//       }
//     });

//     // Cleanup: disconnect socket when component unmounts
//     return () => {
//       console.log('🔌 Cleaning up socket connection...');
//       socket.disconnect();
//     };
//   }, []); // Remove dependencies to prevent re-initialization

//   // Separate effect for authentication when currentUserId is available
//   useEffect(() => {
//     if (socketConnected && currentUserId && !authenticated && socketRef.current) {
//       console.log('🔐 Authenticating user:', currentUserId);
//       socketRef.current.emit('authenticate_user', {
//         user_id: currentUserId
//       });
//     }
//   }, [socketConnected, currentUserId, authenticated]);

//   // Separate effect for room joining when selecting a contact
//   useEffect(() => {
//     if (selectedContact && socketRef.current && socketConnected && currentUserId && authenticated) {
//       // Only join if we haven't joined this room yet and aren't currently joining
//       if (!joinedRooms.has(selectedContact) && !joiningRooms.has(selectedContact)) {
//         console.log('🏠 Joining room:', selectedContact);
        
//         // Mark as joining to prevent duplicate requests
//         setJoiningRooms(prev => new Set([...prev, selectedContact]));
        
//         socketRef.current.emit('join_room', {
//           room_id: selectedContact,
//           user_id: currentUserId
//         });
//       }
      
//       // Request messages if we don't have them and we're joined
//       if (joinedRooms.has(selectedContact) && !allMessages[selectedContact] && !loadingMessages[selectedContact]) {
//         setLoadingMessages(prev => ({ ...prev, [selectedContact]: true }));
//         socketRef.current.emit('get_room_messages', {
//           room_id: selectedContact,
//           limit: 50
//         });
//       }
      
//       // Mark messages as read for the selected room
//       setContacts(prev => prev.map(contact => {
//         if (contact.id === selectedContact) {
//           return { ...contact, unreadCount: 0 };
//         }
//         return contact;
//       }));
//     }
//   }, [selectedContact, socketConnected, currentUserId, authenticated, joinedRooms, joiningRooms]);

//   // Effect to request messages when a room is joined
//   useEffect(() => {
//     if (socketRef.current && selectedContact && joinedRooms.has(selectedContact) && !allMessages[selectedContact] && !loadingMessages[selectedContact]) {
//       setLoadingMessages(prev => ({ ...prev, [selectedContact]: true }));
//       socketRef.current.emit('get_room_messages', {
//         room_id: selectedContact,
//         limit: 50
//       });
//     }
//   }, [joinedRooms, selectedContact, allMessages, loadingMessages]);

//   // Fetch chat rooms on component mount
//   useEffect(() => {
//     fetchChatRooms();
//   }, []);

//   const fetchChatRooms = async () => {
//     try {
//       const response = await callApi({
//         method: 'GET',
//         url: '/chat/user-chat-room/'
//       });

//       if (response && response.results) {
//         setChatRooms(response.results);
        
//         const transformedContacts: Contact[] = response.results.map((room) => {
//           const displayName = room.team_name || room.user_name || 'Unknown';
//           const latestMsg = room.latest_messages && room.latest_messages.length > 0 
//             ? room.latest_messages[0] : null;

//           return {
//             id: room.id,
//             name: displayName,
//             avatar: getAvatarInitials(displayName),
//             lastMessage: latestMsg ? latestMsg.message : 'No messages yet',
//             timestamp: latestMsg ? formatTimestamp(latestMsg.created_at) : formatTimestamp(room.created_at),
//             unreadCount: 0,
//             isOnline: room.room_type === 'team',
//             status: room.room_type === 'team' ? 'online' as const : 'offline' as const,
//             type: room.room_type as 'user' | 'team',
//           };
//         });

//         setContacts(transformedContacts);

//         // Auto-select first contact if none selected
//         if (transformedContacts.length > 0 && !selectedContact) {
//           setSelectedContact(transformedContacts[0].id);
//         }
//       }
//     } catch (err) {
//       console.error('Failed to fetch chat rooms:', err);
//     }
//   };

//   const getAvatarInitials = (name: string): string => {
//     return name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const formatTimestamp = (timestamp: string): string => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffInMs = now.getTime() - date.getTime();
//     const diffInHours = diffInMs / (1000 * 60 * 60);
//     const diffInDays = diffInHours / 24;

//     if (diffInHours < 1) {
//       const minutes = Math.floor(diffInMs / (1000 * 60));
//       return minutes <= 0 ? 'Just now' : `${minutes} min ago`;
//     } else if (diffInHours < 24) {
//       return `${Math.floor(diffInHours)} hours ago`;
//     } else if (diffInDays < 7) {
//       return `${Math.floor(diffInDays)} days ago`;
//     } else {
//       return date.toLocaleDateString();
//     }
//   };

//   const getRoomTypeIcon = (type: string) => {
//     switch (type) {
//       case 'team':
//         return <Users size={14} className="text-blue-500" />;
//       case 'user':
//       default:
//         return <User size={14} className="text-green-500" />;
//     }
//   };

//   const handleSendMessage = () => {
//     if (messageInput.trim() && selectedContact && socketRef.current && socketConnected && currentUserId && authenticated) {
//       const messageContent = messageInput.trim();
      
//       // Check if we're in the room
//       if (!joinedRooms.has(selectedContact)) {
//         console.warn('Cannot send message: not joined to room', selectedContact);
//         alert('You must join the room first before sending messages.');
//         return;
//       }
      
//       // Emit message via socket
//       socketRef.current.emit('send_message', {
//         room_id: selectedContact,
//         message: messageContent,
//         sender_id: currentUserId // Include sender_id for clarity
//       });

//       // Clear input immediately
//       setMessageInput('');

//       // NOTE: We don't add optimistic update here anymore since 
//       // the new_message event will handle adding the message to state
//       // This prevents duplicate messages
      
//     } else if (!currentUserId) {
//       alert('Authentication error. Please log in again.');
//     } else if (!authenticated) {
//       alert('Please wait for authentication to complete.');
//     } else if (!joinedRooms.has(selectedContact)) {
//       alert('Please wait for room connection to complete.');
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const getStatusIndicator = (status: string) => {
//     switch (status) {
//       case 'sent':
//         return <Check size={14} className="text-gray-400" />;
//       case 'delivered':
//         return <CheckCheck size={14} className="text-gray-400" />;
//       case 'read':
//         return <CheckCheck size={14} className="text-blue-500" />;
//       default:
//         return null;
//     }
//   };

//   const filteredContacts = contacts.filter(contact =>
//     contact.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const selectedContactData = contacts.find(c => c.id === selectedContact);
//   const isCurrentRoomLoading = selectedContact ? loadingMessages[selectedContact] : false;
//   const isCurrentRoomJoining = selectedContact ? joiningRooms.has(selectedContact) : false;

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
//       <div className={`flex-1 transition-all duration-300 ${
//         sidebarCollapsed ? 'ml-16' : 'ml-64'
//       }`}>
//         <div className="flex h-full">
//           {/* Contacts Sidebar */}
//           <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//             {/* Header */}
//             <div className="p-4 border-b border-gray-200">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center space-x-2">
//                   <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
//                   <div className={`w-2 h-2 rounded-full ${
//                     socketConnected ? 'bg-green-500' : 'bg-red-500'
//                   }`} title={socketConnected ? 'Connected' : 'Disconnected'} />
//                   {joinedRooms.size > 0 && (
//                     <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                       {joinedRooms.size} rooms joined
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <button
//                     onClick={fetchChatRooms}
//                     disabled={isLoading}
//                     className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
//                     title="Refresh chat rooms"
//                   >
//                     {isLoading ? (
//                       <Loader2 size={18} className="animate-spin" />
//                     ) : (
//                       <Filter size={18} />
//                     )}
//                   </button>
//                   <button 
//                     className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
//                     title="New chat"
//                   >
//                     <Plus size={18} />
//                   </button>
//                 </div>
//               </div>
              
//               {/* Search */}
//               <div className="relative">
//                 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search chat rooms..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                 />
//               </div>
              
//               {/* Error Message */}
//               {error && (
//                 <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
//                   <p className="text-sm text-red-600">{error}</p>
//                 </div>
//               )}
//             </div>

//             {/* Chat Rooms List */}
//             <div className="flex-1 overflow-y-auto">
//               {isLoading && contacts.length === 0 ? (
//                 <div className="flex items-center justify-center p-8">
//                   <div className="text-center">
//                     <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-2" />
//                     <p className="text-gray-500">Loading chat rooms...</p>
//                   </div>
//                 </div>
//               ) : filteredContacts.length > 0 ? (
//                 filteredContacts.map((contact) => (
//                   <div
//                     key={contact.id}
//                     onClick={() => setSelectedContact(contact.id)}
//                     className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
//                       selectedContact === contact.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
//                     }`}
//                   >
//                     <div className="relative flex-shrink-0">
//                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
//                         contact.type === 'team'
//                           ? 'bg-gradient-to-br from-blue-500 to-purple-600'
//                           : 'bg-gradient-to-br from-green-500 to-teal-600'
//                       }`}>
//                         {contact.avatar}
//                       </div>
//                       {contact.isOnline && (
//                         <Circle size={12} className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full" />
//                       )}
//                     </div>
//                     <div className="ml-3 flex-1 min-w-0">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-2">
//                           <h3 className="font-medium text-gray-900 truncate">
//                             {contact.name}
//                           </h3>
//                           {getRoomTypeIcon(contact.type)}
//                           {joinedRooms.has(contact.id) && (
//                             <Circle size={6} className="fill-green-500 text-green-500" title="Joined" />
//                           )}
//                         </div>
//                         <span className="text-xs text-gray-500">
//                           {contact.timestamp}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between mt-1">
//                         <p className="text-sm text-gray-600 truncate">
//                           {contact.lastMessage}
//                         </p>
//                         {contact.unreadCount > 0 && (
//                           <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
//                             {contact.unreadCount}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="flex items-center justify-center p-8">
//                   <div className="text-center">
//                     <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
//                     <p className="text-gray-500">
//                       {searchQuery ? 'No matching chat rooms found' : 'No chat rooms found'}
//                     </p>
//                     {searchQuery && (
//                       <button 
//                         onClick={() => setSearchQuery('')}
//                         className="text-blue-500 text-sm mt-2 hover:underline"
//                       >
//                         Clear search
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Chat Area */}
//           <div className="flex-1 flex flex-col">
//             {selectedContactData ? (
//               <>
//                 {/* Chat Header */}
//                 <div className="bg-white border-b border-gray-200 p-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center">
//                       <div className="relative">
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
//                           selectedContactData.type === 'team'
//                             ? 'bg-gradient-to-br from-blue-500 to-purple-600'
//                             : 'bg-gradient-to-br from-green-500 to-teal-600'
//                         }`}>
//                           {selectedContactData.avatar}
//                         </div>
//                         {selectedContactData.isOnline && (
//                           <Circle size={10} className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full" />
//                         )}
//                       </div>
//                       <div className="ml-3">
//                         <div className="flex items-center space-x-2">
//                           <h3 className="font-medium text-gray-900">
//                             {selectedContactData.name}
//                           </h3>
//                           {getRoomTypeIcon(selectedContactData.type)}
//                           {joinedRooms.has(selectedContactData.id) && (
//                             <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
//                               Joined
//                             </span>
//                           )}
//                         </div>
//                         <p className="text-sm text-gray-500 capitalize">
//                           {selectedContactData.type} chat • {selectedContactData.status}
//                           {socketConnected && <span className="ml-2 text-green-500">• Connected</span>}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                         <Phone size={18} />
//                       </button>
//                       <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                         <Video size={18} />
//                       </button>
//                       <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                         <Info size={18} />
//                       </button>
//                       <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                         <MoreVertical size={18} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Messages */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
//                   {isCurrentRoomLoading ? (
//                     <div className="flex items-center justify-center py-8">
//                       <div className="text-center">
//                         <Loader2 size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
//                         <p className="text-gray-500 text-sm">Loading messages...</p>
//                       </div>
//                     </div>
//                   ) : currentRoomMessages.length > 0 ? (
//                     currentRoomMessages.map((message) => (
//                       <div
//                         key={message.id}
//                         className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
//                       >
//                         <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
//                           message.isMine
//                             ? 'bg-blue-500 text-white'
//                             : 'bg-white text-gray-900 border border-gray-200'
//                         }`}>
//                           {!message.isMine && (
//                             <span className="block text-xs font-semibold mb-1 text-gray-500">
//                               {message.sender}
//                             </span>
//                           )}
//                           <p className="text-sm whitespace-pre-wrap">{message.content}</p>
//                           <div className={`flex items-center justify-end mt-1 space-x-1 ${
//                             message.isMine ? 'text-blue-100' : 'text-gray-500'
//                           }`}>
//                             <span className="text-xs">{message.timestamp}</span>
//                             {message.isMine && getStatusIndicator(message.status)}
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="flex items-center justify-center py-8">
//                       <div className="text-center">
//                         <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
//                         <p className="text-gray-500">No messages yet</p>
//                         <p className="text-gray-400 text-sm">Start the conversation!</p>
//                       </div>
//                     </div>
//                   )}
//                   <div ref={messagesEndRef} />
//                 </div>

//                 {/* Message Input */}
//                 <div className="bg-white border-t border-gray-200 p-4">
//                   <div className="flex items-end space-x-2">
//                     <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                       <Paperclip size={18} />
//                     </button>
//                     <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
//                       <Image size={18} />
//                     </button>
//                     <div className="flex-1 relative">
//                       <textarea
//                         value={messageInput}
//                         onChange={(e) => setMessageInput(e.target.value)}
//                         onKeyPress={handleKeyPress}
//                         placeholder={
//                           !socketConnected 
//                             ? "Connecting..." 
//                             : !currentUserId 
//                               ? "Please log in to send messages..."
//                               : !joinedRooms.has(selectedContact)
//                                 ? "Joining room..."
//                                 : "Type a message..."
//                         }
//                         disabled={!socketConnected || !currentUserId || !joinedRooms.has(selectedContact)}
//                         className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
//                         rows={1}
//                         style={{ minHeight: '44px', maxHeight: '120px' }}
//                       />
//                       <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded">
//                         <Smile size={18} />
//                       </button>
//                     </div>
//                     <button
//                       onClick={handleSendMessage}
//                       disabled={!messageInput.trim() || !socketConnected || !currentUserId || !joinedRooms.has(selectedContact)}
//                       className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//                       title={
//                         !socketConnected 
//                           ? "Connecting to server..." 
//                           : !currentUserId 
//                             ? "Please log in to send messages"
//                             : !joinedRooms.has(selectedContact)
//                               ? "Joining room..."
//                               : !messageInput.trim()
//                                 ? "Type a message to send"
//                                 : "Send message"
//                       }
//                     >
//                       <Send size={18} />
//                     </button>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div className="flex-1 flex items-center justify-center bg-gray-50">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <MessageCircle size={24} className="text-gray-400" />
//                   </div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">
//                     No chat room selected
//                   </h3>
//                   <p className="text-gray-500">
//                     Choose a chat room from the sidebar to start messaging
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MessagingPage;

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Sidebar from '@/components/Common/Sidebar';
import useApi from '@/hook/useApi';
import { 
  Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Info, 
  Star, Archive, Trash2, Image, File, Plus, Circle, Filter, CheckCheck, 
  Check, Users, User, MessageCircle, Loader2 
} from 'lucide-react';

interface LatestMessage {
  id: string;
  sender: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_mine: boolean;
}

interface ChatRoom {
  id: string;
  room_type: string;
  team_name: string;
  user_name: string;
  created_at: string;
  latest_messages: LatestMessage[];
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
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  isMine: boolean;
  roomId: string;
}

function MessagingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Store messages for ALL rooms, not just current room
  const [allMessages, setAllMessages] = useState<{ [roomId: string]: Message[] }>({});
  
  const [socketConnected, setSocketConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<{ [roomId: string]: boolean }>({});
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  const [joiningRooms, setJoiningRooms] = useState<Set<string>>(new Set());
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { callApi, isLoading, error } = useApi<ApiResponse>();
  
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      const accessToken = getCookie('access_token');
      
      if (!accessToken) {
        console.error('No access token found in cookies');
        return null;
      }

      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.user_id || payload.userId || payload.sub || payload.id;
      
      if (!userId) {
        console.error('No user ID found in token payload');
        return null;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('User ID is not a valid UUID format:', userId);
        return null;
      }

      return userId;
    } catch (error) {
      console.error('Error extracting user ID from JWT token:', error);
      return null;
    }
  };

  // Auto-scroll to bottom of messages for current room only
  const scrollToBottom = () => {
    if (selectedContact) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get messages for the currently selected room
  const currentRoomMessages = selectedContact ? (allMessages[selectedContact] || []) : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentRoomMessages, selectedContact]);

  // Initialize current user ID
  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, []);

  // Initialize Socket.IO connection ONCE when component mounts
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    
    console.log('🔌 Initializing socket connection...');
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setSocketConnected(false);
      setAuthenticated(false);
      setJoinedRooms(new Set());
      setJoiningRooms(new Set());
    });

    // Handle authentication response
    socket.on('authentication_success', (data) => {
      console.log('✅ Authentication successful:', data);
      setAuthenticated(true);
    });

    // Handle room join confirmation
    socket.on('room_joined', (data) => {
      console.log('✅ Successfully joined room:', data);
      setJoinedRooms(prev => new Set([...prev, data.room_id]));
      setJoiningRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.room_id);
        return newSet;
      });
    });

    // Handle room leave confirmation
    socket.on('room_left', (data) => {
      console.log('👋 Successfully left room:', data);
      setJoinedRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.room_id);
        return newSet;
      });
    });

    // Handle already in room
    socket.on('already_in_room', (data) => {
      console.log('ℹ️ Already in room:', data.room_id);
      setJoinedRooms(prev => new Set([...prev, data.room_id]));
      setJoiningRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.room_id);
        return newSet;
      });
    });

    socket.on('user_joined', (data) => {
      console.log('👤 User joined room:', data);
    });

    socket.on('user_left', (data) => {
      console.log('👋 User left room:', data);
    });

    // Global message listener - THIS IS THE KEY FIX
    socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      
      const messageRoomId = data.room_id;
      
      // Create new message object
      const newMessage: Message = {
        id: data.id || Date.now().toString(),
        senderId: data.sender_id || 'unknown',
        sender: data.sender,
        content: data.message,
        timestamp: formatTimestamp(data.created_at || data.timestamp || new Date().toISOString()),
        isRead: false,
        type: 'text',
        status: 'delivered',
        isMine: data.sender_id === currentUserId,
        roomId: messageRoomId,
      };

      // Add message to the specific room's message array
      setAllMessages(prev => {
        const existingMessages = prev[messageRoomId] || [];
        
        // Check if message already exists (to prevent duplicates)
        const messageExists = existingMessages.some(msg => 
          msg.id === newMessage.id || 
          (msg.content === newMessage.content && 
           msg.senderId === newMessage.senderId && 
           Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 5000)
        );
        
        if (messageExists) {
          console.log('Message already exists, skipping duplicate');
          return prev;
        }
        
        return {
          ...prev,
          [messageRoomId]: [...existingMessages, newMessage]
        };
      });
      
      // Update the contact's last message and unread count
      setContacts(prev => prev.map(contact => {
        if (contact.id === messageRoomId) {
          return {
            ...contact,
            lastMessage: data.message,
            timestamp: newMessage.timestamp,
            unreadCount: selectedContact === messageRoomId ? 0 : contact.unreadCount + 1
          };
        }
        return contact;
      }));
    });

    // Room messages listener - handles initial message loading for a room
    socket.on('room_messages', (data) => {
      console.log('📋 Room messages received:', data);
      const roomId = data.room_id;
      
      setLoadingMessages(prev => ({ ...prev, [roomId]: false }));
      
      if (data.messages) {
        const roomMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          sender: msg.sender,
          content: msg.message,
          timestamp: formatTimestamp(msg.created_at),
          isRead: true,
          type: 'text',
          status: msg.sender_id === currentUserId ? 'read' : 'delivered',
          isMine: msg.sender_id === currentUserId,
          roomId: roomId,
        }));
        
        // Store messages for this specific room
        setAllMessages(prev => ({
          ...prev,
          [roomId]: roomMessages
        }));
      }
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      if (error.error) {
        console.error('Backend error:', error.error);
        
        // Handle specific error cases
        if (error.error.includes('authentication required')) {
          setAuthenticated(false);
        }
        
        // Remove from joining rooms if join failed
        if (error.error.includes('join')) {
          setJoiningRooms(prev => {
            const newSet = new Set(prev);
            newSet.clear(); // Clear all joining rooms on error
            return newSet;
          });
        }
      }
    });

    // Cleanup: disconnect socket when component unmounts
    return () => {
      console.log('🔌 Cleaning up socket connection...');
      socket.disconnect();
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Separate effect for authentication when currentUserId is available
  useEffect(() => {
    if (socketConnected && currentUserId && !authenticated && socketRef.current) {
      console.log('🔐 Authenticating user:', currentUserId);
      socketRef.current.emit('authenticate_user', {
        user_id: currentUserId
      });
    }
  }, [socketConnected, currentUserId, authenticated]);

  // Auto-join all available rooms when authenticated and have contacts
  useEffect(() => {
    if (socketRef.current && socketConnected && currentUserId && authenticated && contacts.length > 0) {
      contacts.forEach(contact => {
        // Only join if we haven't joined this room yet and aren't currently joining
        if (!joinedRooms.has(contact.id) && !joiningRooms.has(contact.id)) {
          console.log('🏠 Auto-joining room:', contact.id, contact.name);
          
          // Mark as joining to prevent duplicate requests
          setJoiningRooms(prev => new Set([...prev, contact.id]));
          
          // Join the room
          socketRef.current!.emit('join_room', {
            room_id: contact.id,
            user_id: currentUserId
          });
        }
      });
    }
  }, [socketConnected, currentUserId, authenticated, contacts, joinedRooms, joiningRooms]);

  // Separate effect for room joining when selecting a contact
  useEffect(() => {
    if (selectedContact && socketRef.current && socketConnected && currentUserId && authenticated) {
      // Only join if we haven't joined this room yet and aren't currently joining
      if (!joinedRooms.has(selectedContact) && !joiningRooms.has(selectedContact)) {
        console.log('🏠 Joining room:', selectedContact);
        
        // Mark as joining to prevent duplicate requests
        setJoiningRooms(prev => new Set([...prev, selectedContact]));
        
        socketRef.current.emit('join_room', {
          room_id: selectedContact,
          user_id: currentUserId
        });
      }
      
      // Request messages if we don't have them and we're joined
      if (joinedRooms.has(selectedContact) && !allMessages[selectedContact] && !loadingMessages[selectedContact]) {
        setLoadingMessages(prev => ({ ...prev, [selectedContact]: true }));
        socketRef.current.emit('get_room_messages', {
          room_id: selectedContact,
          limit: 50
        });
      }
      
      // Mark messages as read for the selected room
      setContacts(prev => prev.map(contact => {
        if (contact.id === selectedContact) {
          return { ...contact, unreadCount: 0 };
        }
        return contact;
      }));
    }
  }, [selectedContact, socketConnected, currentUserId, authenticated, joinedRooms, joiningRooms]);

  // Effect to request messages when a room is joined
  useEffect(() => {
    if (socketRef.current && selectedContact && joinedRooms.has(selectedContact) && !allMessages[selectedContact] && !loadingMessages[selectedContact]) {
      setLoadingMessages(prev => ({ ...prev, [selectedContact]: true }));
      socketRef.current.emit('get_room_messages', {
        room_id: selectedContact,
        limit: 50
      });
    }
  }, [joinedRooms, selectedContact, allMessages, loadingMessages]);

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
        
        const transformedContacts: Contact[] = response.results.map((room) => {
          const displayName = room.team_name || room.user_name || 'Unknown';
          const latestMsg = room.latest_messages && room.latest_messages.length > 0 
            ? room.latest_messages[0] : null;

          return {
            id: room.id,
            name: displayName,
            avatar: getAvatarInitials(displayName),
            lastMessage: latestMsg ? latestMsg.message : 'No messages yet',
            timestamp: latestMsg ? formatTimestamp(latestMsg.created_at) : formatTimestamp(room.created_at),
            unreadCount: 0,
            isOnline: room.room_type === 'team',
            status: room.room_type === 'team' ? 'online' as const : 'offline' as const,
            type: room.room_type as 'user' | 'team',
          };
        });

        setContacts(transformedContacts);

        // Auto-select first contact if none selected
        if (transformedContacts.length > 0 && !selectedContact) {
          setSelectedContact(transformedContacts[0].id);
        }

        // Auto-join all rooms if authenticated and connected
        if (socketRef.current && socketConnected && currentUserId && authenticated) {
          transformedContacts.forEach(contact => {
            if (!joinedRooms.has(contact.id) && !joiningRooms.has(contact.id)) {
              console.log('🏠 Auto-joining room after fetch:', contact.id, contact.name);
              
              setJoiningRooms(prev => new Set([...prev, contact.id]));
              
              socketRef.current!.emit('join_room', {
                room_id: contact.id,
                user_id: currentUserId
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err);
    }
  };

  // Manual connect all rooms function
  const connectAllRooms = () => {
    if (socketRef.current && socketConnected && currentUserId && authenticated) {
      contacts.forEach(contact => {
        if (!joinedRooms.has(contact.id) && !joiningRooms.has(contact.id)) {
          console.log('🏠 Manually joining room:', contact.id, contact.name);
          
          setJoiningRooms(prev => new Set([...prev, contact.id]));
          
          socketRef.current!.emit('join_room', {
            room_id: contact.id,
            user_id: currentUserId
          });
        }
      });
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
      return minutes <= 0 ? 'Just now' : `${minutes} min ago`;
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

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedContact && socketRef.current && socketConnected && currentUserId && authenticated) {
      const messageContent = messageInput.trim();
      
      // Check if we're in the room
      if (!joinedRooms.has(selectedContact)) {
        console.warn('Cannot send message: not joined to room', selectedContact);
        alert('You must join the room first before sending messages.');
        return;
      }
      
      // Emit message via socket
      socketRef.current.emit('send_message', {
        room_id: selectedContact,
        message: messageContent,
        sender_id: currentUserId // Include sender_id for clarity
      });

      // Clear input immediately
      setMessageInput('');

      // NOTE: We don't add optimistic update here anymore since 
      // the new_message event will handle adding the message to state
      // This prevents duplicate messages
      
    } else if (!currentUserId) {
      alert('Authentication error. Please log in again.');
    } else if (!authenticated) {
      alert('Please wait for authentication to complete.');
    } else if (!joinedRooms.has(selectedContact)) {
      alert('Please wait for room connection to complete.');
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
  const isCurrentRoomLoading = selectedContact ? loadingMessages[selectedContact] : false;
  const isCurrentRoomJoining = selectedContact ? joiningRooms.has(selectedContact) : false;

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
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
                  <div className={`w-2 h-2 rounded-full ${
                    socketConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} title={socketConnected ? 'Connected' : 'Disconnected'} />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchChatRooms}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    title="Refresh chat rooms"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Filter size={18} />
                    )}
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="New chat"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="mb-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Connected: {joinedRooms.size}/{contacts.length} rooms
                  </span>
                  {joiningRooms.size > 0 && (
                    <span className="text-blue-500 bg-blue-100 px-2 py-1 rounded">
                      {joiningRooms.size} connecting...
                    </span>
                  )}
                </div>
                {contacts.length - joinedRooms.size > 0 && socketConnected && authenticated && (
                  <button 
                    onClick={connectAllRooms}
                    className="text-blue-500 text-xs hover:underline mt-1"
                    disabled={!socketConnected || !authenticated}
                  >
                    Connect All Remaining ({contacts.length - joinedRooms.size})
                  </button>
                )}
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
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
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
                        <Circle size={12} className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {contact.name}
                          </h3>
                          {getRoomTypeIcon(contact.type)}
                          {joinedRooms.has(contact.id) && (
                            <Circle size={6} className="fill-green-500 text-green-500" title="Joined" />
                          )}
                          {joiningRooms.has(contact.id) && (
                            <Loader2 size={12} className="animate-spin text-blue-500" title="Connecting..." />
                          )}
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
                    <p className="text-gray-500">
                      {searchQuery ? 'No matching chat rooms found' : 'No chat rooms found'}
                    </p>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-blue-500 text-sm mt-2 hover:underline"
                      >
                        Clear search
                      </button>
                    )}
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
                          <Circle size={10} className="absolute -bottom-1 -right-1 fill-green-500 text-green-500 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {selectedContactData.name}
                          </h3>
                          {getRoomTypeIcon(selectedContactData.type)}
                          {joinedRooms.has(selectedContactData.id) && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Joined
                            </span>
                          )}
                          {joiningRooms.has(selectedContactData.id) && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center">
                              <Loader2 size={12} className="animate-spin mr-1" />
                              Connecting...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 capitalize">
                          {selectedContactData.type} chat • {selectedContactData.status}
                          {socketConnected && <span className="ml-2 text-green-500">• Connected</span>}
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
                  {isCurrentRoomLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading messages...</p>
                      </div>
                    </div>
                  ) : currentRoomMessages.length > 0 ? (
                    currentRoomMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          message.isMine
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          {!message.isMine && (
                            <span className="block text-xs font-semibold mb-1 text-gray-500">
                              {message.sender}
                            </span>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            message.isMine ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{message.timestamp}</span>
                            {message.isMine && getStatusIndicator(message.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-gray-400 text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
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
                        placeholder={
                          !socketConnected 
                            ? "Connecting..." 
                            : !currentUserId 
                              ? "Please log in to send messages..."
                              : !joinedRooms.has(selectedContact)
                                ? "Joining room..."
                                : "Type a message..."
                        }
                        disabled={!socketConnected || !currentUserId || !joinedRooms.has(selectedContact)}
                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded">
                        <Smile size={18} />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || !socketConnected || !currentUserId || !joinedRooms.has(selectedContact)}
                      className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      title={
                        !socketConnected 
                          ? "Connecting to server..." 
                          : !currentUserId 
                            ? "Please log in to send messages"
                            : !joinedRooms.has(selectedContact)
                              ? "Joining room..."
                              : !messageInput.trim()
                                ? "Type a message to send"
                                : "Send message"
                      }
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