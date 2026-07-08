'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import ContactInfo from '@/components/chat/ContactInfo';
import ConfirmationModal from '@/components/ConfirmationModal';
import NewConversationModal from '@/components/chat/NewConversationModal';

interface Chat {
    id: number;
    other_user_id: number;
    other_user_name: string;
    other_user_avatar?: string;
    other_user_online: boolean;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
    automation_enabled?: boolean | number;
    is_teacher_group?: boolean | number;
}

export default function ChatPage() {
    const { user, loading, logout, updateProfile } = useAuth(); // Assuming updateProfile updates context user
    const { socket, connected } = useSocket();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // Sidebar View State
    const [sidebarView, setSidebarView] = useState<'chats' | 'profile' | 'settings'>('chats');

    // Add Contact Modal States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactError, setContactError] = useState('');
    const [isSearchingContact, setIsSearchingContact] = useState(false);
    const [inviteMode, setInviteMode] = useState(false);

    // Contact Info Sidebar Logic (Right side)
    const [showContactInfo, setShowContactInfo] = useState(false);

    // Profile Edit States
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const bioInputRef = useRef<HTMLTextAreaElement | null>(null);

    // Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            loadChatsAndGroups();
            setEditName(user.name);
            setEditBio(user.bio || '');
            setEditAvatar(user.avatar_url || '');

            if (user.role === 'teacher') {
                ensureAdminChat();
            }
        }
    }, [user]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isContactModalOpen) setIsContactModalOpen(false);
                if (showContactInfo) setShowContactInfo(false);
                if (sidebarView === 'profile' || sidebarView === 'settings') setSidebarView('chats');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isContactModalOpen, showContactInfo, sidebarView]);

    // Real-time unread badge increments via socket
    useEffect(() => {
        if (!socket) return;

        const handleIncoming = (message: any) => {
            const chatId = message.chat_id;
            const groupId = message.group_id;
            const senderId = message.sender_id;

            // Don't badge for own messages
            if (senderId === user?.id) return;

            if (chatId) {
                // Only increment if this chat is NOT currently open
                setSelectedChat(current => {
                    if (current !== chatId) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [`chat_${chatId}`]: (prev[`chat_${chatId}`] || 0) + 1
                        }));
                    }
                    return current;
                });
            } else if (groupId) {
                setSelectedGroup(current => {
                    if (current !== groupId) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [`group_${groupId}`]: (prev[`group_${groupId}`] || 0) + 1
                        }));
                    }
                    return current;
                });
            }
        };

        socket.on('message_received', handleIncoming);
        return () => { socket.off('message_received', handleIncoming); };
    }, [socket, user?.id]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingBio && bioInputRef.current) {
            const el = bioInputRef.current;
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [isEditingBio]);

    const ensureAdminChat = async () => {
        try {
            const res = await api.get('/api/users/search?email=despu@despu.edu.in');
            if (res.data.user) {
                await api.post('/api/chats', { otherUserId: res.data.user.id });
                loadChatsAndGroups();
            }
        } catch (error) {
            console.log('Admin chat check skipped');
        }
    };

    const loadChatsAndGroups = async () => {
        try {
            const [chatsRes, groupsRes] = await Promise.all([
                api.get('/api/chats'),
                api.get('/api/groups')
            ]);
            const fetchedChats: Chat[] = chatsRes.data.chats;
            const fetchedGroups: Group[] = groupsRes.data.groups;
            setChats(fetchedChats);
            setGroups(fetchedGroups);

            // Seed unread counts from API
            const counts: Record<string, number> = {};
            fetchedChats.forEach(c => { if (c.unread_count && c.unread_count > 0) counts[`chat_${c.id}`] = c.unread_count; });
            fetchedGroups.forEach(g => { if (g.unread_count && g.unread_count > 0) counts[`group_${g.id}`] = g.unread_count; });
            setUnreadCounts(counts);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactEmail.trim()) return;

        setIsSearchingContact(true);
        setContactError('');
        setInviteMode(false);

        try {
            const searchRes = await api.get(`/api/users/search?email=${contactEmail}`);
            const foundUser = searchRes.data.user;

            if (foundUser) {
                if (foundUser.id === user?.id) {
                    setContactError("You can't chat with yourself");
                    setIsSearchingContact(false);
                    return;
                }

                await api.post('/api/chats', { otherUserId: foundUser.id });
                await loadChatsAndGroups();
                setIsContactModalOpen(false);
                setContactEmail('');
                setContactName('');
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setContactError('User not found.');
                setInviteMode(true);
            } else {
                setContactError('An error occurred.');
            }
        } finally {
            setIsSearchingContact(false);
        }
    };

    const handleInvite = () => {
        const namePart = contactName ? `Hi ${contactName}! ` : 'Hey! ';
        const text = `${namePart}Join me on Academic Messenger. Check it out at: reachfirst.com`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        setIsContactModalOpen(false);
        setContactEmail('');
        setContactName('');
        setInviteMode(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            setIsSavingProfile(true);
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.url;
            setEditAvatar(url);
            await updateProfile({ avatar_url: url });
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload image');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/api/users/me');
            logout();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete account');
        }
    };

    const activeChat = chats.find(c => c.id === selectedChat);
    const activeGroup = groups.find(g => g.id === selectedGroup);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-bg">
            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Swappable Views */}
                <div className={`w-full md:w-80 md:min-w-[320px] bg-surface border-r border-border flex-col z-20 ${(selectedChat || selectedGroup) ? 'hidden md:flex' : 'flex'}`}>
                    {sidebarView === 'chats' ? (
                        <ChatList
                            chats={chats}
                            groups={groups}
                            selectedChatId={selectedChat}
                            selectedGroupId={selectedGroup}
                            unreadCounts={unreadCounts}
                            onSelectChat={(id) => {
                                setSelectedChat(id);
                                setSelectedGroup(null);
                                setShowContactInfo(false);
                                // Clear badge immediately
                                setUnreadCounts(prev => { const n = { ...prev }; delete n[`chat_${id}`]; return n; });
                                // Mark as read in backend (fire and forget)
                                api.put(`/api/chats/${id}/read`).catch(() => {});
                            }}
                            onSelectGroup={(id) => {
                                setSelectedGroup(id);
                                setSelectedChat(null);
                                setShowContactInfo(false);
                                // Clear badge immediately
                                setUnreadCounts(prev => { const n = { ...prev }; delete n[`group_${id}`]; return n; });
                                // Mark as read in backend (fire and forget)
                                api.put(`/api/groups/${id}/read`).catch(() => {});
                            }}
                            loading={loadingChats}
                            currentUser={user}
                            onProfileClick={() => setSidebarView('profile')}
                            onAddContact={() => {
                                setContactEmail('');
                                setContactName('');
                                setContactError('');
                                setInviteMode(false);
                                setIsContactModalOpen(true);
                            }}
                            onSettingsClick={() => setSidebarView('settings')}
                        />
                    ) : sidebarView === 'settings' ? (
                        <div className="flex-1 flex flex-col animate-slide-in-left bg-surface min-h-0">
                            <div className="h-[108px] bg-surface-elevated px-6 flex items-end pb-4 gap-4 text-text-primary shrink-0">
                                <button onClick={() => setSidebarView('chats')} className="mb-1 p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors font-medium">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                </button>
                                <span className="text-[19px] font-medium mb-1">Settings</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-8 bg-surface custom-scrollbar min-h-0">
                                <div className="space-y-6">
                                    {/* Theme Settings */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Theme</h3>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => {
                                                    document.documentElement.classList.remove('dark');
                                                    localStorage.setItem('theme', 'light');
                                                }}
                                                className="w-full text-left px-4 py-3 rounded-lg bg-surface-elevated hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-body font-medium"
                                            >
                                                Light Mode
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    document.documentElement.classList.add('dark');
                                                    localStorage.setItem('theme', 'dark');
                                                }}
                                                className="w-full text-left px-4 py-3 rounded-lg bg-surface-elevated hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-body font-medium"
                                            >
                                                Dark Mode
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Account Center */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Account Center</h3>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => alert('Password reset functionality to be implemented.')}
                                                className="w-full text-left px-4 py-3 rounded-lg bg-surface-elevated hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-body font-medium"
                                            >
                                                Change Password
                                            </button>
                                            <button 
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="w-full text-left px-4 py-3 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors font-medium"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Sign Out */}
                                    <div className="pt-4 border-t border-border">
                                        <button
                                            type="button"
                                            onClick={logout}
                                            className="w-full flex items-center justify-center gap-2 bg-surface-elevated text-text-primary hover:bg-black/5 dark:hover:bg-white/5 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Profile Sidebar (WhatsApp Style)
                        <div className="flex-1 flex flex-col animate-slide-in-left bg-surface min-h-0">
                            <div className="h-[108px] bg-surface-elevated px-6 flex items-end pb-4 gap-4 text-text-primary shrink-0">
                                <button onClick={() => setSidebarView('chats')} className="mb-1 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors font-medium">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                </button>
                                <span className="text-[19px] font-medium mb-1">Profile</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pb-12 space-y-8 bg-surface custom-scrollbar min-h-0">
                                <div className="space-y-6">
                                    <div className="flex justify-center my-4">
                                        <div className="relative group">
                                            {(editAvatar || user.avatar_url) ? (
                                                <img
                                                    src={editAvatar || user.avatar_url}
                                                    alt="Profile"
                                                    className="w-[200px] h-[200px] rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                                />
                                            ) : (
                                                <div
                                                    className="w-[200px] h-[200px] rounded-full bg-avatar flex items-center justify-center text-6xl text-white font-bold cursor-pointer hover:opacity-80"
                                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                                >
                                                    {user.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <svg className="w-8 h-8 text-white mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <span className="text-white text-xs uppercase font-medium">Change Profile Photo</span>
                                            </div>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                            {isSavingProfile && <div className="absolute inset-x-0 -bottom-6 text-center text-xs text-primary">Updating...</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-sm text-primary font-medium flex justify-between items-center">
                                                Your Name
                                            </label>
                                            {isEditingName ? (
                                                <div className="flex items-center justify-between gap-2 border-b-2 border-primary">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        ref={nameInputRef}
                                                        className="w-full bg-transparent py-2 text-text-body placeholder:text-text-secondary focus:outline-none transition-colors"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <svg onClick={() => { setIsEditingName(false); setEditName(user.name); }} className="w-5 h-5 text-error cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        <svg onClick={async () => { await updateProfile({ name: editName }); setIsEditingName(false); }} className="w-5 h-5 text-primary cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="w-full py-2 text-text-body">{user.name}</span>
                                                    <svg onClick={() => setIsEditingName(true)} className="w-5 h-5 text-text-secondary cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                                </div>
                                            )}
                                            <p className="text-xs text-text-secondary">This is not your username or pin. This name will be visible to your contacts.</p>
                                        </div>

                                        <div className="space-y-1 pt-4">
                                            <label className="text-sm text-primary font-medium flex justify-between items-center">
                                                About
                                            </label>
                                            {isEditingBio ? (
                                                <div className="flex items-start justify-between gap-2 border-b-2 border-primary">
                                                    <textarea
                                                        value={editBio}
                                                        onChange={(e) => setEditBio(e.target.value)}
                                                        ref={bioInputRef}
                                                        className="w-full bg-transparent py-2 text-text-body placeholder:text-text-secondary focus:outline-none transition-colors resize-none"
                                                        placeholder="Hey there! I am using Academic Messenger."
                                                        rows={2}
                                                    />
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <svg onClick={() => { setIsEditingBio(false); setEditBio(user.bio || ''); }} className="w-5 h-5 text-error cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        <svg onClick={async () => { await updateProfile({ bio: editBio }); setIsEditingBio(false); }} className="w-5 h-5 text-primary cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="w-full py-2 text-text-body whitespace-pre-wrap">{user.bio || 'Hey there! I am using Academic Messenger.'}</span>
                                                    <svg onClick={() => setIsEditingBio(true)} className="w-5 h-5 text-text-secondary cursor-pointer mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-8 space-y-3">
                                        <button
                                            type="button"
                                            onClick={logout}
                                            className="w-full flex items-center justify-center gap-2 text-error hover:bg-error/10 py-2.5 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Logout
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="w-full text-text-secondary hover:text-error py-2 text-xs transition-colors"
                                        >
                                            Delete account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Window & Contact Info */}
                <div className={`flex-1 bg-bg flex-row overflow-hidden relative ${(selectedChat || selectedGroup) ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex-1 flex flex-col h-full min-w-0 bg-[url('/chat-bg-dark.png')] bg-repeat bg-[length:400px] relative">
                        <div className="absolute inset-0 bg-bg/90 pointer-events-none"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            {selectedChat && activeChat ? (
                                <ChatWindow
                                    chatId={selectedChat}
                                    userId={user.id}
                                    headerName={activeChat.other_user_name}
                                    headerAvatar={activeChat.other_user_avatar}
                                    isOnline={!!activeChat.other_user_online}
                                    onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
                                    onBack={() => { setSelectedChat(null); setSelectedGroup(null); }}
                                />
                            ) : selectedGroup && activeGroup ? (
                                <ChatWindow
                                    groupId={selectedGroup}
                                    userId={user.id}
                                    headerName={activeGroup.name}
                                    headerAvatar={activeGroup.avatar_url}
                                    onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
                                    onBack={() => { setSelectedChat(null); setSelectedGroup(null); }}
                                    automationEnabled={!!activeGroup.automation_enabled}
                                    isTeacherGroup={!!activeGroup.is_teacher_group}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                                    <div className="w-20 h-20 mb-8 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary">
                                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-[32px] font-light text-text-primary mb-3">Academic Messenger</h2>
                                    <p className="text-sm text-text-secondary max-w-md text-center leading-6">
                                        Select a conversation from the sidebar to start messaging.<br />
                                        Connect with classmates and teachers in one calm place.
                                    </p>
                                    <div className="mt-12 flex items-center gap-1.5 text-xs text-text-muted tracking-wider font-medium">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
                                        End-to-end encrypted
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Info Sidebar */}
                    {showContactInfo && selectedChat && activeChat && (
                        <ContactInfo
                            userId={activeChat.other_user_id}
                            chatId={selectedChat}
                            onClose={() => setShowContactInfo(false)}
                        />
                    )}
                    {showContactInfo && selectedGroup && activeGroup && (
                        <ContactInfo
                            groupId={selectedGroup}
                            onClose={() => setShowContactInfo(false)}
                        />
                    )}
                </div>
            </div>

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onConversationCreated={() => {
                    setIsContactModalOpen(false);
                    loadChatsAndGroups();
                }}
                currentUserId={user.id}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Account"
                message="Are you sure you want to delete your account permanently? All your chats and groups will be lost. This cannot be undone."
                confirmText="Delete"
                onConfirm={handleDeleteAccount}
                onCancel={() => setIsDeleteModalOpen(false)}
                isDestructive={true}
            />
        </div>
    );
}
