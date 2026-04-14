import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface GroupMember {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  is_admin?: number | boolean;
  role?: string;
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
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

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
    } catch (error) {
      console.error("Failed to load group details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberEmail.trim()) return;
    setAddingMember(true);
    setAddMemberError("");
    try {
      // Find user by email
      const searchRes = await api.get(`/api/users/find?email=${addMemberEmail.trim()}`);
      const foundUser = searchRes.data.user;
      
      if (members.some(m => m.id === foundUser.id)) {
        setAddMemberError("User is already a member");
        setAddingMember(false);
        return;
      }

      // Add user to group
      await api.post(`/api/groups/${groupId}/members`, { userId: foundUser.id });
      
      // Update local state by re-fetching group details to get member list
      fetchGroupDetails();
      setShowAddMember(false);
      setAddMemberEmail("");
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
      // Re-fetch group to get accurate admin/CR status since others might have been removed
      fetchGroupDetails();
    } catch (error) {
      console.error("Failed to make user admin", error);
      alert("Error making user admin/CR.");
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    try {
      if(!confirm("Are you sure you want to remove this user from the group?")) return;
      await api.delete(`/api/groups/${groupId}/members/${targetUserId}`);
      // Update local state
      setMembers(prev => prev.filter(m => m.id !== targetUserId));
    } catch (error) {
      console.error("Failed to remove member", error);
      alert("Error removing member.");
    }
  };

  // Determine if the current authenticated user is an admin of this group
  const isCurrentUserAdmin = members.some(m => m.id === currentUser?.id && !!m.is_admin);

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
            </div>

            <div className="p-4 border-b border-[#2a3942] bg-[#111b21] mt-2">
              <p className="text-sm text-white font-medium mb-2">Description</p>
              <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                {group.description || 'No description provided.'}
              </p>
            </div>

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
                <form onSubmit={handleAddMember} className="mb-4 bg-[#202c33] p-3 rounded-lg">
                  <input
                    type="email"
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="Enter user email..."
                    className="w-full bg-transparent border-b border-[#00a884] text-white text-sm py-1 mb-2 focus:outline-none placeholder-[#8696a0]"
                    autoFocus
                  />
                  {addMemberError && <p className="text-red-400 text-xs mb-2">{addMemberError}</p>}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddMember(false)} className="text-xs text-[#8696a0] hover:text-white px-2 py-1">Cancel</button>
                    <button type="submit" disabled={addingMember || !addMemberEmail.trim()} className="text-xs bg-[#00a884] text-white px-3 py-1 rounded hover:bg-[#008f6f] disabled:opacity-50">
                      {addingMember ? "Adding..." : "Add"}
                    </button>
                  </div>
                </form>
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
                            {member.role === 'student' ? 'CR' : 'Group Admin'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white truncate">{member.email}</p>
                    </div>

                    {/* Admin Actions */}
                    {isCurrentUserAdmin && member.id !== currentUser?.id && (
                      <div className="hidden group-hover:flex items-center gap-2 pl-2">
                        {!member.is_admin && (
                          <button 
                            onClick={() => handleMakeAdmin(member.id)}
                            className="text-xs px-2 py-1 text-white bg-blue-500/20 hover:bg-blue-500/40 rounded transition-colors"
                            title={member.role === 'student' ? 'Make CR' : 'Make Admin'}
                          >
                            {member.role === 'student' ? 'Make CR' : 'Make Admin'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
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
    </div>
  );
}
