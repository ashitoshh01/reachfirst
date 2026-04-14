import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmationModal from "@/components/ConfirmationModal";

interface ContactInfoProps {
  userId?: number;
  groupId?: number;
  chatId?: number;
  onClose: () => void;
}

interface UserDetails {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: string;
}

interface GroupDetails {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  total_members?: number;
  is_teacher_group?: boolean | number;
  automation_enabled?: boolean | number;
  is_class_group?: boolean | number;
  class_teacher_id?: number | null;
}

interface GroupMember {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  is_admin?: number | boolean;
  role?: string;
  is_cr?: number | boolean;
}

interface Keyword {
  id: number;
  keyword: string;
  is_active: boolean | number;
  created_at: string;
}

export default function ContactInfo({
  userId,
  groupId,
  chatId,
  onClose,
}: ContactInfoProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [suggestions, setSuggestions] = useState<UserDetails[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Remove Member State
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);

  // Automation State
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);

  // Class Group State
  const [settingClassGroup, setSettingClassGroup] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    } else if (userId) {
      fetchUserDetails();
    }
    if (chatId) {
      fetchChatMedia();
    }
  }, [userId, groupId, chatId]);

  // Fetch keywords when automation section is shown
  useEffect(() => {
    if (group?.is_teacher_group && isCurrentUserAdmin) {
      fetchKeywords();
    }
  }, [group]);

  useEffect(() => {
    if (!addMemberInput.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/api/users/search?query=${addMemberInput.trim()}`);
        const fetchedUsers = res.data.users || [];
        let newSuggestions = fetchedUsers.filter(
          (u: UserDetails) => !members.some(m => m.id === u.id)
        );

        if (group?.is_teacher_group) {
          newSuggestions = newSuggestions.filter((u: UserDetails) => u.role === 'teacher');
        }

        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [addMemberInput, members, group]);

  const fetchChatMedia = async () => {
    try {
      const res = await api.get(`/api/chats/${chatId}/media`);
      setMedia(res.data.media);
    } catch (error) {
      console.error("Failed to load media", error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users/${userId}`);
      setUser(res.data.user);
    } catch (error) {
      console.error("Failed to load user details", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/groups/${groupId}`);
      setGroup(res.data.group);
      setMembers(res.data.members || []);
      setAutomationEnabled(!!res.data.group.automation_enabled);
    } catch (error) {
      console.error("Failed to load group details", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await api.get('/api/automation/keywords');
      setKeywords(res.data.keywords || []);
    } catch (error) {
      console.error("Failed to load keywords", error);
    }
  };

  const handleSelectSuggestion = async (selectedUser: UserDetails) => {
    setAddMemberInput(selectedUser.email);
    setShowSuggestions(false);

    setAddingMember(true);
    setAddMemberError("");
    try {
      if (group?.is_teacher_group && selectedUser.role !== 'teacher') {
        setAddMemberError("Only teachers can be added to a teacher group");
        setAddingMember(false);
        return;
      }

      if (members.some(m => m.id === selectedUser.id)) {
        setAddMemberError("User is already a member");
        setAddingMember(false);
        return;
      }

      await api.post(`/api/groups/${groupId}/members`, { userId: selectedUser.id });

      fetchGroupDetails();
      setShowAddMember(false);
      setAddMemberInput("");
    } catch (error: any) {
      console.error("Failed to add member", error);
      setAddMemberError(error.response?.data?.error || "Error adding member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberInput.trim()) return;
    setAddingMember(true);
    setAddMemberError("");
    try {
      const searchRes = await api.get(`/api/users/find?email=${addMemberInput.trim()}`);
      const foundUser = searchRes.data.user;

      if (group?.is_teacher_group && foundUser.role !== 'teacher') {
        setAddMemberError("Only teachers can be added to a teacher group");
        setAddingMember(false);
        return;
      }

      if (members.some(m => m.id === foundUser.id)) {
        setAddMemberError("User is already a member");
        setAddingMember(false);
        return;
      }

      await api.post(`/api/groups/${groupId}/members`, { userId: foundUser.id });
      fetchGroupDetails();
      setShowAddMember(false);
      setAddMemberInput("");
    } catch (error: any) {
      console.error("Failed to add member", error);
      if (error.response?.status === 404) {
        setAddMemberError("User not found");
      } else {
        setAddMemberError(error.response?.data?.error || "Error adding member");
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleMakeAdmin = async (targetUserId: number) => {
    try {
      await api.put(`/api/groups/${groupId}/members/${targetUserId}/admin`);
      fetchGroupDetails();
    } catch (error) {
      console.error("Failed to make user admin", error);
      alert("Error making user admin.");
    }
  };

  const handleMakeCR = async (targetUserId: number) => {
    try {
      await api.put(`/api/groups/${groupId}/members/${targetUserId}/cr`);
      fetchGroupDetails();
    } catch (error) {
      console.error("Failed to make user CR", error);
      alert("Error making user CR.");
    }
  };

  const handleRemoveAdmin = async (targetUserId: number) => {
    try {
      await api.delete(`/api/groups/${groupId}/members/${targetUserId}/admin`);
      fetchGroupDetails();
    } catch (error) {
      console.error("Failed to remove admin rights", error);
      alert("Error removing admin rights.");
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const targetUserId = memberToRemove.id;
    try {
      await api.delete(`/api/groups/${groupId}/members/${targetUserId}`);
      setMembers(prev => prev.filter(m => m.id !== targetUserId));
    } catch (error) {
      console.error("Failed to remove member", error);
      alert("Error removing member.");
    } finally {
      setMemberToRemove(null);
    }
  };

  // ========== Automation Handlers ==========

  const handleToggleAutomation = async () => {
    setTogglingAutomation(true);
    try {
      const res = await api.put(`/api/groups/${groupId}/automation`, {
        enabled: !automationEnabled
      });
      setAutomationEnabled(res.data.automation_enabled);
    } catch (error: any) {
      console.error("Failed to toggle automation", error);
      alert(error.response?.data?.error || "Error toggling automation.");
    } finally {
      setTogglingAutomation(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAddingKeyword(true);
    try {
      await api.post('/api/automation/keywords', { keyword: newKeyword.trim() });
      setNewKeyword("");
      fetchKeywords();
    } catch (error: any) {
      console.error("Failed to add keyword", error);
      alert(error.response?.data?.error || "Error adding keyword.");
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: number) => {
    try {
      await api.delete(`/api/automation/keywords/${keywordId}`);
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
    } catch (error) {
      console.error("Failed to delete keyword", error);
      alert("Error deleting keyword.");
    }
  };

  const handleSetClassGroup = async () => {
    setSettingClassGroup(true);
    try {
      const isCurrentlyClassGroup = !!group?.is_class_group;
      if (isCurrentlyClassGroup) {
        await api.delete(`/api/groups/${groupId}/class-group`);
      } else {
        await api.put(`/api/groups/${groupId}/class-group`);
      }
      fetchGroupDetails();
    } catch (error: any) {
      console.error("Failed to update class group", error);
      alert(error.response?.data?.error || "Error updating class group status.");
    } finally {
      setSettingClassGroup(false);
    }
  };

  // Determine if the current authenticated user is an admin of this group
  const isCurrentUserAdmin = members.some(m => m.id === currentUser?.id && !!m.is_admin);

  const hasStudent = members.some(m => m.role === 'student');
  const hasTeacher = members.some(m => m.role === 'teacher');
  const isMixedGroup = hasStudent && hasTeacher;

  if (loading) {
    return <div className="w-[350px] shrink-0 bg-[#111b21] border-l border-[#2a3942] p-4 flex justify-center pt-20 text-white">Loading...</div>;
  }

  if (!user && !group) return null;

  return (
    <div className="w-[350px] shrink-0 bg-[#111b21] border-l border-[#2a3942] flex flex-col h-full animate-slide-in-right relative z-20">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#2a3942] bg-[#111b21] hover:bg-[#202c33] transition-colors">
        <button onClick={onClose} className="mr-4 text-white hover:text-white">
          ✕
        </button>
        <h3 className="text-white font-medium">{group ? 'Group info' : 'Contact info'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile / Group Section */}
        {group ? (
          <>
            <div className="p-8 flex flex-col items-center border-b border-[#2a3942] bg-[#111b21]">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border border-[#2a3942] flex justify-center items-center bg-[#202c33]">
                {group.avatar_url ? (
                  <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#00a884] flex items-center justify-center text-5xl font-semibold text-white">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{group.name}</h2>
              <p className="text-white text-sm whitespace-nowrap">Group • {members.length} members</p>
              {/* Badges */}
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                {!!group.is_teacher_group && (
                  <span className="text-xs text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-400/20">
                    👨‍🏫 Teacher Group
                  </span>
                )}
                {!!group.is_class_group && (
                  <span className="text-xs text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-400/20">
                    🏫 Class Group
                  </span>
                )}
                {automationEnabled && !!group.is_teacher_group && (
                  <span className="text-xs text-green-300 bg-green-500/15 px-2 py-0.5 rounded-full border border-green-400/20 animate-pulse">
                    ⚡ Automation Active
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
              <p className="text-sm text-white font-medium mb-2">Description</p>
              <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                {group.description || 'No description provided.'}
              </p>
            </div>

            {/* ===== AUTOMATION SECTION (Teacher Groups Only) ===== */}
            {!!group.is_teacher_group && isCurrentUserAdmin && (
              <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-sm text-white font-medium">Automation</p>
                  </div>
                  <button
                    onClick={handleToggleAutomation}
                    disabled={togglingAutomation}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${automationEnabled
                      ? 'bg-[#00a884] shadow-[0_0_8px_rgba(0,168,132,0.4)]'
                      : 'bg-[#3b4a54]'
                      } ${togglingAutomation ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${automationEnabled ? 'left-[26px]' : 'left-0.5'
                        }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#8696a0] mb-3">
                  {automationEnabled
                    ? "Messages matching keywords will be auto-forwarded to class groups."
                    : "Enable to auto-forward keyword-matched messages to class groups."}
                </p>

                {/* Keywords Management */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowKeywords(!showKeywords)}
                    className="w-full flex items-center justify-between text-xs text-[#00a884] hover:underline py-1"
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                      Manage Keywords ({keywords.length})
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${showKeywords ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {showKeywords && (
                    <div className="mt-2 bg-[#202c33] rounded-lg p-3 space-y-2">
                      {/* Add Keyword Form */}
                      <form onSubmit={handleAddKeyword} className="flex gap-2">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add a keyword..."
                          className="flex-1 bg-transparent border-b border-[#00a884] text-white text-xs py-1 focus:outline-none placeholder-[#8696a0]"
                        />
                        <button
                          type="submit"
                          disabled={addingKeyword || !newKeyword.trim()}
                          className="text-xs bg-[#00a884] text-white px-2 py-1 rounded hover:bg-[#008f6f] disabled:opacity-50 transition-colors"
                        >
                          {addingKeyword ? "..." : "Add"}
                        </button>
                      </form>

                      {/* Keywords List */}
                      {keywords.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {keywords.map((kw) => (
                            <div
                              key={kw.id}
                              className="flex items-center justify-between bg-[#111b21] rounded px-2 py-1.5 group"
                            >
                              <span className="text-xs text-white truncate flex-1 mr-2">
                                "{kw.keyword}"
                              </span>
                              <button
                                onClick={() => handleDeleteKeyword(kw.id)}
                                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                title="Delete keyword"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#8696a0] text-center py-2">
                          No keywords configured. Add keywords to enable automation triggers.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== CLASS GROUP TOGGLE (Non-teacher groups, teacher role) ===== */}
            {!group.is_teacher_group && isCurrentUserAdmin && currentUser?.role === 'teacher' && (
              <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏫</span>
                      <p className="text-sm text-white font-medium">Class Group</p>
                    </div>
                    <p className="text-xs text-[#8696a0] mt-1">
                      {group.is_class_group
                        ? "This is your class group. Automated messages will be forwarded here."
                        : "Mark as your class group to receive automated forwards."}
                    </p>
                  </div>
                  <button
                    onClick={handleSetClassGroup}
                    disabled={settingClassGroup}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${group.is_class_group
                      ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-[#3b4a54]'
                      } ${settingClassGroup ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${group.is_class_group ? 'left-[26px]' : 'left-0.5'
                        }`}
                    />
                  </button>
                </div>
                {group.is_class_group && !members.some(m => !!m.is_cr && !!m.is_admin) && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <span className="text-sm">⚠️</span>
                    <p className="text-[10px] text-orange-300 leading-tight">
                      CR not selected, automation will forward the message to the group without a selection..!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Members Section */}
            <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-white font-medium">{members.length} members</p>
                {isCurrentUserAdmin && (
                  <button onClick={() => { setShowAddMember(!showAddMember); setAddMemberError(""); }} className="text-xs text-[#00a884] hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Member
                  </button>
                )}
              </div>

              {showAddMember && (
                <div className="mb-4 relative">
                  <form onSubmit={handleAddMember} className="bg-[#202c33] p-3 rounded-lg">
                    <input
                      type="text"
                      value={addMemberInput}
                      onChange={(e) => {
                        setAddMemberInput(e.target.value);
                        setAddMemberError("");
                      }}
                      placeholder="Search to add member..."
                      className="w-full bg-transparent border-b border-[#00a884] text-white text-sm py-1 mb-2 focus:outline-none placeholder-[#8696a0]"
                      autoFocus
                    />
                    {addMemberError && <p className="text-red-400 text-xs mb-2">{addMemberError}</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowAddMember(false); setSuggestions([]); setAddMemberInput(""); }} className="text-xs text-[#8696a0] hover:text-white px-2 py-1">Cancel</button>
                      <button type="submit" disabled={addingMember || !addMemberInput.trim()} className="text-xs bg-[#00a884] text-white px-3 py-1 rounded hover:bg-[#008f6f] disabled:opacity-50">
                        {addingMember ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </form>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#202c33] border border-[#2a3942] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-3 p-2 hover:bg-[#2a3942] cursor-pointer transition-colors w-full"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          {suggestion.avatar_url ? (
                            <img src={suggestion.avatar_url} alt={suggestion.name} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#6a7175] flex items-center shrink-0 justify-center text-white text-xs font-medium">
                              {suggestion.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 w-full overflow-hidden">
                            <p className="text-sm text-white font-medium truncate">{suggestion.name}</p>
                            <p className="text-xs text-[#8696a0] truncate">{suggestion.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 group">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center shrink-0 justify-center text-white font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-base text-white truncate font-medium">
                          {member.id === currentUser?.id ? "You" : member.name}
                        </p>
                        {member.is_admin ? (
                          <span className="text-xs text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded border border-[#00a884]/20 ml-2 whitespace-nowrap">
                            {member.role === 'student' && isMixedGroup && member.is_cr ? 'CR' : 'Group Admin'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white truncate">{member.email}</p>
                    </div>

                    {/* Admin Actions */}
                    {isCurrentUserAdmin && member.id !== currentUser?.id && (
                      <div className="hidden group-hover:flex items-center gap-2 pl-2">
                        {member.is_admin ? (
                          <button
                            onClick={() => handleRemoveAdmin(member.id)}
                            className="text-xs px-2 py-1 text-white bg-orange-500/20 hover:bg-orange-500/40 rounded transition-colors whitespace-nowrap"
                            title={member.role === 'student' && isMixedGroup ? "Remove CR" : "Remove Admin"}
                          >
                            {member.role === 'student' && isMixedGroup ? "Remove CR" : "Remove Admin"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMakeAdmin(member.id)}
                              className="text-xs px-2 py-1 text-white bg-blue-500/20 hover:bg-blue-500/40 rounded transition-colors whitespace-nowrap"
                              title="Make Admin"
                            >
                              Make Admin
                            </button>
                            {member.role === 'student' && isMixedGroup && currentUser?.role === 'teacher' && (
                              <button
                                onClick={() => handleMakeCR(member.id)}
                                className="text-xs px-2 py-1 text-white bg-green-500/20 hover:bg-green-500/40 rounded transition-colors whitespace-nowrap"
                                title="Make CR"
                              >
                                Make CR
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="text-xs px-2 py-1 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded transition-colors"
                          title="Remove Member"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-sm text-white">No members found</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-8 flex flex-col items-center border-b border-[#2a3942] bg-[#111b21]">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border border-[#2a3942] bg-[#202c33] flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#00a884] flex items-center justify-center text-5xl font-semibold text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
              <p className="text-white text-sm">{user?.email}</p>
            </div>

            <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
              <p className="text-sm text-white font-medium mb-1">About</p>
              <p className="text-white text-base py-2">
                {user?.bio || 'Available'}
              </p>
            </div>
          </>
        )}

        {/* Media Placeholder */}
        <div className="p-4 bg-[#111b21] mt-2">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-white font-medium">
              Media, links and docs
            </p>
            <span className="text-xs text-white">
              {media.length} &gt;
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-[#202c33] rounded-lg overflow-hidden border border-white/5 cursor-pointer relative group hover:opacity-80 transition-opacity"
                onClick={() => window.open(item.content, "_blank")}
              >
                {item.message_type === "image" ? (
                  <img
                    src={item.content}
                    alt="Media"
                    className="w-full h-full object-cover"
                  />
                ) : item.message_type === "video" ? (
                  <video
                    src={item.content}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
              </div>
            ))}
            {media.length === 0 && (
              <div className="col-span-3 text-center py-4 text-sm text-white">
                No media shared
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this group?`}
        confirmText="Remove"
        onConfirm={confirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
        isDestructive={true}
      />
    </div>
  );
}
