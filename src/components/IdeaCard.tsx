/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, CSSProperties } from 'react';
import { motion } from 'motion/react';
import { Trash2, Edit2, Check, X, Pin } from 'lucide-react';
import { Idea, CATEGORIES, IdeaCategory } from '../types';

interface IdeaCardProps {
  idea: Idea;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFields: Partial<Idea>) => void;
}

const CATEGORY_COLORS: Record<IdeaCategory, {
  border: string;
  borderHover: string;
  glow: string;
  glowHover: string;
  accent: string;
  text: string;
  pillBg: string;
  dotBg: string;
  editCategorySelected: string;
  editCategoryInactive: string;
  actionButtonActive: string;
  actionButtonHover: string;
  pinnedBorder: string;
  pinnedBg: string;
  pinnedGlow: string;
  pinnedText: string;
}> = {
  Startup: {
    border: 'rgba(16, 185, 129, 0.32)',
    borderHover: 'rgba(16, 185, 129, 0.65)',
    glow: 'rgba(16, 185, 129, 0.08)',
    glowHover: 'rgba(16, 185, 129, 0.22)',
    accent: '#10b981',
    text: 'text-emerald-300',
    pillBg: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-200/90',
    dotBg: 'bg-emerald-400',
    editCategorySelected: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-300',
    actionButtonActive: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    pinnedBorder: 'border-emerald-500/40',
    pinnedBg: 'bg-emerald-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    pinnedText: 'text-emerald-300',
  },
  Creative: {
    border: 'rgba(244, 114, 182, 0.32)',
    borderHover: 'rgba(244, 114, 182, 0.65)',
    glow: 'rgba(244, 114, 182, 0.08)',
    glowHover: 'rgba(244, 114, 182, 0.22)',
    accent: '#f472b6',
    text: 'text-pink-300',
    pillBg: 'bg-pink-500/12 border-pink-500/30 text-pink-200/90',
    dotBg: 'bg-pink-400',
    editCategorySelected: 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-pink-500/15 hover:border-pink-500/40 hover:text-pink-300',
    actionButtonActive: 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-pink-500/15 hover:border-pink-500/40 hover:text-pink-300 hover:shadow-[0_0_12px_rgba(244,114,182,0.25)]',
    pinnedBorder: 'border-pink-500/40',
    pinnedBg: 'bg-pink-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(244,114,182,0.25)]',
    pinnedText: 'text-pink-300',
  },
  Tech: {
    border: 'rgba(6, 182, 212, 0.32)',
    borderHover: 'rgba(6, 182, 212, 0.65)',
    glow: 'rgba(6, 182, 212, 0.08)',
    glowHover: 'rgba(6, 182, 212, 0.25)',
    accent: '#22d3ee',
    text: 'text-cyan-300',
    pillBg: 'bg-cyan-500/12 border-cyan-500/30 text-cyan-200/90',
    dotBg: 'bg-cyan-400',
    editCategorySelected: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300',
    actionButtonActive: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    pinnedBorder: 'border-cyan-500/40',
    pinnedBg: 'bg-cyan-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
    pinnedText: 'text-cyan-300',
  },
  Concept: {
    border: 'rgba(244, 63, 94, 0.32)',
    borderHover: 'rgba(244, 63, 94, 0.65)',
    glow: 'rgba(244, 63, 94, 0.08)',
    glowHover: 'rgba(244, 63, 94, 0.22)',
    accent: '#fb7185',
    text: 'text-rose-300',
    pillBg: 'bg-rose-500/12 border-rose-500/30 text-rose-200/90',
    dotBg: 'bg-rose-400',
    editCategorySelected: 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300',
    actionButtonActive: 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300 hover:shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    pinnedBorder: 'border-rose-500/40',
    pinnedBg: 'bg-rose-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
    pinnedText: 'text-rose-300',
  },
  Design: {
    border: 'rgba(192, 132, 252, 0.32)',
    borderHover: 'rgba(192, 132, 252, 0.65)',
    glow: 'rgba(192, 132, 252, 0.08)',
    glowHover: 'rgba(192, 132, 252, 0.22)',
    accent: '#c084fc',
    text: 'text-purple-300',
    pillBg: 'bg-purple-500/12 border-purple-500/30 text-purple-200/90',
    dotBg: 'bg-purple-400',
    editCategorySelected: 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-purple-500/15 hover:border-purple-500/40 hover:text-purple-300',
    actionButtonActive: 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-purple-500/15 hover:border-purple-500/40 hover:text-purple-300 hover:shadow-[0_0_12px_rgba(192,132,252,0.25)]',
    pinnedBorder: 'border-purple-500/40',
    pinnedBg: 'bg-purple-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(192,132,252,0.25)]',
    pinnedText: 'text-purple-300',
  },
  Other: {
    border: 'rgba(148, 163, 184, 0.32)',
    borderHover: 'rgba(148, 163, 184, 0.65)',
    glow: 'rgba(148, 163, 184, 0.08)',
    glowHover: 'rgba(148, 163, 184, 0.22)',
    accent: '#94a3b8',
    text: 'text-purple-200/80',
    pillBg: 'bg-white/8 border border-white/15 text-purple-200/90',
    dotBg: 'bg-purple-300/80',
    editCategorySelected: 'bg-slate-500/20 border-slate-500/50 text-purple-200 shadow-[0_0_12px_rgba(148,163,184,0.3)] font-bold',
    editCategoryInactive: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-slate-500/15 hover:border-slate-500/40 hover:text-purple-200',
    actionButtonActive: 'bg-slate-500/20 border-slate-500/50 text-purple-200 shadow-[0_0_12px_rgba(148,163,184,0.3)]',
    actionButtonHover: 'bg-white/[0.04] border-white/[0.12] text-white/60 hover:bg-slate-500/15 hover:border-slate-500/40 hover:text-purple-200 hover:shadow-[0_0_12px_rgba(148,163,184,0.25)]',
    pinnedBorder: 'border-slate-500/40',
    pinnedBg: 'bg-slate-950/25',
    pinnedGlow: 'shadow-[0_0_30px_rgba(148,163,184,0.25)]',
    pinnedText: 'text-purple-200/80',
  },
};

