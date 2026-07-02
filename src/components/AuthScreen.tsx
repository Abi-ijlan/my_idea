/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, User, Lock, ArrowRight, LogIn, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate slight decryption delay for a premium cyberpunk/tech vibe
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (cleanUsername === 'abi' && password === '123') {
      localStorage.setItem('vault_active_session', 'abi');
      onAuthSuccess();
    } else {
      setError('Invalid username or password. This is a private vault.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Enforce select_account to make testing easier
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      onAuthSuccess();
    } catch (e: any) {
      console.error('Google Sign-In Error:', e);
      setError(e.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen premium-bg text-gray-200 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-20%] h-[50rem] w-[50rem] rounded-full bg-purple-600/15 filter blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-20%] h-[50rem] w-[50rem] rounded-full bg-cyan-500/12 filter blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
            Idea Vault
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Your private vault. Keep your creative sparks secure & synced.
          </p>
        </div>

        <div className="w-full rounded-[24px] p-6 md:p-8 relative overflow-hidden border border-white/[0.12] bg-[#0c0715]/88 backdrop-blur-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_50px_rgba(6,182,212,0.03)]">
          {/* Top gloss indicator */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

          {/* Secure Header */}
          <div className="flex items-center justify-center gap-2 mb-6 py-1 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
            <LogIn className="h-4 w-4 text-cyan-400" />
            Private Vault Auth
          </div>

          <div className="space-y-5">
            {/* Error Message */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-300 text-xs font-semibold shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real Firebase Google Authentication */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-sm tracking-wide shadow-[0_15px_30px_rgba(6,182,212,0.25),0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.35),0_0_25px_rgba(168,85,247,0.25)] transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mb-6"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-200 animate-pulse" />
                    Sign in with Google (Cloud Sync)
                  </>
                )}
              </button>
            </div>

            {/* Separator / Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-[#0c0715] text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                or use local access
              </span>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="abi"
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 font-medium font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••"
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-slate-600 font-medium font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 hover:text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enter Local Vault
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
