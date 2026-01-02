'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await login(email, password);
            setSuccess('Signed in successfully!');
            // Delay redirect to show success message
            setTimeout(() => {
                router.push('/chat');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-[#e9edef] p-4">
            <div className="w-full max-w-[450px]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light mb-2">Academic Messenger</h1>
                    <p className="text-[#8696a0]">Login to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded text-sm text-center">
                            {success}
                        </div>
                    )}

                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Email Address"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
                    >
                        {success ? 'Success' : loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#8696a0]">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-[#00a884] hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>

            <div className="fixed bottom-8 text-center">
                <p className="text-xs text-[#667781] flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                    </svg>
                    End-to-end encrypted
                </p>
            </div>
        </div>
    );
}
