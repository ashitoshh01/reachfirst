'use client';

// Imports at the top if needed, ensuring strict mode
import { useState } from 'react';

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

interface ChatListProps {
    chats: Chat[];
    groups: Group[];
    selectedChatId: number | null;
    selectedGroupId: number | null;
    onSelectChat: (id: number) => void;
    onSelectGroup: (id: number) => void;
    loading: boolean;
    onAddContact: () => void;
    currentUser: any;
    onProfileClick: () => void;
}

export default function ChatList({
    chats,
    groups,
    selectedChatId,
    selectedGroupId,
    onSelectChat,
    onSelectGroup,
    loading,
    onAddContact,
    currentUser,
    onProfileClick
}: ChatListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(chat =>
        chat.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#111b21]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00a884]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#111b21] border-r border-[#2a3942]">
            {/* Header */}
            <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between shadow-sm shrink-0">
                <button onClick={onProfileClick} className="focus:outline-none">
                    {currentUser?.avatar_url ? (
                        <img
                            src={currentUser.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white font-medium">
                            {currentUser?.name?.charAt(0)}
                        </div>
                    )}
                </button>

                <div className="flex items-center gap-5 text-[#aebac1]">
                    <button
                        onClick={onAddContact}
                        className="hover:text-white transition-colors"
                        title="New Chat"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H14.02v-2.02h2.02v-1.002h-2.02V8.003h-1.002v2.019H10.99v1.002h2.029v2.02h1.002z"></path>
                        </svg>
                    </button>
                    <button className="hover:text-white transition-colors" title="Menu">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-2 bg-[#111b21] border-b border-[#2a3942]">
                <div className="relative flex items-center bg-[#202c33] rounded-lg h-9 px-3">
                    <button className="text-[#aebac1] mr-4">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="w-5 h-5">
                            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 0 0-5.207-5.208 5.208 5.208 0 0 0-5.208 5.208 5.208 5.208 0 0 0 5.208 5.208 5.183 5.183 0 0 0 3.385-1.254l.22.219v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-[#d1d7db] placeholder-[#8696a0] focus:ring-0 focus:outline-none"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Groups */}
                {filteredGroups.length > 0 && (
                    <div className="pb-2">
                        <div className="px-4 py-2 text-[#00a884] text-xs font-semibold uppercase tracking-wider">
                            Groups
                        </div>
                        {filteredGroups.map((group) => (
                            <div
                                key={`group-${group.id}`}
                                onClick={() => onSelectGroup(group.id)}
                                className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${selectedGroupId === group.id ? 'bg-[#202c33]' : ''}`}
                            >
                                <div className="flex-shrink-0">
                                    {group.avatar_url ? (
                                        <img src={group.avatar_url} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
                                            {group.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 border-b border-[#2a3942] pb-3 -mr-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-[#e9edef] font-normal truncate max-w-[70%]">{group.name}</h3>
                                        {group.last_message_time && (
                                            <span className="text-xs text-[#8696a0] mr-4">{/* Time formatting needed */}12:00</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#8696a0] truncate mr-4">
                                        {group.last_message || 'Multi-device group'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Direct Chats */}
                {filteredChats.length > 0 && (
                    <div className="pb-2">
                        {filteredGroups.length > 0 && (
                            <div className="px-4 py-2 text-[#00a884] text-xs font-semibold uppercase tracking-wider">
                                Direct Messages
                            </div>
                        )}
                        {filteredChats.map((chat) => (
                            <div
                                key={`chat-${chat.id}`}
                                onClick={() => onSelectChat(chat.id)}
                                className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#202c33] transition-colors ${selectedChatId === chat.id ? 'bg-[#202c33]' : ''}`}
                            >
                                <div className="flex-shrink-0 relative">
                                    {chat.other_user_avatar ? (
                                        <img src={chat.other_user_avatar} alt={chat.other_user_name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
                                            {chat.other_user_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 border-b border-[#2a3942] pb-3 -mr-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-[#e9edef] font-normal truncate max-w-[70%]">{chat.other_user_name}</h3>
                                    </div>
                                    <p className="text-sm text-[#8696a0] truncate mr-4">
                                        {chat.last_message || 'Start chatting'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredChats.length === 0 && filteredGroups.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-[#8696a0] text-sm">
                        No chats found
                    </div>
                )}
            </div>
        </div>
    );
}
