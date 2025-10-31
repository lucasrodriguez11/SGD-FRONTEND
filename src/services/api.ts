/**
 * API Service - Centralized API calls for SGD Frontend
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { env } from '~/env';

// Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface Expediente {
    _id: string;
    numeroExpediente: string;
    iniciador: string;
    tema: string;
    prioridad: 'Baja' | 'Normal' | 'Alta';
    extracto?: string;
    fojas: number;
    despachoActual: string;
    fechaIngreso: string;
    fechaVencimiento?: string;
    estado: 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO';
}

export interface Movimiento {
    _id: string;
    expedienteId: string;
    despachoAnterior: string;
    despachoNuevo: string;
    fechaMovimiento: string;
    fojasAgregadas: number;
    estado: 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO';
    observaciones?: string;
    usuarioResponsable?: string;
}

export interface CreateExpedienteDto {
    numeroExpediente: string;
    iniciador: string;
    tema: string;
    prioridad: 'Baja' | 'Normal' | 'Alta';
    extracto?: string;
    fojas: number;
    despachoActual: string;
    fechaVencimiento?: string;
    estado?: 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO';
}

export interface CreateMovimientoDto {
    expedienteId: string;
    despachoNuevo: string;
    fojasAgregadas: number;
    estado: 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO';
    observaciones?: string;
    usuarioResponsable?: string;
}

export interface ListExpedientesParams {
    page?: number;
    limit?: number;
    numeroExpediente?: string;
    prioridad?: string;
    tema?: string;
    iniciador?: string;
    despachoActual?: string;
    estado?: string;
}

export interface ExpedienteStats {
    total: number;
    porPrioridad: Array<{ _id: string; count: number }>;
    porEstado: Array<{ _id: string; count: number }>;
    porTema: Array<{ _id: string; count: number }>;
}

export interface MovimientoStats {
    _id: string;
    total: number;
    fojasTotal: number;
}

export interface HealthStatus {
    status: string;
    uptime?: number;
    timestamp?: string;
    database?: {
        connected: boolean;
        name?: string;
    };
}

export interface Despacho {
    _id: string;
    nombre: string;
    codigo: string;
    tipo: 'DIRECCION' | 'SUBDIRECCIÓN' | 'AREA' | 'DEPARTAMENTO' | 'SECRETARIA';
    descripcion?: string;
    responsable?: string;
    email?: string;
    telefono?: string;
    estado: 'ACTIVO' | 'INACTIVO';
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDespachoDto {
    nombre: string;
    codigo: string;
    tipo: 'DIRECCION' | 'SUBDIRECCIÓN' | 'AREA' | 'DEPARTAMENTO' | 'SECRETARIA';
    descripcion?: string;
    responsable?: string;
    email?: string;
    telefono?: string;
    estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Tema { _id: string; nombre: string; activo: boolean }

// Axios instance
// Important: baseURL must end with / and routes must NOT start with /
const apiClient: AxiosInstance = axios.create({
    baseURL: `${env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:5000/api'}/`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Simple token storage helpers
export const authToken = {
    get: (): string | null => (typeof window !== 'undefined' ? localStorage.getItem('token') : null),
    set: (t: string): void => {
        if (typeof window !== 'undefined') localStorage.setItem('token', t);
    },
    clear: (): void => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
    },
};

export const authUser = {
    get: <T = Record<string, unknown>>(): T | null => {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem('user');
        return raw ? (JSON.parse(raw) as T) : null;
    },
    set: (u: unknown): void => {
        if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(u));
    },
    clear: (): void => {
        if (typeof window !== 'undefined') localStorage.removeItem('user');
    },
};

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = authToken.get();
        if (token) {
            config.headers = config.headers ?? {};
            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: Error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError<ApiResponse>) => {
        // Handle errors globally
        if (error.response) {
            const errorMessage =
                error.response.data?.error?.message ??
                error.message ??
                'Error en la solicitud';
            console.error('API Error:', errorMessage);
        } else if (error.request) {
            console.error('Network Error:', 'No se pudo conectar con el servidor');
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// EXPEDIENTES API
// ============================================================================

export const expedientesApi = {
    /**
     * Get list of expedientes with filters and pagination
     */
    list: async (
        params?: ListExpedientesParams
    ): Promise<ApiResponse<{ expedientes: Expediente[] }>> => {
        const response = await apiClient.get<
            ApiResponse<{ expedientes: Expediente[] }>
        >('expedientes', { params });
        return response.data;
    },

    /**
     * Get expediente by ID
     */
    getById: async (id: string): Promise<ApiResponse<{ expediente: Expediente }>> => {
        const response = await apiClient.get<ApiResponse<{ expediente: Expediente }>>(
            `expedientes/${id}`
        );
        return response.data;
    },

    /**
     * Get expediente by numero
     */
    getByNumero: async (
        numero: string
    ): Promise<ApiResponse<{ expediente: Expediente }>> => {
        const response = await apiClient.get<ApiResponse<{ expediente: Expediente }>>(
            `expedientes/numero/${numero}`
        );
        return response.data;
    },

    /**
     * Create new expediente
     */
    create: async (
        data: CreateExpedienteDto
    ): Promise<ApiResponse<{ expediente: Expediente }>> => {
        const response = await apiClient.post<ApiResponse<{ expediente: Expediente }>>(
            'expedientes',
            data
        );
        return response.data;
    },

    /**
     * Update expediente
     */
    update: async (
        id: string,
        data: Partial<CreateExpedienteDto>
    ): Promise<ApiResponse<{ expediente: Expediente }>> => {
        const response = await apiClient.put<ApiResponse<{ expediente: Expediente }>>(
            `expedientes/${id}`,
            data
        );
        return response.data;
    },

    /**
     * Archive expediente (soft delete)
     */
    archive: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await apiClient.delete<ApiResponse<{ message: string }>>(
            `expedientes/${id}`
        );
        return response.data;
    },

    /**
     * Get expedientes statistics
     */
    getStats: async (): Promise<ApiResponse<ExpedienteStats>> => {
        const response = await apiClient.get<ApiResponse<ExpedienteStats>>('expedientes/stats/all');
        return response.data;
    },

    /**
     * Get expedientes by despacho with optional estado filter
     */
    getByDespacho: async (
        despachoId: string,
        params?: { estado?: string; page?: number; limit?: number }
    ): Promise<ApiResponse<{ expedientes: Expediente[] }>> => {
        const response = await apiClient.get<ApiResponse<{ expedientes: Expediente[] }>>(
            `expedientes/despacho/${despachoId}`,
            { params }
        );
        return response.data;
    },
};

