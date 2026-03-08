const BASE_URL = ''; // proxy sayesinde bos birakabiliriz

export const apiClient = {
    async checkHealth() {
        const res = await fetch(`${BASE_URL}/api/health`);
        return res.json();
    },

    async getTools() {
        const res = await fetch(`${BASE_URL}/api/chat/tools`);
        return res.json();
    },

    async getAvailableModels() {
        const res = await fetch(`${BASE_URL}/api/models`);
        return res.json();
    },

    async getCurrentModel() {
        const res = await fetch(`${BASE_URL}/api/models/current`);
        return res.json();
    },

    async setModel(modelName) {
        const res = await fetch(`${BASE_URL}/api/models/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName }),
        });
        return res.json();
    },

    async pullModel(modelName, onProgress = null) {
        const res = await fetch(`${BASE_URL}/api/models/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(l => l.startsWith('data: '));

            for (const line of lines) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'error') throw new Error(data.error);
                    if (onProgress) onProgress(data);
                } catch (e) {
                    if (e.message === 'Pull failed') throw e;
                }
            }
        }
    },

    async deleteModel(modelName) {
        const res = await fetch(`${BASE_URL}/api/models/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName }),
        });
        return res.json();
    },

    async getBotMode() {
        const res = await fetch(`${BASE_URL}/api/bot/mode`);
        return res.json();
    },

    async setBotMode(mode) {
        const res = await fetch(`${BASE_URL}/api/bot/mode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }),
        });
        return res.json();
    },

    async getVulnerabilityMode() {
        const res = await fetch(`${BASE_URL}/api/vulnerability/mode`);
        return res.json();
    },

    async setVulnerabilityMode(vulnerabilityMode) {
        const res = await fetch(`${BASE_URL}/api/vulnerability/mode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vulnerabilityMode }),
        });
        return res.json();
    },

};