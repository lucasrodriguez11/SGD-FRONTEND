// src/pages/expedientes.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { ExpedientesTable } from '../components/Expedientes/ExpedientesTable';
import { ExpedienteDrawer } from '../components/Expedientes/ExpedienteDrawer';
import { FiltrosExpediente } from '../components/Filtros/FiltrosExpediente';
import { type Expediente, type Movimiento } from 'src/types';
import axios from "axios"

const ExpedientesPage: React.FC = () => {
  // Estados

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});
  
  const toast = useToast();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  const fetchExpedientes = async (page: number, filterParams = {}) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...filterParams
      });
  
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}expediente/listar?${queryParams}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      setExpedientes(data.expedientes);
      setTotalPages(data.totalPaginas);
    } catch (error) {
      console.error("Error al cargar expedientes:", error);
      toast({
        title: "Error al cargar expedientes",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewExpediente = async (expediente: Expediente) => {
    setSelectedExpediente(expediente);
    await fetchMovimientos(expediente._id); // Espera a que se carguen los movimientos
    onDrawerOpen(); // Abre el drawer después de cargar movimientos
  };
  
  const handleViewHistory = async (expediente: Expediente) => {
    setSelectedExpediente(expediente);
    await fetchMovimientos(expediente._id); // Espera a que se carguen los movimientos
    onDrawerOpen(); // Abre el drawer después de cargar movimientos
  };
  
  const fetchMovimientos = async (expedienteId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}movimiento/${expedienteId}/historial`
      );
      const data = response.data.movimientos || [];
      
      // Ordena los movimientos por fecha (descendente)
      data.sort((a, b) => new Date(b.fechaMovimiento) - new Date(a.fechaMovimiento));
      
      setMovimientos(data);
    } catch (error) {
      toast({
        title: "Error al cargar movimientos",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchExpedientes(currentPage, filters);
  }, [currentPage, filters]);


  const handleFilter = (filterParams: any) => {
    setFilters(filterParams);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

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

      <GridItem  p={20}>
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