// ============================================================================
// MOVIMIENTOS API
// ============================================================================

export const movimientosApi = {
    /**
     * Register new movimiento
     */
    create: async (
        data: CreateMovimientoDto
    ): Promise<ApiResponse<{ movimiento: Movimiento; expediente: Expediente }>> => {
        const response = await apiClient.post<
            ApiResponse<{ movimiento: Movimiento; expediente: Expediente }>
        >('movimientos', data);
        return response.data;
    },

    /**
     * Get movement history for expediente
     */
    getHistory: async (
        expedienteId: string
    ): Promise<ApiResponse<{ movimientos: Movimiento[] }>> => {
        const response = await apiClient.get<ApiResponse<{ movimientos: Movimiento[] }>>(
            `movimientos/expediente/${expedienteId}/historial`
        );
        return response.data;
    },

    /**
     * Get latest movement for expediente
     */
    getLatest: async (
        expedienteId: string
    ): Promise<ApiResponse<{ movimiento: Movimiento }>> => {
        const response = await apiClient.get<ApiResponse<{ movimiento: Movimiento }>>(
            `movimientos/expediente/${expedienteId}/latest`
        );
        return response.data;
    },

    /**
     * Get movements by despacho
     */
    getByDespacho: async (
        despacho: string
    ): Promise<ApiResponse<{ movimientos: Movimiento[] }>> => {
        const response = await apiClient.get<ApiResponse<{ movimientos: Movimiento[] }>>(
            `movimientos/despacho/${encodeURIComponent(despacho)}`
        );
        return response.data;
    },

    /**
     * Get movements sent from despacho
     */
    getEnviadosByDespacho: async (
        despachoId: string,
        limit?: number
    ): Promise<ApiResponse<{ movimientos: Movimiento[] }>> => {
        const response = await apiClient.get<ApiResponse<{ movimientos: Movimiento[] }>>(
            `movimientos/despacho/${despachoId}/enviados`,
            { params: { limit } }
        );
        return response.data;
    },

    /**
     * Get movements received by despacho
     */
    getRecepcionadosByDespacho: async (
        despachoId: string,
        limit?: number
    ): Promise<ApiResponse<{ movimientos: Movimiento[] }>> => {
        const response = await apiClient.get<ApiResponse<{ movimientos: Movimiento[] }>>(
            `movimientos/despacho/${despachoId}/recepcionados`,
            { params: { limit } }
        );
        return response.data;
    },

    /**
     * Get movement statistics
     */
    getStats: async (
        despacho?: string
    ): Promise<ApiResponse<MovimientoStats[]>> => {
        const url = despacho
            ? `movimientos/stats/${encodeURIComponent(despacho)}`
            : 'movimientos/stats';
        const response = await apiClient.get<ApiResponse<MovimientoStats[]>>(url);
        return response.data;
    },
};

