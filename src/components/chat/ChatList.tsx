'use client';

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
    unreadCounts?: Record<string, number>;
    onSelectChat: (id: number) => void;
    onSelectGroup: (id: number) => void;
    loading: boolean;
    onAddContact: () => void;
    currentUser: any;
    onProfileClick: () => void;
    onSettingsClick: () => void;
}

export default function ChatList({
    chats,
    groups,
    selectedChatId,
    selectedGroupId,
    unreadCounts = {},
    onSelectChat,
    onSelectGroup,
    loading,
    onAddContact,
    currentUser,
    onProfileClick,
    onSettingsClick
}: ChatListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredChats = chats.filter(chat =>
        chat.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-surface">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-surface border-r border-border">
            {/* Header */}
            <div className="h-16 px-4 bg-surface-elevated flex items-center justify-between shadow-sm shrink-0">
                <button onClick={onProfileClick} className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full">
                    {currentUser?.avatar_url ? (
                        <img
                            src={currentUser.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-avatar flex items-center justify-center text-white font-medium">
                            {currentUser?.name?.charAt(0)}
                        </div>
                    )}
                </button>

                <div className="flex items-center gap-5 text-text-secondary">
                    <button
                        onClick={onSettingsClick}
                        className="hover:text-text-primary transition-colors p-1 rounded-full hover:bg-white/5"
                        title="Settings"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path>
                        </svg>
                    </button>
                    <button
                        onClick={onAddContact}
                        className="hover:text-text-primary transition-colors p-1 rounded-full hover:bg-white/5"
                        title="New Chat"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H14.02v-2.02h2.02v-1.002h-2.02V8.003h-10.99v1.002h2.029v2.02h1.002z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-2 bg-surface border-b border-border">
                <div className="relative flex items-center bg-surface-elevated rounded-lg h-9 px-3">
                    <span className="text-text-secondary mr-3">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 0 0-5.207-5.208 5.208 5.208 0 0 0-5.208 5.208 5.208 5.208 0 0 0 5.208 5.208 5.183 5.183 0 0 0 3.385-1.254l.22.219v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-text-body placeholder:text-text-secondary focus:ring-0 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-text-secondary hover:text-text-primary ml-2"
                            aria-label="Clear search"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Groups */}
                {filteredGroups.length > 0 && (
                    <div className="pb-2">
                        <div className="px-4 py-2 text-primary text-xs font-semibold uppercase tracking-wider">
                            Groups
                        </div>
                        {filteredGroups.map((group) => (
                            <div
                                key={`group-${group.id}`}
                                onClick={() => onSelectGroup(group.id)}
                                className={`chat-item ${selectedGroupId === group.id ? 'chat-item-selected' : ''}`}
                            >
                                <div className="flex-shrink-0">
                                    {group.avatar_url ? (
                                        <img src={group.avatar_url} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-avatar flex items-center justify-center text-white">
                                            {group.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 border-b border-border pb-3 -mr-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-text-primary font-normal truncate max-w-[70%]">{group.name}</h3>
                                        {group.last_message_time && (
                                            <span className={`text-xs mr-4 ${unreadCounts['group_' + group.id] ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                                                {formatTime(group.last_message_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mr-4">
                                        <p className={`text-sm truncate flex-1 mr-2 ${unreadCounts['group_' + group.id] ? 'text-text-body' : 'text-text-secondary'}`}>
                                            {group.last_message || 'Multi-device group'}
                                        </p>
                                        {unreadCounts['group_' + group.id] > 0 && (
                                            <span className="bg-primary text-on-primary text-[11px] font-bold px-[6px] py-[2px] rounded-full min-w-[20px] text-center">
                                                {unreadCounts['group_' + group.id]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Direct Chats */}
                {filteredChats.length > 0 && (
                    <div className="pb-2">
                        {filteredGroups.length > 0 && (
                            <div className="px-4 py-2 text-primary text-xs font-semibold uppercase tracking-wider">
                                Direct Messages
                            </div>
                        )}
                        {filteredChats.map((chat) => (
                            <div
                                key={`chat-${chat.id}`}
                                onClick={() => onSelectChat(chat.id)}
                                className={`chat-item ${selectedChatId === chat.id ? 'chat-item-selected' : ''}`}
                            >
                                <div className="flex-shrink-0 relative">
                                    {chat.other_user_avatar ? (
                                        <img src={chat.other_user_avatar} alt={chat.other_user_name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-avatar flex items-center justify-center text-white">
                                            {chat.other_user_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {chat.other_user_online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 border-b border-border pb-3 -mr-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-text-primary font-normal truncate max-w-[70%]">{chat.other_user_name}</h3>
                                        {chat.last_message_time && (
                                            <span className={`text-xs mr-4 ${unreadCounts['chat_' + chat.id] ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                                                {formatTime(chat.last_message_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mr-4">
                                        <p className={`text-sm truncate flex-1 mr-2 ${unreadCounts['chat_' + chat.id] ? 'text-text-body' : 'text-text-secondary'}`}>
                                            {chat.last_message || 'Start chatting'}
                                        </p>
                                        {unreadCounts['chat_' + chat.id] > 0 && (
                                            <span className="bg-primary text-on-primary text-[11px] font-bold px-[6px] py-[2px] rounded-full min-w-[20px] text-center flex items-center justify-center">
                                                {unreadCounts['chat_' + chat.id]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredChats.length === 0 && filteredGroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-text-secondary text-sm px-6 text-center gap-3">
                        <svg className="w-10 h-10 text-text-muted opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>{searchQuery ? 'No chats match your search' : 'No conversations yet'}</p>
                        {!searchQuery && (
                            <button onClick={onAddContact} className="text-primary text-sm hover:underline">
                                Start a conversation
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
