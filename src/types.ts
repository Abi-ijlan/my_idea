/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  color: string; // Tailwind hex or class prefix for color accents
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  userId?: string;
}

export type IdeaCategory = 'Startup' | 'Creative' | 'Tech' | 'Concept' | 'Design' | 'Other';

export const CATEGORIES: IdeaCategory[] = ['Startup', 'Creative', 'Tech', 'Concept', 'Design', 'Other'];

export interface CategoryTheme {
  bg: string;
  text: string;
  border: string;
  accent: string;
  shadow: string;
}

export const CATEGORY_THEMES: Record<IdeaCategory, CategoryTheme> = {
  Startup: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
    border: 'border-indigo-500/20',
    accent: 'bg-indigo-400',
    shadow: 'shadow-indigo-500/10',
  },
  Creative: {
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-500/20',
    accent: 'bg-fuchsia-400',
    shadow: 'shadow-fuchsia-500/10',
  },
  Tech: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-300',
    border: 'border-violet-500/20',
    accent: 'bg-violet-400',
    shadow: 'shadow-violet-500/10',
  },
  Concept: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-300',
    border: 'border-pink-500/20',
    accent: 'bg-pink-400',
    shadow: 'shadow-pink-500/10',
  },
  Design: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/20',
    accent: 'bg-purple-400',
    shadow: 'shadow-purple-500/10',
  },
  Other: {
    bg: 'bg-slate-500/10',
    text: 'text-purple-200/70',
    border: 'border-purple-500/15',
    accent: 'bg-purple-300/60',
    shadow: 'shadow-purple-500/5',
  },
};
