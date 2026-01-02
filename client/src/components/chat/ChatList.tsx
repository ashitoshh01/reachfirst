'use client';

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
}

import { useState } from 'react';

export default function ChatList({
    chats,
    groups,
    selectedChatId,
    selectedGroupId,
    onSelectChat,
    onSelectGroup,
    loading,
    onAddContact
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
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Messages</h2>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-dark-hover border-none rounded-lg py-2 pl-9 pr-4 text-sm text-text-dark placeholder-text-dark-secondary focus:ring-1 focus:ring-primary-500"
                    />
                    <svg className="w-4 h-4 text-text-dark-secondary absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Groups */}
                {filteredGroups.length > 0 && (
                    <div className="p-2">
                        <p className="text-xs text-text-dark-secondary uppercase tracking-wide px-2 mb-2">
                            Groups
                        </p>
                        {filteredGroups.map((group) => (
                            <button
                                key={`group-${group.id}`}
                                onClick={() => onSelectGroup(group.id)}
                                className={`w-full p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${selectedGroupId === group.id
                                    ? 'bg-primary-500 text-white'
                                    : 'hover:bg-surface-dark-hover text-text-dark'
                                    }`}
                            >
                                {group.avatar_url ? (
                                    <img src={group.avatar_url} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-lg font-bold">
                                            {group.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium truncate">{group.name}</p>
                                    {group.last_message && (
                                        <p className={`text-sm truncate ${selectedGroupId === group.id ? 'text-white/80' : 'text-text-dark-secondary'}`}>
                                            {group.last_message}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Direct Chats */}
                {filteredChats.length > 0 && (
                    <div className="p-2">
                        <p className="text-xs text-text-dark-secondary uppercase tracking-wide px-2 mb-2">
                            Direct Messages
                        </p>
                        {filteredChats.map((chat) => (
                            <button
                                key={`chat-${chat.id}`}
                                onClick={() => onSelectChat(chat.id)}
                                className={`w-full p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${selectedChatId === chat.id
                                    ? 'bg-primary-500 text-white'
                                    : 'hover:bg-surface-dark-hover text-text-dark'
                                    }`}
                            >
                                <div className="relative">
                                    {chat.other_user_avatar ? (
                                        <img src={chat.other_user_avatar} alt={chat.other_user_name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg font-bold">
                                                {chat.other_user_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {!!chat.other_user_online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface-dark"></div>
                                    )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-medium truncate">{chat.other_user_name}</p>
                                    {chat.last_message && (
                                        <p className={`text-sm truncate ${selectedChatId === chat.id ? 'text-white/80' : 'text-text-dark-secondary'}`}>
                                            {chat.last_message}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {filteredChats.length === 0 && filteredGroups.length === 0 && (
                    <div className="flex items-center justify-center h-full text-text-dark-secondary">
                        <p>{searchQuery ? 'No results found' : 'No chats yet'}</p>
                    </div>
                )}
            </div>

            {/* Add Contact FAB */}
            <button
                onClick={onAddContact}
                className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                title="Add Contact"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}
