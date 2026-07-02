/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send } from 'lucide-react';
import { IdeaCategory, CATEGORIES } from '../types';

interface IdeaFormProps {
  onSave: (ideaData: { title: string; description: string; category: IdeaCategory }) => Promise<void>;
}

export default function IdeaForm({ onSave }: IdeaFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Tech');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('A title is required to register this idea.');
      return;
    }
    if (!description.trim()) {
      setError('Please add some context or a description.');
      return;
    }

    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
      });
    } catch (error: any) {
      setError(error.message || 'Unable to save this idea to cloud storage.');
      return;
    }

    // Reset fields
    setTitle('');
    setDescription('');
  };

  // Category specific neon border/text highlights for selection buttons
  const categoryBtnStyles: Record<IdeaCategory, { selected: string; inactive: string }> = {
    Startup: {
      selected: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.25)] font-bold',
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:text-emerald-300 hover:shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    },
    Creative: {
      selected: 'bg-pink-500/15 border-pink-400/50 text-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.25)] font-bold',
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-pink-500/10 hover:border-pink-400/30 hover:text-pink-300 hover:shadow-[0_0_12px_rgba(244,114,182,0.15)]',
    },
    Tech: {
      selected: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)] font-bold',
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]',
    },
    Concept: {
      selected: 'bg-fuchsia-500/15 border-fuchsia-400/50 text-fuchsia-300 shadow-[0_0_20px_rgba(223,114,24 pink,0.25)] font-bold', // Adjusted slightly below
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-fuchsia-500/10 hover:border-fuchsia-400/30 hover:text-fuchsia-300 hover:shadow-[0_0_12px_rgba(223,114,242,0.15)]',
    },
    Design: {
      selected: 'bg-purple-500/15 border-purple-400/50 text-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.25)] font-bold',
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-purple-500/10 hover:border-purple-400/30 hover:text-purple-300 hover:shadow-[0_0_12px_rgba(192,132,252,0.15)]',
    },
    Other: {
      selected: 'bg-slate-500/15 border-slate-400/50 text-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.25)] font-bold',
      inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-slate-500/10 hover:border-slate-400/30 hover:text-slate-300 hover:shadow-[0_0_12px_rgba(148,163,184,0.15)]',
    },
  };

  // Adjusting Concept slightly to be precise
  categoryBtnStyles.Concept = {
    selected: 'bg-rose-500/15 border-rose-400/50 text-rose-300 shadow-[0_0_20px_rgba(251,113,133,0.25)] font-bold',
    inactive: 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-rose-500/10 hover:border-rose-400/30 hover:text-rose-300 hover:shadow-[0_0_12px_rgba(251,113,133,0.15)]',
  };

  return (
    <motion.div
      id="idea-form-container"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full rounded-[24px] p-6 md:p-8 relative overflow-hidden border border-white/[0.12] bg-[#0c0715]/88 backdrop-blur-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75),0_0_50px_rgba(6,182,212,0.03),inset_0_1px_1px_rgba(255,255,255,0.02)]"
    >
      {/* Top micro gloss line for genuine glassmorphism */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

      {/* Cyber ambient background spots */}
      <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none animate-float-1" />
      <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none animate-float-2" />

      <div className="mb-6 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            Capture Idea
          </h2>
          <p className="text-white/50 text-xs mt-1 font-light">
            Turn a raw spark into a clear concept worth building.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center px-3 py-1.5 rounded-xl bg-cyan-500/8 border border-cyan-500/20 text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>CYAN V2 CORE ACTIVE</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10" id="new-idea-form">
        <div className="space-y-4">
          <div className="group relative">
            <input
              type="text"
              id="idea-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Give your breakthrough thought a name..."
              className="w-full rounded-2xl glass-input px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none transition-all font-sans font-medium"
              maxLength={100}
            />
          </div>

          <div>
            <textarea
              id="idea-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe your vision, technical specs, or design elements..."
              rows={4}
              className="w-full resize-none rounded-2xl glass-input px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none transition-all font-sans leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-white/40 font-bold uppercase tracking-wider mb-2.5">
              Select Category Tag
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" id="category-selector">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const activeStyle = categoryBtnStyles[cat] || categoryBtnStyles.Other;

                return (
                  <motion.button
                    key={cat}
                    type="button"
                    id={`btn-category-${cat}`}
                    onClick={() => setCategory(cat)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border backdrop-blur-md transition-all duration-300 ease-out cursor-pointer text-center ${
                      isSelected ? activeStyle.selected : activeStyle.inactive
                    }`}
                  >
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            id="form-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-400 text-xs bg-rose-500/8 border border-rose-500/25 rounded-xl p-3"
          >
            <p>{error}</p>
          </motion.div>
        )}

        <div className="flex justify-end pt-2">
          <motion.button
            type="submit"
            id="btn-save-idea"
            whileHover={{ 
              scale: 1.02, 
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-600 text-white rounded-2xl font-bold transition-all duration-300 cursor-pointer text-sm font-sans"
          >
            <Send className="h-4 w-4" />
            Save Idea
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
