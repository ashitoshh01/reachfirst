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
            setTimeout(() => {
                router.push('/chat');
            }, 1000);
        } catch (err: any) {
            if (!err.response) {
                setError('Unable to reach the server. Please check your internet connection or try again later.');
            } else {
                setError(err.response?.data?.error || 'Login failed');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center auth-gradient text-text-primary p-4">
            <div className="w-full max-w-[450px] auth-card animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/15 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-light mb-2">Academic Messenger</h1>
                    <p className="text-text-secondary">Login to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm text-center">
                            {success}
                        </div>
                    )}

                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input input-dark"
                            placeholder="Email Address"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input input-dark"
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full btn btn-primary py-3 rounded-lg font-semibold mt-4"
                    >
                        {success ? 'Success' : loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-secondary">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>

            <div className="fixed bottom-8 text-center">
                <p className="text-xs text-text-muted flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    End-to-end encrypted
                </p>
            </div>
        </div>
    );
}
