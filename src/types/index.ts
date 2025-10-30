// src/types/index.ts

// Interfaz para Expediente
export interface Expediente {
    _id: string;
    numeroExpediente: string;
    iniciador: string;
    tema: string;
    prioridad: 'Baja' | 'Normal' | 'Alta';
    extracto?: string;
    fojas: number;
    despachoActual: string;
    fechaIngreso: Date;
    estado: 'RECEPCIONADO' | 'ENVIADO';
  }
  
  // Interfaz para Movimiento
  export interface Movimiento {
    expedienteId: string;
    despachoAnterior: string;
    despachoNuevo: string;
    fechaMovimiento: Date;
    fojasAgregadas: number;
    estado: 'RECEPCIONADO' | 'ENVIADO';
  }
  
  // Interfaz para Filtros
  export interface FiltrosExpediente {
    numeroExpediente?: string;
    prioridad?: string;
    tema?: string;
    iniciador?: string;
  }