// ============================================================================
// DESPACHOS API
// ============================================================================

export const despachosApi = {
    /**
     * Get list of despachos with filters and pagination
     */
    list: async (params?: {
        page?: number;
        limit?: number;
        tipo?: string;
        estado?: string;
        search?: string;
    }): Promise<ApiResponse<{ despachos: Despacho[] }>> => {
        const response = await apiClient.get<ApiResponse<{ despachos: Despacho[] }>>(
            'despachos',
            { params }
        );
        return response.data;
    },

    /**
     * Get all active despachos
     */
    getActivos: async (): Promise<ApiResponse<{ despachos: Despacho[] }>> => {
        const response = await apiClient.get<ApiResponse<{ despachos: Despacho[] }>>(
            'despachos/activos'
        );
        return response.data;
    },

    /**
     * Get despacho by ID
     */
    getById: async (id: string): Promise<ApiResponse<{ despacho: Despacho }>> => {
        const response = await apiClient.get<ApiResponse<{ despacho: Despacho }>>(
            `despachos/${id}`
        );
        return response.data;
    },

    /**
     * Get despacho by codigo
     */
    getByCodigo: async (codigo: string): Promise<ApiResponse<{ despacho: Despacho }>> => {
        const response = await apiClient.get<ApiResponse<{ despacho: Despacho }>>(
            `despachos/codigo/${codigo}`
        );
        return response.data;
    },

    /**
     * Create new despacho
     */
    create: async (data: CreateDespachoDto): Promise<ApiResponse<{ despacho: Despacho }>> => {
        const response = await apiClient.post<ApiResponse<{ despacho: Despacho }>>(
            'despachos',
            data
        );
        return response.data;
    },

    /**
     * Update despacho
     */
    update: async (
        id: string,
        data: Partial<CreateDespachoDto>
    ): Promise<ApiResponse<{ despacho: Despacho }>> => {
        const response = await apiClient.put<ApiResponse<{ despacho: Despacho }>>(
            `despachos/${id}`,
            data
        );
        return response.data;
    },

    /**
     * Deactivate despacho
     */
    delete: async (id: string): Promise<ApiResponse<{ message: string; despacho: Despacho }>> => {
        const response = await apiClient.delete<
            ApiResponse<{ message: string; despacho: Despacho }>
        >(`despachos/${id}`);
        return response.data;
    },
};

// ============================================================================
// TEMAS API (catálogo dinámico)
// ====================================================================================

export const temasApi = {
    list: async (): Promise<ApiResponse<{ temas: Tema[] }>> => {
        const response = await apiClient.get<ApiResponse<{ temas: Tema[] }>>('temas');
        return response.data;
    },
    listAll: async (): Promise<ApiResponse<{ temas: Tema[] }>> => {
        const response = await apiClient.get<ApiResponse<{ temas: Tema[] }>>('temas', { params: { all: true } });
        return response.data;
    },
    create: async (nombre: string): Promise<ApiResponse<{ tema: Tema }>> => {
        const response = await apiClient.post<ApiResponse<{ tema: Tema }>>('temas', { nombre });
        return response.data;
    },
    update: async (id: string, data: { nombre?: string; activo?: boolean }): Promise<ApiResponse<{ tema: Tema }>> => {
        const response = await apiClient.put<ApiResponse<{ tema: Tema }>>(`temas/${id}`, data);
        return response.data;
    },
    remove: async (id: string): Promise<ApiResponse<{ tema: Tema }>> => {
        const response = await apiClient.delete<ApiResponse<{ tema: Tema }>>(`temas/${id}`);
        return response.data;
    },
};

