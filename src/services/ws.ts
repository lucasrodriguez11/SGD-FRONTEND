import { env } from '~/env';

function computeWsUrl(channel: string): string {
    const base = env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000/api';
    try {
        const api = new URL(base);
        // Remove trailing /api if present
        const host = api.host;
        const wsProtocol = api.protocol === 'https:' ? 'wss' : 'ws';
        return `${wsProtocol}://${host}/ws?channel=${channel}`;
    } catch {
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = typeof window !== 'undefined' ? window.location.host : '';
        return `${protocol}://${host}/ws?channel=${channel}`;
    }
}
export type NotificationWS = {
    id?: string;
    type: string;
    message: string;
    expedienteId?: string;
    orgTargetId?: string;
    numeroExpediente?: string;
    despachoActual?: string;
    createdAt?: string;
};

export function connectNotifications(onMessage: (n: NotificationWS) => void, despachoId?: string) {
    const channel = despachoId ? `notifications:${despachoId}` : 'notifications';
    const url = computeWsUrl(channel);
    const ws = new WebSocket(url);
    ws.onmessage = (ev: MessageEvent<string>) => {
        try {
            const raw = ev.data;
            const parsed: unknown = JSON.parse(raw);
            const obj = parsed as Partial<NotificationWS>;
            if (obj?.type) onMessage(obj as NotificationWS);
        } catch {
            // ignore malformed messages
        }
    };
    return ws;
}

export type InboxWS = { toDespachoId: string; fromDespachoId: string; text: string; createdAt?: string };

export function connectInbox(onMessage: (m: InboxWS) => void) {
    const url = computeWsUrl('inbox');
    const ws = new WebSocket(url);
    ws.onmessage = (ev: MessageEvent<string>) => {
        try {
            const obj = JSON.parse(ev.data) as InboxWS;
            if (obj?.text) onMessage(obj);
        } catch {
            // ignore
        }
    };
    return ws;
}


