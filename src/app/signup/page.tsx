'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name, code);
            router.push('/chat');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-[#e9edef] p-4">
            <div className="w-full max-w-[450px]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-light mb-2">Academic Messenger</h1>
                    <p className="text-[#8696a0]">Create your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Full Name"
                            required
                        />
                    </div>

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
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Invitation Code"
                            required
                        />
                        <p className="text-xs text-[#8696a0] mt-1 ml-1">Ask your administrator for your code</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Password"
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-4 py-3 text-[#d1d7db] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none transition-colors"
                            placeholder="Confirm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#8696a0]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#00a884] hover:underline">
                        Sign in
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
