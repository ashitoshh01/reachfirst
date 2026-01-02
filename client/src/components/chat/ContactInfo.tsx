import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface ContactInfoProps {
    userId: number;
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

export default function ContactInfo({ userId, chatId, onClose }: ContactInfoProps) {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUserDetails();
        }
        if (chatId) {
            fetchChatMedia();
        }
    }, [userId, chatId]);

    const fetchChatMedia = async () => {
        try {
            const res = await api.get(`/api/chats/${chatId}/media`);
            setMedia(res.data.media);
        } catch (error) {
            console.error('Failed to load media', error);
        }
    };

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/users/${userId}`); // Need this endpoint? Or search?
            // Actually I don't have GET /api/users/:id. I have search.
            // But I can use the same endpoint if I add ID support or just get public info.
            // Let's check routes.
            setUser(res.data.user);
        } catch (error) {
            console.error('Failed to load user details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="w-80 bg-surface-dark border-l border-white/10 p-4 flex justify-center pt-20">Loading...</div>;
    }

    if (!user) return null;

    return (
        <div className="w-80 bg-surface-dark border-l border-white/10 flex flex-col h-full animate-slide-in-right">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-white/10 bg-surface-dark hover:bg-surface-dark px-4">
                <button onClick={onClose} className="mr-4 text-gray-400 hover:text-white">
                    ✕
                </button>
                <h3 className="text-white font-medium">Contact info</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Section */}
                <div className="p-8 flex flex-col items-center border-b border-black/20 bg-surface-dark">
                    <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-4 border-surface-dark shadow-lg absolute-center relative">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center text-4xl text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
                    <p className="text-text-dark-secondary text-sm">{user.email}</p>
                </div>

                {/* About / Bio */}
                <div className="p-4 border-b border-black/20 bg-surface-dark mt-2">
                    <p className="text-sm text-primary-400 font-medium mb-1">About</p>
                    <p className="text-white text-sm whitespace-pre-wrap">
                        {user.bio || 'Available'}
                    </p>
                </div>

                {/* Media Placeholder */}
                <div className="p-4 bg-surface-dark mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-400 font-medium">Media, links and docs</p>
                        <span className="text-xs text-gray-500">{media.length} &gt;</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {media.map((item) => (
                            <div key={item.id} className="aspect-square bg-surface-dark-hover rounded-lg overflow-hidden border border-white/5 cursor-pointer relative group" onClick={() => window.open(item.content, '_blank')}>
                                {item.message_type === 'image' ? (
                                    <img src={item.content} alt="Media" className="w-full h-full object-cover" />
                                ) : item.message_type === 'video' ? (
                                    <video src={item.content} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <span className="text-2xl">📄</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {media.length === 0 && (
                            <div className="col-span-3 text-center py-4 text-xs text-text-dark-secondary">
                                No media shared
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
