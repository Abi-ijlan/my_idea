import { useState, FormEvent } from 'react';
import { Sparkles, Eye, EyeOff, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        setSuccessMessage('Account created! Check your email for confirmation, then log in.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen premium-bg text-gray-200 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[45rem] w-[45rem] rounded-full bg-purple-600/12 filter blur-[120px] animate-float-1" />
        <div className="absolute top-[10%] right-[-10%] h-[38rem] w-[38rem] rounded-full bg-cyan-500/12 filter blur-[130px] animate-drift" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-pink-600/10 filter blur-[120px] animate-float-2" />
        <div className="absolute top-[30%] left-[15%] h-[35rem] w-[35rem] rounded-full bg-fuchsia-600/10 filter blur-[120px] animate-drift" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] mx-auto">
                <Sparkles className="h-6 w-6 animate-pulse text-cyan-300" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Idea Vault
            </h1>
            <p className="text-white/50 text-sm font-light">
              {mode === 'login' ? 'Sign in to access your vault' : 'Create your account'}
            </p>
          </div>

          {/* Neon divider */}
          <div className="neon-divider animate-pulse" style={{ animationDuration: '4s' }} />

          {/* Success message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-xs text-emerald-200"
              >
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-xs text-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider font-mono">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'login' ? 'email' : 'email'}
                className="w-full rounded-2xl glass-input pl-4 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-2xl glass-input pl-4 pr-12 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-sm font-bold transition-all duration-300 cursor-pointer hover:bg-cyan-500/25 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-300 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? (
                    <><LogIn className="h-4 w-4" /> Sign In</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> Create Account</>
                  )}
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-[11px] font-mono text-white/40 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
