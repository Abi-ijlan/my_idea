/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Idea, IdeaCategory, CATEGORIES } from './types';
import IdeaForm from './components/IdeaForm';
import IdeaCard from './components/IdeaCard';
import { clearIdeas, createIdea, deleteIdea, loadIdeas, updateIdea } from './lib/ideasApi';

const INITIAL_SAMPLE_IDEAS: Omit<Idea, 'id'>[] = [
  {
    title: 'Gamified Habit RPG',
    description: 'A retro 16-bit themed habit tracker where completing daily chores yields experience points and unlocks visual gear for your pixel avatar. Connects real world tasks directly to character stats.',
    category: 'Creative',
    color: 'emerald',
    createdAt: Date.now() - 3 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
    isPinned: true,
  },
  {
    title: 'Surplus Food Marketplace',
    description: 'A platform to safely bridge the gap between neighborhood cooks with fresh leftovers and students or families looking for home-style affordable meals. Solves community food waste.',
    category: 'Startup',
    color: 'amber',
    createdAt: Date.now() - 24 * 3600 * 1000,
    updatedAt: Date.now() - 24 * 3600 * 1000,
    isPinned: false,
  },
  {
    title: 'Zero-Config API Gatekeeper',
    description: 'A fast reverse proxy designed for micro-teams that injects authentication, rate limiting, and real-time dashboard visualization directly through a single YAML config.',
    category: 'Tech',
    color: 'cyan',
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 2 * 24 * 3600 * 1000,
    isPinned: false,
  }
];

const LOCAL_USER_ID = 'local-user';

