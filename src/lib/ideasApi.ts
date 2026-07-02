import { Idea } from '../types';

const getStorageKey = (userId: string) => `idea_vault_items_${userId}`;

const loadLocalIdeas = (userId: string): Idea[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load local ideas:', error);
    return [];
  }
};

const saveLocalIdeas = (userId: string, ideas: Idea[]) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(ideas));
  } catch (error) {
    console.error('Failed to save local ideas:', error);
  }
};

export async function loadIdeas(userId: string): Promise<Idea[]> {
  try {
    const response = await fetch(`/api/ideas?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error('Backend not available');
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.warn('Falling back to local storage for ideas:', error);
  }

  return loadLocalIdeas(userId);
}

export async function createIdea(idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number }): Promise<Idea> {
  try {
    const response = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    });

    if (!response.ok) {
      throw new Error('Failed to save idea');
    }

    return await response.json();
  } catch (error) {
    console.warn('Falling back to local storage for create:', error);
    const fallbackIdea: Idea = {
      id: idea.id || `idea-${Math.random().toString(36).slice(2, 11)}`,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      color: idea.color || 'cyan',
      createdAt: idea.createdAt || Date.now(),
      updatedAt: idea.updatedAt || Date.now(),
      isPinned: idea.isPinned || false,
      userId: idea.userId,
    };

    const existing = loadLocalIdeas(idea.userId || 'local-user');
    saveLocalIdeas(idea.userId || 'local-user', [fallbackIdea, ...existing]);
    return fallbackIdea;
  }
}

export async function updateIdea(id: string, updatedFields: Partial<Idea>, userId: string): Promise<Idea | null> {
  try {
    const response = await fetch(`/api/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedFields, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update idea');
    }

    return await response.json();
  } catch (error) {
    console.warn('Falling back to local storage for update:', error);
    const existing = loadLocalIdeas(userId);
    const updated = existing.map((idea) => (idea.id === id ? { ...idea, ...updatedFields, updatedAt: Date.now() } : idea));
    saveLocalIdeas(userId, updated);
    return updated.find((idea) => idea.id === id) || null;
  }
}

export async function deleteIdea(id: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/ideas/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete idea');
    }
  } catch (error) {
    console.warn('Falling back to local storage for delete:', error);
    const existing = loadLocalIdeas(userId);
    saveLocalIdeas(userId, existing.filter((idea) => idea.id !== id));
  }
}

export async function clearIdeas(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/ideas?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear ideas');
    }
  } catch (error) {
    console.warn('Falling back to local storage for clear:', error);
    localStorage.removeItem(getStorageKey(userId));
  }
}
