import React, { useEffect, useState, useCallback } from 'react';
import {
    Grid,
    GridItem,
    useToast,
    useDisclosure,
    Flex,
    Button,
    Box,
    useColorModeValue,
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { DespachosTable } from '../components/Despachos/DespachosTable';
import { DespachoModal } from '../components/Despachos/DespachoModal';
import { FiltrosDespacho } from '../components/Despachos/FiltrosDespacho';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { despachosApi, type Despacho, type CreateDespachoDto } from '~/services/api';
import { BackBar } from '~/components/Layout/BackBar';

interface FilterParams {
    search?: string;
    tipo?: string;
    estado?: string;
}

const DespachosPage: React.FC = () => {
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<FilterParams>({});
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        despacho: Despacho | null;
        action: 'delete' | 'activate' | null;
    }>({
        isOpen: false,
        despacho: null,
        action: null,
    });

    const toast = useToast();
    const bgColor = useColorModeValue('gray.50', 'gray.900');

    const {
        isOpen: isModalOpen,
        onOpen: onModalOpen,
        onClose: onModalClose,
    } = useDisclosure();

    const fetchDespachos = useCallback(
        async (page: number, filterParams: FilterParams = {}) => {
            try {
                setIsLoading(true);
                const result = await despachosApi.list({
                    page,
                    limit: 10,
                    ...filterParams,
                });

                if (result.success && result.data) {
                    setDespachos(result.data.despachos);
                    setTotalPages(result.meta?.totalPages ?? 1);
                }
            } catch (error) {
                console.error('Error al cargar despachos:', error);
                const message = error instanceof Error ? error.message : 'Error desconocido';
                toast({
                    title: 'Error al cargar despachos',
                    description: message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        },
        [toast]
    );

    useEffect(() => {
        void fetchDespachos(currentPage, filters);
    }, [currentPage, filters, fetchDespachos]);

    const handleFilter = useCallback((filterParams: FilterParams) => {
        setFilters(filterParams);
        setCurrentPage(1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({});
        setCurrentPage(1);
    }, []);

    const handleCreate = useCallback(() => {
        setSelectedDespacho(null);
        onModalOpen();
    }, [onModalOpen]);

    const handleEdit = useCallback(
        (despacho: Despacho) => {
            setSelectedDespacho(despacho);
            onModalOpen();
        },
        [onModalOpen]
    );

    const handleDelete = useCallback(
        (despacho: Despacho) => {
            setConfirmDialog({
                isOpen: true,
                despacho,
                action: 'delete',
            });
        },
        []
    );

    const handleActivate = useCallback(
        (despacho: Despacho) => {
            setConfirmDialog({
                isOpen: true,
                despacho,
                action: 'activate',
            });
        },
        []
    );

    const handleConfirmAction = useCallback(async () => {
        if (!confirmDialog.despacho || !confirmDialog.action) return;

        const { despacho, action } = confirmDialog;
        const isDelete = action === 'delete';

        try {
            if (isDelete) {
                await despachosApi.delete(despacho._id);
                toast({
                    title: 'Despacho desactivado',
                    description: `${despacho.nombre} ha sido desactivado`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                await despachosApi.update(despacho._id, { estado: 'ACTIVO' });
                toast({
                    title: 'Despacho activado',
                    description: `${despacho.nombre} ha sido activado`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
            void fetchDespachos(currentPage, filters);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast({
                title: `Error al ${isDelete ? 'desactivar' : 'activar'}`,
                description: message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setConfirmDialog({ isOpen: false, despacho: null, action: null });
        }
    }, [confirmDialog, currentPage, filters, fetchDespachos, toast]);

    const handleCloseConfirm = useCallback(() => {
        setConfirmDialog({ isOpen: false, despacho: null, action: null });
    }, []);

    const handleSubmit = useCallback(
        async (data: CreateDespachoDto | Partial<CreateDespachoDto>) => {
            try {
                if (selectedDespacho) {
                    await despachosApi.update(selectedDespacho._id, data as Partial<CreateDespachoDto>);
                    toast({ title: 'Despacho actualizado', status: 'success', duration: 2000 });
                } else {
                    await despachosApi.create(data as CreateDespachoDto);
                    toast({ title: 'Despacho creado', status: 'success', duration: 2000 });
                }
                onModalClose();
                setSelectedDespacho(null);
                void fetchDespachos(currentPage, filters);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                toast({ title: message, status: 'error', duration: 2500 });
                throw error;
            }
        },
        [selectedDespacho, currentPage, filters, fetchDespachos, toast, onModalClose]
    );

    return (
        <Box minH="100vh" bg={bgColor}>
            <Box maxW="1600px" mx="auto" p={8}>
                <BackBar title="Despachos" />
                {/* Header: solo botón (el título ya está en BackBar) */}
                <Flex justify="flex-end" align="center" mb={8}>
                    <Button
                        leftIcon={<FaPlus />}
                        colorScheme="blue"
                        size="lg"
                        onClick={handleCreate}
                        borderRadius="xl"
                        shadow="md"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        transition="all 0.2s"
                    >
                        Nuevo Despacho
                    </Button>
                </Flex>

                {/* Layout: Filtros + Tabla */}
                <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                    <GridItem>
                        <FiltrosDespacho onFilter={handleFilter} onClear={handleClearFilters} />
                    </GridItem>

                    <GridItem minW={0}>
                        <DespachosTable
                            despachos={despachos}
                            isLoading={isLoading}
                            totalPages={totalPages}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onActivate={handleActivate}
                        />
                    </GridItem>
                </Grid>

                {/* Modal */}
                <DespachoModal
                    isOpen={isModalOpen}
                    onClose={onModalClose}
                    onSubmit={handleSubmit}
                    initial={selectedDespacho}
                />

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={handleCloseConfirm}
                    onConfirm={handleConfirmAction}
                    title={
                        confirmDialog.action === 'delete'
                            ? 'Desactivar Despacho'
                            : 'Activar Despacho'
                    }
                    message={
                        confirmDialog.action === 'delete'
                            ? `¿Estás seguro de que deseas desactivar el despacho "${confirmDialog.despacho?.nombre}"?`
                            : `¿Estás seguro de que deseas activar el despacho "${confirmDialog.despacho?.nombre}"?`
                    }
                    confirmText={
                        confirmDialog.action === 'delete' ? 'Desactivar' : 'Activar'
                    }
                    type={confirmDialog.action === 'delete' ? 'warning' : 'success'}
                />
            </Box>
        </Box>
    );
};

export default DespachosPage;