export default function App() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'alphabetical'>('latest');
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    const loadIdeasFromBackend = async () => {
      try {
        const loadedIdeas = await loadIdeas(LOCAL_USER_ID);
        setIdeas(loadedIdeas);
        setCloudError(null);
      } catch (error: any) {
        setCloudError(error.message || 'Unable to connect to cloud storage.');
      }
    };

    void loadIdeasFromBackend();
  }, []);

  // Auto-reset confirmation button after 4 seconds
  useEffect(() => {
    if (isConfirmingDeleteAll) {
      const timer = setTimeout(() => {
        setIsConfirmingDeleteAll(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingDeleteAll]);

  const handleAddIdea = async (ideaData: { title: string; description: string; category: IdeaCategory }) => {
    try {
      const newIdea = await createIdea({
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category,
        color: 'cyan',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        userId: LOCAL_USER_ID,
      });

      setIdeas((prev) => [newIdea, ...prev]);
      setCloudError(null);
    } catch (error: any) {
      const message = error.message || 'Unable to save this idea to cloud storage.';
      setCloudError(message);
      throw new Error(message);
    }
  };

  const handleUpdateIdea = async (id: string, updatedFields: Partial<Idea>) => {
    try {
      const updatedIdea = await updateIdea(id, updatedFields, LOCAL_USER_ID);
      setIdeas((prev) => prev.map((idea) => (idea.id === id ? updatedIdea : idea)));
      setCloudError(null);
    } catch (error: any) {
      setCloudError(error.message || 'Unable to update this idea in cloud storage.');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteIdea(id, LOCAL_USER_ID);
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
      setCloudError(null);
    } catch (error: any) {
      setCloudError(error.message || 'Unable to delete this idea from cloud storage.');
    }
  };

  const handleSeedSamples = async () => {
    try {
      const newIdeas: Idea[] = [];

      for (const sample of INITIAL_SAMPLE_IDEAS) {
        const newIdea = await createIdea({
          title: sample.title,
          description: sample.description,
          category: sample.category as IdeaCategory,
          color: sample.color || 'cyan',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: sample.isPinned,
          userId: LOCAL_USER_ID,
        });
        newIdeas.push(newIdea);
      }

      setIdeas((prev) => [...newIdeas, ...prev]);
    } catch (e) {
      console.error('Failed to seed sample ideas:', e);
      setCloudError(e instanceof Error ? e.message : 'Unable to seed sample ideas in cloud storage.');
    }
  };

  const handleDeleteAllIdeas = async () => {
    try {
      await clearIdeas(LOCAL_USER_ID);
      setIdeas([]);
      setIsConfirmingDeleteAll(false);
      setCloudError(null);
    } catch (error: any) {
      setCloudError(error.message || 'Unable to clear cloud ideas.');
    }
  };

  const processedIdeas = useMemo(() => {
    let filtered = ideas.filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || idea.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'latest') {
        return b.createdAt - a.createdAt;
      } else if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [ideas, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen premium-bg text-gray-200 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200 relative overflow-hidden pb-12">
      {/* Floating Glowing Orbs for Depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Purple top-left orb */}
        <div className="absolute top-[-10%] left-[-10%] h-[45rem] w-[45rem] rounded-full bg-purple-600/12 filter blur-[120px] animate-float-1" />
        {/* Cyan center-right accent orb for high-tech contrast */}
        <div className="absolute top-[10%] right-[-10%] h-[38rem] w-[38rem] rounded-full bg-cyan-500/12 filter blur-[130px] animate-drift" />
        {/* Pink bottom-right orb */}
        <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-pink-600/10 filter blur-[120px] animate-float-2" />
        {/* Magenta/Lavender center-left orb */}
        <div className="absolute top-[30%] left-[15%] h-[35rem] w-[35rem] rounded-full bg-fuchsia-600/10 filter blur-[120px] animate-drift" />
        
        {/* Animated ambient tiny particles */}
        <div className="absolute top-[15%] left-[25%] h-1.5 w-1.5 rounded-full bg-purple-400 opacity-20 filter blur-[1px] animate-float-1" />
        <div className="absolute top-[35%] right-[30%] h-1.5 w-1.5 rounded-full bg-cyan-400 opacity-30 filter blur-[1px] animate-float-2" />
        <div className="absolute top-[50%] right-[20%] h-2 w-2 rounded-full bg-pink-400 opacity-15 filter blur-[2px] animate-float-2" />
        <div className="absolute bottom-[25%] left-[45%] h-1 w-1 rounded-full bg-fuchsia-400 opacity-25 filter blur-[1px] animate-float-1" />
        <div className="absolute bottom-[40%] left-[15%] h-2 w-2 rounded-full bg-cyan-300 opacity-20 filter blur-[1.5px] animate-float-1" />
        <div className="absolute top-[75%] left-[10%] h-2 w-2 rounded-full bg-fuchsia-400 opacity-15 filter blur-[2px] animate-float-2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-10">
        
        <div className="space-y-4">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-6" id="vault-header">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                  <Sparkles className="h-6 w-6 animate-pulse text-cyan-300" />
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Idea Vault
                </h1>
              </div>
              <p className="text-white/60 text-sm font-light max-w-md leading-relaxed">
                Capture and organize your thoughts.
              </p>
            </motion.div>

          </header>

          {/* Premium Neon Divider */}
          <div className="neon-divider animate-pulse" style={{ animationDuration: '4s' }} />

          {cloudError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-xs text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <div>
                <p className="font-semibold">Cloud storage is unavailable.</p>
                <p className="mt-1 text-rose-100/75">{cloudError}</p>
              </div>
            </div>
          )}

          {/* Input Section */}
          <section id="vault-creator">
            <IdeaForm onSave={handleAddIdea} />
          </section>

        </div>

        {/* Controls */}
        <section id="vault-controls" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/60" />
              <input
                id="search-input"
                type="text"
                placeholder="Query your creative space..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl glass-input pl-11 pr-14 py-3 text-xs text-white placeholder-white/25 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400 hover:text-cyan-200 cursor-pointer font-bold uppercase tracking-wider"
                >
                  clear
                </button>
              )}
            </div>

            {/* Sorter */}
            <div className="relative flex items-center bg-white/[0.02] border border-white/[0.06] backdrop-blur-md rounded-2xl px-4 py-3 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] transition-all focus-within:border-cyan-500/40 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-[11px] text-white/75 focus:outline-none cursor-pointer pr-3 font-semibold font-sans"
              >
                <option value="latest" className="bg-[#0b0613] text-white/85">Newest First</option>
                <option value="oldest" className="bg-[#0b0613] text-white/85">Oldest First</option>
                <option value="alphabetical" className="bg-[#0b0613] text-white/85">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Categories Filter Bar */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3.5 scrollbar-none" id="category-pills">
            <motion.button
              id="pill-all"
              onClick={() => setSelectedCategory('All')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap border backdrop-blur-md ${
                selectedCategory === 'All'
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.3)]'
                  : 'bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.05] hover:border-cyan-500/25 hover:text-cyan-200'
              }`}
            >
              All ({ideas.length})
            </motion.button>
            {CATEGORIES.map((cat) => {
              const count = ideas.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <motion.button
                  key={cat}
                  id={`pill-category-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap border backdrop-blur-md ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.3)]'
                      : 'bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.05] hover:border-cyan-500/25 hover:text-cyan-200'
                  }`}
                >
                  {cat} ({count})
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* List Grid */}
        <section id="vault-grid-section" className="space-y-4">
          {processedIdeas.length > 0 ? (
            <div
              className="grid gap-6 grid-cols-1 md:grid-cols-2"
              id="vault-grid-display"
            >
              <AnimatePresence>
                {processedIdeas.map((idea) => (
                  <motion.div
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -15 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 26,
                      layout: { duration: 0.35, ease: 'easeOut' }
                    }}
                  >
                    <IdeaCard
                      idea={idea}
                      onDelete={handleDeleteIdea}
                      onUpdate={handleUpdateIdea}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              id="empty-vault-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-20 rounded-[24px] border border-white/[0.06] bg-[#0c0715]/40 backdrop-blur-md shadow-[0_15px_45px_rgba(0,0,0,0.5)]"
            >
              {ideas.length === 0 ? (
                <div className="max-w-sm px-6">
                  <p className="text-white/50 text-sm font-light mb-6 leading-relaxed">
                    Your idea vault is currently empty. Capture your first thought above or load the system samples.
                  </p>
                  <motion.button
                    id="btn-seed-empty-vault"
                    onClick={handleSeedSamples}
                    whileHover={{ scale: 1.05, borderColor: 'rgba(6, 182, 212, 0.45)', color: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 bg-cyan-500/10 text-cyan-300 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  >
                    Load Sample Ideas
                  </motion.button>
                </div>
              ) : (
                <div className="max-w-sm px-6">
                  <p className="text-white/50 text-sm font-light mb-6 leading-relaxed">
                    No thoughts matches your search parameters or selected filters.
                  </p>
                  <motion.button
                    id="btn-reset-filters"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    whileHover={{ scale: 1.05, borderColor: 'rgba(6, 182, 212, 0.45)', color: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 bg-cyan-500/10 text-cyan-300 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  >
                    Reset Active Filters
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] mt-24">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-white/40 font-mono">
          <p>Idea Vault - Secure Cloud Persistence</p>
          
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <AnimatePresence mode="wait">
              {!isConfirmingDeleteAll ? (
                <motion.button
                  key="delete-all-btn"
                  id="btn-delete-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setIsConfirmingDeleteAll(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-[11px] font-mono text-rose-300 hover:text-rose-100 transition-all duration-300 cursor-pointer px-4 py-2 rounded-xl bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  Delete All Ideas
                </motion.button>
              ) : (
                <motion.button
                  key="confirm-delete-all-btn"
                  id="btn-confirm-delete-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleDeleteAllIdeas}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-[11px] font-mono text-red-200 hover:text-white transition-all duration-300 cursor-pointer px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/40 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  Click to Confirm Delete All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </footer>
    </div>
  );
}
