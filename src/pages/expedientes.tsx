// src/pages/expedientes.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Grid,
  GridItem,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { ExpedientesTable } from '../components/Expedientes/ExpedientesTable';
import { ExpedienteDrawer } from '../components/Expedientes/ExpedienteDrawer';
import { FiltrosExpediente } from '../components/Expedientes/FiltrosExpediente';
import { expedientesApi, movimientosApi, type Expediente, type Movimiento } from '~/services/api';

interface FilterParams {
  numeroExpediente?: string;
  iniciador?: string;
  tema?: string;
  prioridad?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

const ExpedientesPage: React.FC = () => {
  // Estados
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterParams>({});

  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  const fetchExpedientes = useCallback(async (page: number, filterParams = {}) => {
    try {
      setIsLoading(true);
      const result = await expedientesApi.list({
        page,
        ...filterParams
      });

      if (result.success && result.data) {
        setExpedientes(result.data.expedientes);
        setTotalPages(result.meta?.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error al cargar expedientes:", error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al cargar expedientes",
        description: message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchMovimientos = useCallback(async (expedienteId: string) => {
    try {
      const result = await movimientosApi.getHistory(expedienteId);
      if (result.success && result.data) {
        const data = result.data.movimientos ?? [];
        setMovimientos(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al cargar movimientos",
        description: message,
        status: "error",
        duration: 3000,
      });
    }
  }, [toast]);

  const handleViewExpediente = useCallback(async (expediente: Expediente) => {
    setSelectedExpediente(expediente);
    await fetchMovimientos(expediente._id);
    onDrawerOpen();
  }, [fetchMovimientos, onDrawerOpen]);

  const handleViewHistory = useCallback(async (expediente: Expediente) => {
    setSelectedExpediente(expediente);
    await fetchMovimientos(expediente._id);
    onDrawerOpen();
  }, [fetchMovimientos, onDrawerOpen]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    void fetchExpedientes(currentPage, filters);
  }, [currentPage, filters, fetchExpedientes]);


  const handleFilter = useCallback((filterParams: FilterParams) => {
    setFilters(filterParams);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "350px 1fr" }}
      gap={4}
      p={4}
    >
      <GridItem>
        <FiltrosExpediente
          onFilter={handleFilter}
          onClear={handleClearFilters}
        />
      </GridItem>

      <GridItem minW={0} p={{ base: 0, md: 2 }}>
        <ExpedientesTable
          expedientes={expedientes}
          isLoading={isLoading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onViewExpediente={handleViewExpediente}
          onViewHistory={handleViewHistory}
        />
      </GridItem>

      <ExpedienteDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        expediente={selectedExpediente}
        movimientos={movimientos}
      />
    </Grid>
  );
};

export default ExpedientesPage;