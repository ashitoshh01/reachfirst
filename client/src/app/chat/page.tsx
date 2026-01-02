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

    // Add Contact Modal States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactError, setContactError] = useState('');
    const [isSearchingContact, setIsSearchingContact] = useState(false);
    const [inviteMode, setInviteMode] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);

    // Profile Modal States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
            setEditBio(user.bio || ''); // user.bio from updated context/backend
            setEditAvatar(user.avatar_url || '');

            if (user.role === 'teacher') {
                ensureAdminChat();
            }
        }
    }, [user]);

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
            // Force reload page to refresh context? Or implement updateProfile in context.
            // For now, simple reload works or assuming context auto-fetches on next mount logic?
            // Ideally call updateProfile(newData) from context if available.
            // We'll just reload the window to be safe and simple.
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
        <div className="h-screen flex flex-col bg-[#111]">
            {/* Navbar - Solid Color */}
            <nav className="bg-[#1a1a1a] border-b border-[#333] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">Academic Messenger</h1>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm ${connected ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                        {connected ? 'Online' : 'Offline'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="flex items-center gap-2 hover:bg-[#333] px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avg" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white">
                                {user.name?.charAt(0)}
                            </div>
                        )}
                        <span className="text-gray-300 text-sm font-medium">{user.name}</span>
                    </button>
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Solid Color */}
                <div className="w-80 bg-[#1a1a1a] border-r border-[#333] flex flex-col">
                    <ChatList
                        chats={chats}
                        groups={groups}
                        selectedChatId={selectedChat}
                        selectedGroupId={selectedGroup}
                        onSelectChat={(id) => { setSelectedChat(id); setSelectedGroup(null); }}
                        onSelectGroup={(id) => { setSelectedGroup(id); setSelectedChat(null); }}
                        loading={loadingChats}
                        onAddContact={() => {
                            setContactEmail('');
                            setContactName('');
                            setContactError('');
                            setInviteMode(false);
                            setIsContactModalOpen(true);
                        }}
                    />
                </div>

                {/* Chat Window & Contact Info */}
                <div className="flex-1 bg-[#111] flex flex-row overflow-hidden relative">
                    <div className="flex-1 flex flex-col h-full min-w-0">
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
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg">Select a chat to start messaging</p>
                                </div>
                            </div>
                        )}
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Add Contact</h3>
                            <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleAddContact}>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                                    placeholder="Name (Optional)"
                                />
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                                    placeholder="Email Address"
                                    required
                                    autoFocus
                                />
                            </div>

                            {contactError && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                                    {contactError}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                {inviteMode ? (
                                    <button
                                        type="button"
                                        onClick={handleInvite}
                                        className="btn bg-[#25D366] hover:bg-[#128C7E] text-white flex-1 py-2 rounded-lg font-medium"
                                    >
                                        Invite via WhatsApp
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSearchingContact}
                                        className="bg-primary-600 hover:bg-primary-700 text-white flex-1 py-2 rounded-lg font-medium disabled:opacity-50"
                                    >
                                        {isSearchingContact ? 'Searching...' : 'Add Contact'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Profile Picture</label>
                                <div className="flex items-center gap-4 mb-2">
                                    {(editAvatar || user.avatar_url) && (
                                        <img
                                            src={editAvatar || user.avatar_url}
                                            alt="Preview"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-primary-500"
                                        />
                                    )}
                                    <label className="cursor-pointer bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Choose New Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    {isSavingProfile && <span className="text-xs text-gray-500">Uploading...</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Bio</label>
                                <textarea
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none min-h-[100px]"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    className="px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Delete Account
                                </button>
                                <div className="flex-1"></div>
                                <button
                                    type="button"
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                                >
                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
