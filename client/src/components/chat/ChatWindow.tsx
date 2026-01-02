'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import api from '@/lib/api';

interface Message {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_avatar?: string;
    content: string;
    message_type: string;
    is_automated: boolean;
    created_at: string;
}

interface ChatWindowProps {
    chatId?: number;
    groupId?: number;
    userId: number;
    onToggleContactInfo?: () => void;
    headerName?: string;
    headerAvatar?: string;
    isOnline?: boolean;
}

export default function ChatWindow({
    chatId,
    groupId,
    userId,
    onToggleContactInfo,
    headerName,
    headerAvatar,
    isOnline
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (chatId || groupId) {
            loadMessages();

            // Join room
            if (socket) {
                if (chatId) {
                    socket.emit('join_chat', chatId);
                } else if (groupId) {
                    socket.emit('join_group', groupId);
                }
            }

            // Cleanup
            return () => {
                if (socket) {
                    if (chatId) {
                        socket.emit('leave_chat', chatId);
                    } else if (groupId) {
                        socket.emit('leave_group', groupId);
                    }
                }
            };
        }
    }, [chatId, groupId, socket]);

    useEffect(() => {
        if (socket) {
            socket.on('message_received', (message: Message) => {
                setMessages((prev) => {
                    // Prevent duplicates (especially from own writes)
                    if (prev.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            });

            return () => {
                socket.off('message_received');
            };
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const endpoint = chatId
                ? `/api/chats/${chatId}/messages`
                : `/api/groups/${groupId}/messages`;
            const res = await api.get(endpoint);
            setMessages(res.data.messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const endpoint = chatId
                ? `/api/chats/${chatId}/messages`
                : `/api/groups/${groupId}/messages`;

            const res = await api.post(endpoint, {
                content,
                message_type: 'text'
            });

            const message = res.data.message;

            // Add to local state
            setMessages((prev) => [...prev, message]);

            // Emit via socket for real-time delivery
            if (socket) {
                socket.emit('send_message', {
                    chatId,
                    groupId,
                    message
                });
            }

            // Handle automation response
            if (res.data.automation) {
                const { automation } = res.data;
                if (automation.message) {
                    // Show automation feedback
                    alert(automation.message);
                }
                if (automation.automated && automation.sentTo) {
                    alert(`Message automatically sent to ${automation.totalCRs} CR(s)`);
                }
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            alert(error.response?.data?.error || 'Failed to send message');
            // Restore message in input
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file); // Backend expects 'image' key currently

        setSending(true);
        try {
            // 1. Upload File
            const uploadRes = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = uploadRes.data.url;

            // 2. Determine Type
            let messageType = 'file';
            if (file.type.startsWith('image/')) messageType = 'image';
            else if (file.type.startsWith('video/')) messageType = 'video';

            // 3. Send Message
            const endpoint = chatId
                ? `/api/chats/${chatId}/messages`
                : `/api/groups/${groupId}/messages`;

            const res = await api.post(endpoint, {
                content: url,
                message_type: messageType
            });

            // 4. Update UI (Success handled by socket/state logic mostly, but let's be safe)
            const message = res.data.message;
            setMessages((prev) => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });

            // Emit socket
            if (socket) {
                socket.emit('send_message', {
                    chatId,
                    groupId,
                    message
                });
            }

        } catch (error) {
            console.error('File send error:', error);
            alert('Failed to send file');
        } finally {
            setSending(false);
            // Reset input
            e.target.value = '';
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="h-16 border-b border-white/10 bg-surface-dark px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleContactInfo}
                        className="relative group cursor-pointer"
                    >
                        {headerAvatar ? (
                            <img src={headerAvatar} alt={headerName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                {headerName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface-dark"></div>
                        )}
                    </button>
                    <div>
                        <h3 className="text-white font-medium text-lg leading-tight">{headerName}</h3>
                        {isOnline && <span className="text-xs text-green-400">Online</span>}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                    const isSent = msg.sender_id === userId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isSent && groupId && (
                                    <span className="text-xs text-text-dark-secondary mb-1 px-2">
                                        {msg.sender_name}
                                    </span>
                                )}
                                <div
                                    className={`${isSent
                                        ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-surface-dark-hover text-text-dark rounded-2xl rounded-tl-sm'
                                        } px-4 py-2`}
                                >
                                    {!!msg.is_automated && (
                                        <div className="text-xs opacity-75 mb-1">🤖 Automated Message</div>
                                    )}

                                    {msg.message_type === 'image' ? (
                                        <img src={msg.content} alt="Shared image" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />
                                    ) : msg.message_type === 'video' ? (
                                        <video src={msg.content} controls className="max-w-[240px] rounded-lg" />
                                    ) : msg.message_type === 'file' ? (
                                        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            <span className="underline truncate max-w-[150px]">Download File</span>
                                        </a>
                                    ) : (
                                        <p className="break-words white-space-pre-wrap">{msg.content}</p>
                                    )}
                                    <span
                                        className={`text-xs mt-1 block ${isSent ? 'text-white/70' : 'text-text-dark-secondary'
                                            }`}
                                    >
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface-dark border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-3 items-center">
                    <label className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={sending}
                        />
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </label>
                    <input
                        ref={(input) => input && input.focus()}
                        autoFocus
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input input-dark flex-1"

                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="btn btn-primary px-6"
                    >
                        {sending ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}
