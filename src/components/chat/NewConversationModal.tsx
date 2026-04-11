'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
  currentUserId?: number;
}

type TabType = 'personal' | 'group' | 'teacher-group';

export default function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
  currentUserId,
}: NewConversationModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  
  // Personal Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Group States
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  
  // Teacher Group States
  const [teacherGroupName, setTeacherGroupName] = useState('');
  const [teacherGroupDescription, setTeacherGroupDescription] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherResults, setTeacherResults] = useState<User[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<User[]>([]);
  const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);
  const [isCreatingTeacherGroup, setIsCreatingTeacherGroup] = useState(false);
  const [teacherError, setTeacherError] = useState('');

  // Debounce helpers
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [teacherDebounceTimer, setTeacherDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const resetModal = () => {
    setActiveTab('personal');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setGroupName('');
    setGroupDescription('');
    setGroupError('');
    setTeacherGroupName('');
    setTeacherGroupDescription('');
    setTeacherSearch('');
    setTeacherResults([]);
    setSelectedTeachers([]);
    setTeacherError('');
    onClose();
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    
    try {
      const res = await api.get(`/api/users/search?email=${encodeURIComponent(query)}`);
      // It returns { user } or { error }
      if (res.data.user) {
        if (res.data.user.id !== currentUserId) {
            setSearchResults([res.data.user]);
        } else {
            setSearchError("You can't chat with yourself");
        }
      }
    } catch {
        setSearchError('User not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const timer = setTimeout(() => searchUsers(value), 500);
    setSearchDebounceTimer(timer);
  };

  const handleStartChat = async (userId: number) => {
    try {
      await api.post('/api/chats', { otherUserId: userId });
      resetModal();
      onConversationCreated();
    } catch {
      setSearchError('Failed to create chat. Please try again.');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setGroupError('Group name is required');
      return;
    }
    setIsCreatingGroup(true);
    try {
      await api.post('/api/groups', {
        name: groupName.trim(),
        description: groupDescription.trim(),
        is_teacher_group: false,
      });
      resetModal();
      onConversationCreated();
    } catch (error: any) {
      setGroupError(error.response?.data?.error || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Teachers
  const searchForTeachers = async (query: string) => {
    if (!query.trim()) {
      setTeacherResults([]);
      return;
    }
    setIsSearchingTeachers(true);
    setTeacherError('');
    try {
      const res = await api.get(`/api/users/search?email=${encodeURIComponent(query)}`);
      if (res.data.user && res.data.user.role === 'teacher') {
        const u = res.data.user;
        if (!selectedTeachers.find(t => t.id === u.id) && u.id !== currentUserId) {
            setTeacherResults([u]);
        }
      } else if (res.data.user) {
        setTeacherError('User found is not a teacher');
      }
    } catch {
      setTeacherResults([]);
    } finally {
      setIsSearchingTeachers(false);
    }
  };

  const handleTeacherSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeacherSearch(value);
    if (teacherDebounceTimer) clearTimeout(teacherDebounceTimer);
    const timer = setTimeout(() => searchForTeachers(value), 500);
    setTeacherDebounceTimer(timer);
  };

  const handleCreateTeacherGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherGroupName.trim()) {
      setTeacherError('Teacher group name is required');
      return;
    }
    setIsCreatingTeacherGroup(true);
    try {
      await api.post('/api/groups/teachers', {
        name: teacherGroupName.trim(),
        description: teacherGroupDescription.trim(),
        teacherIds: selectedTeachers.map(t => t.id)
      });
      resetModal();
      onConversationCreated();
    } catch (error: any) {
      setTeacherError(error.response?.data?.error || 'Failed to create teacher group');
    } finally {
      setIsCreatingTeacherGroup(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-[#e9edef]">
      <div className="bg-[#202c33] shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2a3942] flex items-center justify-between bg-[#202c33]">
          <h3 className="font-medium text-lg">New Conversation</h3>
          <button onClick={resetModal} className="text-[#aebac1] hover:text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a3942]">
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'personal' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#8696a0] hover:bg-white/5'}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Chat
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'group' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#8696a0] hover:bg-white/5'}`}
            onClick={() => setActiveTab('group')}
          >
            Group
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'teacher-group' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#8696a0] hover:bg-white/5'}`}
            onClick={() => setActiveTab('teacher-group')}
          >
            Teacher Group
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* PERSONAL CHAT TAB */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <input
                type="email"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
                placeholder="Search contact by email..."
              />
              
              {isSearching && <div className="text-[#8696a0] text-sm">Searching...</div>}
              {searchError && <div className="text-red-400 text-sm">{searchError}</div>}
              
              <div className="space-y-2 mt-4">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-[#111b21] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white font-bold">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#e9edef]">{user.name}</p>
                        <p className="text-xs text-[#8696a0]">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartChat(user.id)}
                      className="text-sm bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] px-3 py-1.5 rounded font-medium transition-colors"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP TAB */}
          {activeTab === 'group' && (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {groupError && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded">{groupError}</div>}
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
                placeholder="Group Name"
                required
              />
              <textarea
                value={groupDescription}
                onChange={e => setGroupDescription(e.target.value)}
                className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none resize-none"
                placeholder="Description (Optional)"
                rows={3}
              />
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] px-6 py-2.5 rounded font-bold transition-colors disabled:opacity-60"
                >
                  {isCreatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          )}

          {/* TEACHER GROUP TAB */}
          {activeTab === 'teacher-group' && (
            <form onSubmit={handleCreateTeacherGroup} className="space-y-4 flex flex-col h-full">
              {teacherError && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded">{teacherError}</div>}
              <input
                type="text"
                value={teacherGroupName}
                onChange={e => setTeacherGroupName(e.target.value)}
                className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
                placeholder="Teacher Group Name"
                required
              />
              <textarea
                value={teacherGroupDescription}
                onChange={e => setTeacherGroupDescription(e.target.value)}
                className="w-full bg-[#111b21] border-none rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none resize-none"
                placeholder="Description (Optional)"
                rows={2}
              />
              
              <div className="pt-2 border-t border-[#2a3942]">
                <p className="text-sm font-medium text-[#00a884] mb-2">Add Teachers</p>
                <input
                  type="email"
                  value={teacherSearch}
                  onChange={handleTeacherSearchChange}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
                  placeholder="Search teacher by email..."
                />
                
                {/* Search Results */}
                {teacherResults.length > 0 && (
                  <div className="mt-2 bg-[#111b21] rounded-lg p-2 max-h-32 overflow-y-auto">
                    {teacherResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded cursor-pointer" onClick={() => { setSelectedTeachers([...selectedTeachers, user]); setTeacherSearch(''); setTeacherResults([]); }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center text-white text-xs">{user.name.charAt(0)}</div>
                          <span className="text-sm">{user.name}</span>
                        </div>
                        <span className="text-xs text-[#00a884] font-medium">+ Add</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Teachers */}
                {selectedTeachers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedTeachers.map(user => (
                      <div key={user.id} className="flex items-center gap-1.5 bg-[#2a3942] px-2 py-1 rounded-md">
                        <div className="w-4 h-4 bg-[#00a884] rounded-full flex items-center justify-center text-[10px] text-white">{user.name.charAt(0)}</div>
                        <span className="text-xs text-[#e9edef]">{user.name.split(' ')[0]}</span>
                        <button type="button" onClick={() => setSelectedTeachers(selectedTeachers.filter(t => t.id !== user.id))} className="text-[#8696a0] hover:text-[#ef5350] ml-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingTeacherGroup}
                  className="bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] px-6 py-2.5 rounded font-bold transition-colors disabled:opacity-60"
                >
                  {isCreatingTeacherGroup ? 'Creating...' : 'Create Teacher Group'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}