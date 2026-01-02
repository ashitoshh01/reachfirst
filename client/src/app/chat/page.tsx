'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import ContactInfo from '@/components/chat/ContactInfo';

interface Chat {
    id: number;
    other_user_id: number;
    other_user_name: string;
    other_user_avatar?: string;
    other_user_online: boolean;
    last_message?: string;
    last_message_time?: string;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
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

    // Sidebar View State
    const [sidebarView, setSidebarView] = useState<'chats' | 'profile'>('chats');

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
                if (sidebarView === 'profile') setSidebarView('chats');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isContactModalOpen, showContactInfo, sidebarView]);

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
            setChats(chatsRes.data.chats);
            setGroups(groupsRes.data.groups);
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
            setEditAvatar(res.data.url);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload image');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await api.put('/api/users/me', {
                name: editName,
                bio: editBio,
                avatar_url: editAvatar
            });
            window.location.reload();
        } catch (error) {
            console.error('Profile update failed:', error);
            alert('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account permanently? This cannot be undone.')) {
            try {
                await api.delete('/api/users/me');
                logout();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Failed to delete account');
            }
        }
    };

    const activeChat = chats.find(c => c.id === selectedChat);
    const activeGroup = groups.find(g => g.id === selectedGroup);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0b141a]">
            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Swappable Views */}
                <div className="w-80 min-w-[320px] bg-[#111b21] border-r border-[#2a3942] flex flex-col z-20">
                    {sidebarView === 'chats' ? (
                        <ChatList
                            chats={chats}
                            groups={groups}
                            selectedChatId={selectedChat}
                            selectedGroupId={selectedGroup}
                            onSelectChat={(id) => { setSelectedChat(id); setSelectedGroup(null); }}
                            onSelectGroup={(id) => { setSelectedGroup(id); setSelectedChat(null); }}
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
                        />
                    ) : (
                        // Profile Sidebar (WhatsApp Style)
                        <div className="flex-1 flex flex-col animate-slide-in-left bg-[#111b21]">
                            <div className="h-[108px] bg-[#202c33] px-6 flex items-end pb-4 gap-4 text-[#e9edef] shrink-0">
                                <button onClick={() => setSidebarView('chats')} className="mb-1 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors font-medium">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                    </svg>
                                </button>
                                <span className="text-[19px] font-medium mb-1">Profile</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#111b21] custom-scrollbar">
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
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
                                                    className="w-[200px] h-[200px] rounded-full bg-[#6a7175] flex items-center justify-center text-6xl text-white font-bold cursor-pointer hover:opacity-80"
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
                                            {isSavingProfile && <div className="absolute inset-x-0 -bottom-6 text-center text-xs text-[#00a884]">Updating...</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-sm text-[#00a884] font-medium">Your Name</label>
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full bg-transparent py-2 text-[#d1d7db] placeholder-[#8696a0] focus:outline-none border-b-2 border-transparent focus:border-[#00a884] transition-colors"
                                                />
                                                <svg className="w-5 h-5 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                            </div>
                                            <p className="text-xs text-[#8696a0]">This is not your username or pin. This name will be visible to your contacts.</p>
                                        </div>

                                        <div className="space-y-1 pt-4">
                                            <label className="text-sm text-[#00a884] font-medium">About</label>
                                            <div className="flex items-start justify-between gap-2">
                                                <textarea
                                                    value={editBio}
                                                    onChange={(e) => setEditBio(e.target.value)}
                                                    className="w-full bg-transparent py-2 text-[#d1d7db] placeholder-[#8696a0] focus:outline-none border-b-2 border-transparent focus:border-[#00a884] transition-colors resize-none"
                                                    placeholder="Hey there! I am using Academic Messenger."
                                                    rows={1}
                                                />
                                                <svg className="w-5 h-5 text-[#8696a0] mt-2" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 space-y-3">
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-bold py-2.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Save Changes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={logout}
                                            className="w-full flex items-center justify-center gap-2 text-[#ef5350] hover:bg-[#ef5350]/10 py-2.5 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Logout
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            className="w-full text-[#8696a0] hover:text-[#ef5350] py-2 text-xs transition-colors"
                                        >
                                            Delete account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Window & Contact Info */}
                <div className="flex-1 bg-[#0b141a] flex flex-row overflow-hidden relative">
                    <div className="flex-1 flex flex-col h-full min-w-0 bg-[url('/chat-bg-dark.png')] bg-repeat bg-[length:400px]">
                        {/* Main Chat Area Overlay to ensure dark theme integrity */}
                        <div className="absolute inset-0 bg-[#0b141a]/95 pointer-events-none"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            {selectedChat && activeChat ? (
                                <ChatWindow
                                    chatId={selectedChat}
                                    userId={user.id}
                                    headerName={activeChat.other_user_name}
                                    headerAvatar={activeChat.other_user_avatar}
                                    isOnline={!!activeChat.other_user_online}
                                    onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
                                />
                            ) : selectedGroup && activeGroup ? (
                                <ChatWindow
                                    groupId={selectedGroup}
                                    userId={user.id}
                                    headerName={activeGroup.name}
                                    headerAvatar={activeGroup.avatar_url}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#8696a0] border-b-[6px] border-[#00a884]">
                                    <div className="w-[30%] max-w-[400px] mb-10 opacity-80">
                                        {/* Illustration or Large Icon */}
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#374045]">
                                            <path d="M2.007 6.463v12.75a2.25 2.25 0 0 0 2.25 2.25h15.75a2.25 2.25 0 0 0 2.25-2.25V6.463L12.551 16.3a.75.75 0 0 1-1.102 0L2.007 6.463ZM12 14.864l8.947-8.913a.75.75 0 0 0-.53-.22H3.582a.75.75 0 0 0-.53.22L12 14.864Z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-[32px] font-light text-[#e9edef] mb-3">Academic Messenger</h2>
                                    <p className="text-sm text-[#8696a0] max-w-md text-center leading-6">
                                        Send and receive messages without keeping your phone online.<br />
                                        Use Academic Messenger on up to 4 linked devices and 1 phone.
                                    </p>
                                    <div className="mt-12 flex items-center gap-1.5 text-xs text-[#667781] tracking-wider font-medium">
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
                </div>
            </div>

            {/* Add Contact Modal */}
            {isContactModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#202c33] shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="bg-[#202c33] p-4 border-b border-[#2a3942] flex items-center gap-4">
                            <button onClick={() => setIsContactModalOpen(false)} className="text-[#aebac1] hover:text-[#d1d7db]">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                            </button>
                            <h3 className="text-[#e9edef] font-medium text-lg">New Chat</h3>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleAddContact}>
                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none transition-colors"
                                        placeholder="Type contact email"
                                        required
                                        autoFocus
                                    />
                                    {contactError && (
                                        <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded">
                                            {contactError}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    {inviteMode ? (
                                        <button
                                            type="button"
                                            onClick={handleInvite}
                                            className="bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] px-6 py-2 rounded font-bold transition-colors"
                                        >
                                            Invite to App
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isSearchingContact}
                                            className="bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] px-6 py-2 rounded font-bold transition-colors disabled:opacity-60"
                                        >
                                            {isSearchingContact ? 'Searching...' : 'Start Chat'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