export default function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title || '');
  const [editDescription, setEditDescription] = useState(idea.description || '');
  const [editCategory, setEditCategory] = useState<IdeaCategory>(idea.category || 'Other');

  const colors = CATEGORY_COLORS[idea.category] || CATEGORY_COLORS['Other'];

  const handleSave = () => {
    if (!editTitle.trim() || !editDescription.trim()) return;
    onUpdate(idea.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(idea.title || '');
    setEditDescription(idea.description || '');
    setEditCategory(idea.category || 'Other');
    setIsEditing(false);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const styleVariables = {
    '--card-border-color': colors.border,
    '--card-border-hover-color': colors.borderHover,
    '--card-glow-color': colors.glow,
    '--card-glow-hover-color': colors.glowHover,
  } as CSSProperties;

  return (
    <div
      id={`idea-card-${idea.id}`}
      style={styleVariables}
      className={`relative flex flex-col justify-between overflow-hidden rounded-[24px] glass-card p-6 md:p-8 group border h-full transition-all duration-300 ${
        idea.isPinned
          ? `${colors.pinnedBorder} ${colors.pinnedBg} ${colors.pinnedGlow}`
          : ''
      }`}
    >
      {/* Subtle top-edge glass reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/12 to-transparent pointer-events-none" />

      {/* Cyber ambient glow behind card on hover with matching category color BLENDED with vibrant cyan */}
      <div 
        className="absolute inset-0 transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100" 
        style={{
          background: `radial-gradient(circle at 25% 25%, ${colors.borderHover} 0%, transparent 60%), radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.25) 0%, transparent 60%)`
        }}
      />

      {isEditing ? (
        <div className="flex flex-col gap-4 h-full" id={`edit-form-${idea.id}`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Editing Thought</span>
            <div className="flex gap-2">
              <button
                id={`btn-cancel-edit-${idea.id}`}
                onClick={handleCancel}
                className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.18] cursor-pointer"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                id={`btn-save-edit-${idea.id}`}
                onClick={handleSave}
                className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md border cursor-pointer"
                style={{
                  borderColor: colors.borderHover,
                  backgroundColor: colors.border,
                  color: colors.accent,
                }}
                title="Save"
                disabled={!editTitle.trim() || !editDescription.trim()}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              id={`input-edit-title-${idea.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl glass-input px-4 py-2 text-sm text-white focus:outline-none placeholder-white/30 animate-fade-in"
              placeholder="Title"
            />

            <textarea
              id={`input-edit-desc-${idea.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl glass-input px-4 py-2 text-sm text-white focus:outline-none placeholder-white/30 animate-fade-in"
              placeholder="Description"
            />

            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = editCategory === cat;
                const catColors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other'];
                return (
                  <button
                    key={cat}
                    type="button"
                    id={`btn-select-edit-cat-${cat}-${idea.id}`}
                    onClick={() => setEditCategory(cat)}
                    className={`px-2 py-1.5 text-[10px] rounded-lg border backdrop-blur-sm transition-all duration-300 cursor-pointer text-center ${
                      isSelected
                        ? catColors.editCategorySelected
                        : catColors.editCategoryInactive
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between h-full space-y-5">
          <div>
            {/* Header: Pinned Status & Edit/Delete Controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {idea.isPinned && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider uppercase ${colors.pinnedText}`}>
                    <Pin className="h-3 w-3 fill-current animate-pulse text-cyan-400" /> Pinned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <button
                  id={`btn-pin-${idea.id}`}
                  onClick={() => onUpdate(idea.id, { isPinned: !idea.isPinned })}
                  className={`h-9 w-9 md:h-7 md:w-7 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md border cursor-pointer hover:-translate-y-0.5 ${
                    idea.isPinned
                      ? colors.actionButtonActive
                      : colors.actionButtonHover
                  }`}
                  title={idea.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className={`h-4 w-4 md:h-3.5 md:w-3.5 ${idea.isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  id={`btn-edit-${idea.id}`}
                  onClick={() => setIsEditing(true)}
                  className={`h-9 w-9 md:h-7 md:w-7 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md border cursor-pointer hover:-translate-y-0.5 ${colors.actionButtonHover}`}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </button>

                <button
                  id={`btn-delete-${idea.id}`}
                  onClick={() => onDelete(idea.id)}
                  className="h-9 w-9 md:h-7 md:w-7 rounded-lg flex items-center justify-center transition-all duration-300 backdrop-blur-md border cursor-pointer bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:-translate-y-0.5"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-display text-base font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-cyan-200 transition-colors duration-300">
              {idea.title || 'Untitled'}
            </h3>

            {/* Description */}
            <p className="text-white/70 text-sm font-light leading-relaxed whitespace-pre-wrap line-clamp-4">
              {idea.description || 'No description provided.'}
            </p>

            {/* Category Pill BELOW Description */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md shadow-[0_2px_10px_rgba(6,182,212,0.05)] w-fit ${colors.pillBg}`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${colors.dotBg}`} />
                {idea.category}
              </span>
            </div>
          </div>

          {/* Footer Dates */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] text-[10px] text-white/40 font-mono">
            <span>{formatDate(idea.createdAt)}</span>
            {idea.updatedAt > idea.createdAt && (
              <span className="text-cyan-300/80" style={{ color: colors.accent }}>Edited</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
