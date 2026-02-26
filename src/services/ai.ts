import { supabase } from '../lib/supabase';

export interface ChatResponse {
    response: string;
}

const API_BASE_URL = 'http://127.0.0.1:3002';

async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`
    };
}

export const aiService = {
    async chat(message: string, model: string): Promise<ChatResponse | null> {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message, model })
            });

            if (response.ok) {
                return await response.json();
            }
            const err = await response.json().catch(() => ({}));
            console.error('AI chat error:', response.status, err);
            return null;
        } catch (error) {
            console.error('Failed to connect to local backend:', error);
            return null;
        }
    },

    async getModels(): Promise<string[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/models`);
            if (response.ok) {
                const data = await response.json();
                return data.models ?? [];
            }
        } catch (_) { }
        return [];
    },

    async getStatus(): Promise<'running' | 'offline'> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/status`);
            if (response.ok) {
                const data = await response.json();
                return data.ollama === 'running' ? 'running' : 'offline';
            }
        } catch (_) { }
        return 'offline';
    }
};
