import { Idea } from '../types';

type IdeaPayload = Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
};

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = 'Cloud storage request failed.';
    try {
      const data = await response.json();
      if (typeof data?.error === 'string') {
        message = data.error;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json();
};

export async function loadIdeas(userId: string): Promise<Idea[]> {
  const data = await requestJson<unknown>(`/api/ideas?userId=${encodeURIComponent(userId)}`);
  if (!Array.isArray(data)) {
    throw new Error('Cloud storage returned an invalid ideas list.');
  }

  return data;
}

export async function createIdea(idea: IdeaPayload): Promise<Idea> {
  return requestJson<Idea>('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(idea),
  });
}

export async function updateIdea(id: string, updatedFields: Partial<Idea>, userId: string): Promise<Idea> {
  return requestJson<Idea>(`/api/ideas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updatedFields, userId }),
  });
}

export async function deleteIdea(id: string, userId: string): Promise<void> {
  await requestJson<{ success: boolean }>(`/api/ideas/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function clearIdeas(userId: string): Promise<void> {
  await requestJson<{ success: boolean }>(`/api/ideas?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
