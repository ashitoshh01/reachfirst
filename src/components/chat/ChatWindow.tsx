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
    file_name?: string;
    file_mime_type?: string;
    file_size?: number;
}

interface ChatWindowProps {
    chatId?: number;
    groupId?: number;
    userId: number;
    onToggleContactInfo?: () => void;
    headerName?: string;
    headerAvatar?: string;
    isOnline?: boolean;
    onBack?: () => void;
}

export default function ChatWindow({
    chatId,
    groupId,
    userId,
    onToggleContactInfo,
    headerName,
    headerAvatar,
    isOnline,
    onBack
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // File Preview States
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewCaption, setPreviewCaption] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Helpers
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType?: string, fileName?: string) => {
        const type = mimeType || '';
        const name = (fileName || '').toLowerCase();
        
        if (type.includes('pdf') || name.endsWith('.pdf')) {
            return (
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            );
        }
        if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
            return (
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2z"/></svg>
            );
        }
        if (type.includes('powerpoint') || type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
            return (
                <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            );
        }
        if (type.includes('zip') || type.includes('compressed') || name.endsWith('.zip') || name.endsWith('.rar')) {
             return (
                 <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z"/></svg>
             );
        }
        return (
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
        );
    };

    const downloadAttachment = async (url: string, filename?: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'downloaded_file';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed, opening in new tab instead', error);
            window.open(url, '_blank');
        }
    };

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

            socket.on('automation_result', (data: any) => {
                if (data.automated && data.totalForwarded > 0) {
                    const groupNames = data.forwardedTo?.map((g: any) => g.groupName).join(', ') || '';
                    console.log(`[Automation] Auto-forwarded to: ${groupNames}`);
                    // You could replace this with a toast notification
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'fixed top-4 right-4 bg-primary text-on-primary px-4 py-3 rounded-lg shadow-2xl z-[9999] text-sm animate-slide-in-right flex items-center gap-2';
                    infoDiv.innerHTML = `<span>🤖</span><span>Auto-forwarded to ${data.totalForwarded} class group(s)</span>`;
                    document.body.appendChild(infoDiv);
                    setTimeout(() => {
                        infoDiv.style.opacity = '0';
                        infoDiv.style.transition = 'opacity 0.5s';
                        setTimeout(() => infoDiv.remove(), 500);
                    }, 3000);
                }
            });

            return () => {
                socket.off('message_received');
                socket.off('automation_result');
            };
        }
    }, [socket]);

    useEffect(() => {
        adjustHeight();
    }, [newMessage]);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

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

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleSendPreview = async () => {
        if (!previewFile) return;

        setSending(true);
        const formData = new FormData();
        formData.append('image', previewFile);

        try {
            const uploadRes = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = uploadRes.data.url;
            const metadata = uploadRes.data.metadata;

            let messageType = 'file';
            if (previewFile.type.startsWith('image/')) messageType = 'image';
            else if (previewFile.type.startsWith('video/')) messageType = 'video';

            const endpoint = chatId
                ? `/api/chats/${chatId}/messages`
                : `/api/groups/${groupId}/messages`;

            const content = previewCaption ? `${url}\n\n${previewCaption}` : url;

            const res = await api.post(endpoint, {
                content: content,
                message_type: messageType,
                metadata: metadata
            });

            const message = res.data.message;
            setMessages((prev) => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });

            if (socket) {
                socket.emit('send_message', {
                    chatId,
                    groupId,
                    message
                });
            }

            // Reset preview state
            setPreviewFile(null);
            setPreviewUrl(null);
            setPreviewCaption('');

        } catch (error) {
            console.error('File send error:', error);
            alert('Failed to send file');
        } finally {
            setSending(false);
        }
    };

    const cancelPreview = () => {
        setPreviewFile(null);
        setPreviewUrl(null);
        setPreviewCaption('');
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-1">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="md:hidden p-2 -ml-4 mr-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors"
                            aria-label="Back to chats"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => onToggleContactInfo && onToggleContactInfo()}
                        className="flex items-center gap-4 group cursor-pointer rounded-lg hover:bg-surface-elevated/50 px-2 py-1 transition-colors"
                    >
                    <div className="relative">
                        {headerAvatar ? (
                            <img src={headerAvatar} alt={headerName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                                {headerName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
                        )}
                    </div>
                    <div className="text-left">
                        <h3 className="text-text-primary font-medium text-lg leading-tight">{headerName}</h3>
                        {isOnline && <span className="text-xs text-success">Online</span>}
                    </div>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.map((msg) => {
                    const isSent = msg.sender_id === userId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isSent && groupId && (
                                    <span className="text-xs text-text-secondary mb-1 px-2">
                                        {msg.sender_name}
                                    </span>
                                )}
                                <div
                                    className={`${isSent
                                        ? 'bg-message-sent text-message-sent-text rounded-2xl rounded-tr-sm'
                                        : 'bg-surface-elevated text-text-primary rounded-2xl rounded-tl-sm'
                                        } px-4 py-2`}
                                >
                                    {!!msg.is_automated && (
                                        <div className="text-xs opacity-75 mb-1">🤖 Automated Message</div>
                                    )}

                                    {msg.message_type === 'image' ? (
                                        <>
                                            <img src={msg.content.split('\n\n')[0]} alt="Shared image" className="max-w-[240px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content.split('\n\n')[0], '_blank')} />
                                            {msg.content.split('\n\n')[1] && <p className="mt-2 text-sm">{msg.content.split('\n\n').slice(1).join('\n\n')}</p>}
                                        </>
                                    ) : msg.message_type === 'video' ? (
                                        <>
                                            <video src={msg.content.split('\n\n')[0]} controls className="max-w-[240px] rounded-lg" />
                                            {msg.content.split('\n\n')[1] && <p className="mt-2 text-sm">{msg.content.split('\n\n').slice(1).join('\n\n')}</p>}
                                        </>
                                    ) : msg.message_type === 'file' ? (
                                        <div className="flex flex-col gap-2 min-w-[200px] max-w-[260px]">
                                            <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg shadow-sm cursor-pointer hover:bg-surface-elevated transition-colors" onClick={() => downloadAttachment(msg.content.split('\n\n')[0], msg.file_name)}>
                                                <div className="shrink-0">
                                                    {getFileIcon(msg.file_mime_type, msg.file_name)}
                                                </div>
                                                <div className="flex flex-col overflow-hidden w-full">
                                                    <span className="font-medium text-sm text-text-primary truncate" title={msg.file_name || 'Attachment'}>
                                                        {msg.file_name || 'Attachment'}
                                                    </span>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs text-text-secondary truncate pr-2">
                                                            {formatFileSize(msg.file_size)}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadAttachment(msg.content.split('\n\n')[0], msg.file_name);
                                                            }}
                                                            className="text-primary hover:text-primary-hover focus:outline-none"
                                                            title="Download"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {msg.content.split('\n\n')[1] && <p className="text-sm px-1">{msg.content.split('\n\n').slice(1).join('\n\n')}</p>}
                                        </div>
                                    ) : (
                                        <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                    <span
                                        className={`text-xs mt-1 block ${isSent ? 'text-message-sent-text/70' : 'text-text-secondary'
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
            <div className="p-4 bg-surface border-t border-border flex flex-col relative shrink-0">
                {/* File Preview Pane */}
                {previewUrl && previewFile && (
                    <div className="absolute bottom-full left-0 w-full bg-surface border-t border-border p-4 flex flex-col gap-4 z-10 shadow-lg">
                        <div className="flex justify-between items-center bg-surface-elevated p-2 rounded-t-lg">
                            <span className="text-text-primary font-medium px-2">Preview</span>
                            <button type="button" onClick={cancelPreview} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex justify-center bg-bg p-4 rounded-b-lg">
                            {previewFile.type.startsWith('image/') ? (
                                <img src={previewUrl} alt="Preview" className="max-h-[250px] object-contain rounded" />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-surface-elevated rounded-lg min-w-[200px]">
                                    <svg className="w-16 h-16 text-text-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="text-text-primary font-medium text-center truncate max-w-[200px]" title={previewFile.name}>
                                        {previewFile.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={previewCaption}
                                onChange={(e) => setPreviewCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="flex-1 input input-dark"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendPreview();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleSendPreview}
                                disabled={sending}
                                className="bg-primary hover:bg-primary-hover text-on-primary p-3 rounded-full transition-colors disabled:opacity-50"
                            >
                                {sending ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-6 h-6 translate-x-[-1px] translate-y-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2 items-end bg-surface-elevated rounded-2xl px-2 py-1">
                    <label className="cursor-pointer text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-white/5 rounded-full mb-0.5">
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
                    <textarea
                        ref={textareaRef}
                        autoFocus
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 resize-none overflow-hidden min-h-[44px] bg-transparent border-none text-text-body placeholder:text-text-secondary focus:outline-none focus:ring-0 py-3 px-2"
                        style={{ lineHeight: '1.5' }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-primary hover:bg-primary-hover text-on-primary p-2.5 rounded-full mb-0.5 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
                        aria-label="Send message"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5 translate-x-[-1px]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
