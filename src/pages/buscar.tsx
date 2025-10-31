import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, Tab, TabList, TabPanel, TabPanels, Tabs, Grid, GridItem, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { despachosApi, expedientesApi, movimientosApi, type Despacho, type Expediente, type Movimiento } from '~/services/api';
import { useRouter } from 'next/router';
import { BackBar } from '~/components/Layout/BackBar';
import { DespachosTable } from '~/components/Despachos/DespachosTable';
import { FiltrosDespacho } from '~/components/Despachos/FiltrosDespacho';
import { ExpedientesTable } from '~/components/Expedientes/ExpedientesTable';
import { FiltrosExpediente } from '~/components/Expedientes/FiltrosExpediente';
import { ExpedienteDrawer } from '~/components/Expedientes/ExpedienteDrawer';

const BuscarPage: React.FC = () => {
    const router = useRouter();
    const bgColor = useColorModeValue('gray.50', 'gray.900');

    // Despachos state
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [isLoadingDespachos, setIsLoadingDespachos] = useState(true);
    const [currentPageDespachos, setCurrentPageDespachos] = useState(1);
    const [totalPagesDespachos, setTotalPagesDespachos] = useState(1);
    const [filtersDespachos, setFiltersDespachos] = useState<{ search?: string; tipo?: string; estado?: string }>({});

    // Expedientes state
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [isLoadingExpedientes, setIsLoadingExpedientes] = useState(true);
    const [currentPageExpedientes, setCurrentPageExpedientes] = useState(1);
    const [totalPagesExpedientes, setTotalPagesExpedientes] = useState(1);
    const [filtersExpedientes, setFiltersExpedientes] = useState<{
        numeroExpediente?: string;
        prioridad?: string;
        tema?: string;
        estado?: string;
        despachoActual?: string;
    }>({});
    const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

    const fetchDespachos = useCallback(async (page: number, filterParams: typeof filtersDespachos = {}) => {
        try {
            setIsLoadingDespachos(true);
            const result = await despachosApi.list({ page, limit: 10, ...filterParams });
            if (result.success && result.data) {
                setDespachos(result.data.despachos);
                setTotalPagesDespachos(result.meta?.totalPages ?? 1);
            }
        } catch {
            setDespachos([]);
        } finally {
            setIsLoadingDespachos(false);
        }
    }, []);

    const fetchExpedientes = useCallback(async (page: number, filterParams: typeof filtersExpedientes = {}) => {
        try {
            setIsLoadingExpedientes(true);
            const result = await expedientesApi.list({ page, limit: 10, ...filterParams });
            if (result.success && result.data) {
                setExpedientes(result.data.expedientes);
                setTotalPagesExpedientes(result.meta?.totalPages ?? 1);
            }
        } catch {
            setExpedientes([]);
        } finally {
            setIsLoadingExpedientes(false);
        }
    }, []);

    useEffect(() => {
        void fetchDespachos(currentPageDespachos, filtersDespachos);
    }, [currentPageDespachos, filtersDespachos, fetchDespachos]);

    useEffect(() => {
        void fetchExpedientes(currentPageExpedientes, filtersExpedientes);
    }, [currentPageExpedientes, filtersExpedientes, fetchExpedientes]);

    const handleFilterDespachos = useCallback((filterParams: typeof filtersDespachos) => {
        setFiltersDespachos(filterParams);
        setCurrentPageDespachos(1);
    }, []);

    const handleFilterExpedientes = useCallback((filterParams: typeof filtersExpedientes) => {
        setFiltersExpedientes(filterParams);
        setCurrentPageExpedientes(1);
    }, []);

    const fetchMovimientos = useCallback(async (expedienteId: string) => {
        try {
            const result = await movimientosApi.getHistory(expedienteId);
            if (result.success && result.data) {
                const data = result.data.movimientos ?? [];
                setMovimientos(data);
            }
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
        }
    }, []);

    const handleViewExpediente = useCallback(async (expediente: Expediente) => {
        setSelectedExpediente(expediente);
        await fetchMovimientos(expediente._id);
        onDrawerOpen();
    }, [fetchMovimientos, onDrawerOpen]);


    return (
        <Box minH="100vh" bg={bgColor}>
            <Container maxW="1600px" px={{ base: 4, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
                <BackBar title="Explorar" />

                <Tabs variant="enclosed" colorScheme="blue" mt={4}>
                    <TabList>
                        <Tab fontWeight="semibold">Despachos</Tab>
                        <Tab fontWeight="semibold">Expedientes</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0} pt={{ base: 4, md: 6 }}>
                            <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={{ base: 4, md: 6 }}>
                                <GridItem>
                                    <FiltrosDespacho onFilter={handleFilterDespachos} onClear={() => handleFilterDespachos({})} />
                                </GridItem>
                                <GridItem minW={0}>
                                    <DespachosTable
                                        despachos={despachos}
                                        isLoading={isLoadingDespachos}
                                        totalPages={totalPagesDespachos}
                                        currentPage={currentPageDespachos}
                                        onPageChange={setCurrentPageDespachos}
                                        onEdit={(d) => router.push(`/perfil?despachoId=${d._id}`)}
                                    />
                                </GridItem>
                            </Grid>
                        </TabPanel>

                        <TabPanel px={0} pt={{ base: 4, md: 6 }}>
                            <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={{ base: 4, md: 6 }}>
                                <GridItem>
                                    <FiltrosExpediente onFilter={handleFilterExpedientes} onClear={() => handleFilterExpedientes({})} />
                                </GridItem>
                                <GridItem minW={0}>
                                    <ExpedientesTable
                                        expedientes={expedientes}
                                        isLoading={isLoadingExpedientes}
                                        totalPages={totalPagesExpedientes}
                                        currentPage={currentPageExpedientes}
                                        onPageChange={setCurrentPageExpedientes}
                                        onViewExpediente={handleViewExpediente}
                                    />
                                </GridItem>
                            </Grid>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                <ExpedienteDrawer
                    isOpen={isDrawerOpen}
                    onClose={onDrawerClose}
                    expediente={selectedExpediente}
                    movimientos={movimientos}
                />
            </Container>
        </Box>
    );
};

export default BuscarPage;