// ============================================================================
// RECEPCIONES API
// ============================================================================

export interface Recepcion { _id: string; expedienteId: string; despachoOrigenId: string; despachoDestinoId: string; fechaEnvio: string; status: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' }

export const recepcionesApi = {
    pendingByDespacho: async (despachoDestinoId: string): Promise<ApiResponse<{ recepciones: Recepcion[] }>> => {
        const res = await apiClient.get<ApiResponse<{ recepciones: Recepcion[] }>>('recepciones/pending', { params: { despachoDestinoId } });
        return res.data;
    },
    confirm: async (id: string, userId: string): Promise<ApiResponse<{ recepcion: Recepcion }>> => {
        const res = await apiClient.patch<ApiResponse<{ recepcion: Recepcion }>>(`recepciones/${id}/confirm`, { userId });
        return res.data;
    },
};

// =========================================================================
// INBOX API (placeholder; maneja errores si backend aún no está)
// =========================================================================

export type InboxMessage = { _id?: string; fromDespachoId: string; toDespachoId: string; text: string; createdAt?: string };

export const inboxApi = {
    sendMessage: async (payload: { toDespachoId: string; text: string; fromDespachoId?: string }): Promise<ApiResponse<{ message: InboxMessage }>> => {
        const res = await apiClient.post<ApiResponse<{ message: InboxMessage }>>('inbox/messages', payload);
        return res.data;
    },
    listMessages: async (params?: { toDespachoId?: string; fromDespachoId?: string; limit?: number }): Promise<ApiResponse<{ messages: InboxMessage[] }>> => {
        const res = await apiClient.get<ApiResponse<{ messages: InboxMessage[] }>>('inbox/messages', { params });
        return res.data;
    },
    listThreads: async (): Promise<ApiResponse<{ threads: Array<{ peerId: string; lastMessage: InboxMessage; unread: number }> }>> => {
        const res = await apiClient.get<ApiResponse<{ threads: Array<{ peerId: string; lastMessage: InboxMessage; unread: number }> }>>('inbox/threads');
        return res.data;
    },
    listConversation: async (peerId: string, limit = 100): Promise<ApiResponse<{ messages: InboxMessage[] }>> => {
        const res = await apiClient.get<ApiResponse<{ messages: InboxMessage[] }>>(`inbox/messages/conversation/${peerId}`, { params: { limit } });
        return res.data;
    },
    readThread: async (peerId: string): Promise<ApiResponse<{ ok: boolean }>> => {
        const res = await apiClient.post<ApiResponse<{ ok: boolean }>>(`inbox/threads/${peerId}/read`, {});
        return res.data;
    },
};

// =========================================================================
// NOTIFICATIONS API
// =========================================================================

export type NotificationDTO = { _id: string; type: string; message: string; createdAt: string; orgTargetId?: string; readAt?: string };

export const notificationsApi = {
    list: async (params?: { limit?: number }): Promise<ApiResponse<{ notifications: NotificationDTO[] }>> => {
        try {
            const res = await apiClient.get<ApiResponse<{ notifications: NotificationDTO[] }>>('notifications', { params });
            return res.data;
        } catch {
            return { success: true, data: { notifications: [] } } as ApiResponse<{ notifications: NotificationDTO[] }>;
        }
    },
    markRead: async (id: string): Promise<ApiResponse<{ notification: NotificationDTO }>> => {
        const res = await apiClient.put<ApiResponse<{ notification: NotificationDTO }>>(`notifications/${id}/read`, {});
        return res.data;
    },
};

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    despachoId?: string;
}

export interface AuthLoginResult {
    token: string;
    user: AuthUser;
}

