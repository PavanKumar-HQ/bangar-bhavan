import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, LogIn, Utensils } from 'lucide-react';
import { sound } from '../lib/sound';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      sound.playSuccess();
      navigate('/');
    } catch (err: any) {
      sound.playError();
      setError(err.response?.data?.error || 'Invalid credentials. Try admin / admin123');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-deepred-800/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-deepred-800 text-softyellow-200 shadow-md border-2 border-deepred-900">
            <Utensils className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-darkbrown-900 tracking-tight">
            Bangar Bhavan Chats
          </h1>
          <p className="text-xs text-darkbrown-600 font-semibold uppercase tracking-wider">
            Fast Single Counter Billing POS
          </p>
        </div>

        {error && (
          <div className="bg-deepred-50 border-l-4 border-deepred-800 p-3 rounded text-xs font-bold text-deepred-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-darkbrown-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-darkbrown-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl font-semibold text-darkbrown-900 focus:outline-none focus:border-deepred-700 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-darkbrown-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-darkbrown-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl font-semibold text-darkbrown-900 focus:outline-none focus:border-deepred-700 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-darkbrown-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-deepred-800 focus:ring-deepred-700 accent-deepred-800"
              />
              <span>Remember login</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-deepred-900"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to POS'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-cream-200">
          <p className="text-[11px] text-darkbrown-500 font-medium">
            Default credentials: <code className="bg-cream-200 px-1 py-0.5 rounded text-darkbrown-900 font-bold">admin</code> / <code className="bg-cream-200 px-1 py-0.5 rounded text-darkbrown-900 font-bold">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