export interface RegisterEntityPayload {
    user: { name: string; email: string; password: string };
    despacho: {
        nombre: string;
        codigo: string;
        tipo: 'DIRECCION' | 'SUBDIRECCIÓN' | 'AREA' | 'DEPARTAMENTO' | 'SECRETARIA';
        descripcion?: string;
        responsable?: string;
        email?: string;
        telefono?: string;
    };
    parentId?: string | null;
}

export const authApi = {
    login: async (payload: LoginPayload): Promise<ApiResponse<AuthLoginResult>> => {
        const res = await apiClient.post<ApiResponse<AuthLoginResult>>('auth/login', payload);
        return res.data;
    },
    registerWithCode: async (
        data: { name: string; email: string; password: string; codigo: string }
    ): Promise<ApiResponse<AuthLoginResult>> => {
        const res = await apiClient.post<ApiResponse<AuthLoginResult>>('auth/register-with-code', data);
        return res.data;
    },
    registerEntity: async (
        payload: RegisterEntityPayload
    ): Promise<ApiResponse<AuthLoginResult>> => {
        const res = await apiClient.post<ApiResponse<AuthLoginResult>>(
            'auth/register-entity',
            payload
        );
        return res.data;
    },
};

// ============================================================================
// USERS API (admin)
// ============================================================================

export type UserDTO = { _id: string; name: string; email: string; role: 'ADMIN' | 'USER'; despachoId?: string };
export const usersApi = {
    create: async (
        data: { name: string; email: string; password: string; despachoId?: string; role?: 'ADMIN' | 'USER' }
    ): Promise<ApiResponse<{ user: UserDTO }>> => {
        const res = await apiClient.post<ApiResponse<{ user: UserDTO }>>('users', data);
        return res.data;
    },
    changeRole: async (id: string, role: 'ADMIN' | 'USER'): Promise<ApiResponse<{ user: UserDTO }>> => {
        const res = await apiClient.patch<ApiResponse<{ user: UserDTO }>>(`users/${id}/role`, { role });
        return res.data;
    },
    meUpdate: async (payload: { name?: string; email?: string }): Promise<ApiResponse<{ user: UserDTO }>> => {
        const res = await apiClient.put<ApiResponse<{ user: UserDTO }>>('users/me', payload);
        return res.data;
    },
    changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ ok: boolean }>> => {
        const res = await apiClient.post<ApiResponse<{ ok: boolean }>>('users/me/password', payload);
        return res.data;
    },
    getUsersByDespacho: async (despachoId: string): Promise<ApiResponse<{ users: UserDTO[] }>> => {
        const res = await apiClient.get<ApiResponse<{ users: UserDTO[] }>>(`users/by-despacho/${despachoId}`);
        return res.data;
    },
    update: async (id: string, payload: { name?: string; email?: string; role?: 'ADMIN' | 'USER'; despachoId?: string | null }): Promise<ApiResponse<{ user: UserDTO }>> => {
        const res = await apiClient.put<ApiResponse<{ user: UserDTO }>>(`users/${id}`, payload);
        return res.data;
    },
    resetPassword: async (id: string, newPassword: string): Promise<ApiResponse<{ ok: boolean }>> => {
        const res = await apiClient.post<ApiResponse<{ ok: boolean }>>(`users/${id}/password`, { newPassword });
        return res.data;
    },
    delete: async (id: string): Promise<ApiResponse<{ ok: boolean }>> => {
        const res = await apiClient.delete<ApiResponse<{ ok: boolean }>>(`users/${id}`);
        return res.data;
    },
};

// ============================================================================
// HEALTH CHECK API
// ============================================================================

export const healthApi = {
    /**
     * Basic health check
     */
    check: async (): Promise<ApiResponse<HealthStatus>> => {
        const response = await apiClient.get<ApiResponse<HealthStatus>>('health');
        return response.data;
    },

    /**
     * Readiness check (includes DB)
     */
    ready: async (): Promise<ApiResponse<HealthStatus>> => {
        const response = await apiClient.get<ApiResponse<HealthStatus>>('health/ready');
        return response.data;
    },

    /**
     * Liveness check
     */
    live: async (): Promise<ApiResponse<HealthStatus>> => {
        const response = await apiClient.get<ApiResponse<HealthStatus>>('health/live');
        return response.data;
    },
};

// Export default client
export default apiClient;

