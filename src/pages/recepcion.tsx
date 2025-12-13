import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Heading, Table, Tbody, Td, Th, Thead, Tr, useToast, Grid, GridItem, Input, SimpleGrid, Badge, useColorModeValue, Flex, Text, Spinner, HStack, useDisclosure } from '@chakra-ui/react';
import { BackBar } from '~/components/Layout/BackBar';
import { recepcionesApi, authToken } from '~/services/api';
import { jwtDecode } from 'jwt-decode';
import { connectNotifications, type NotificationWS } from '~/services/ws';
import { X } from 'lucide-react';
import { RejectionModal } from '~/components/Expedientes/RejectionModal';

type TokenPayload = { sub: string; role: 'ADMIN' | 'USER'; despachoId?: string; desp?: string };

const RecepcionPage: React.FC = () => {
    const toast = useToast();
    const [rows, setRows] = useState<Array<{ _id: string; expedienteId: string; despachoOrigenId: string; despachoDestinoId: string; fechaEnvio: string | Date; status?: string }>>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const token = authToken.get();
    const payload = useMemo(() => (token ? jwtDecode<TokenPayload>(token) : null), [token]);
    // Extract despachoId from 'desp' (as seen in logs) or 'despachoId'
    const despachoDestinoId = payload?.desp ?? payload?.despachoId ?? '';

    const fetchPending = useCallback(async () => {
        if (!despachoDestinoId) return;
        setLoading(true);
        try {
            const res = await recepcionesApi.pendingByDespacho(despachoDestinoId);
            if (res.success && res.data) {
                const recepciones = res.data.recepciones || [];
                setRows(recepciones);
            } else {
                setRows([]);
            }
        } catch {
            toast({ title: 'Error al cargar recepciones', status: 'error', duration: 2000 });
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [despachoDestinoId, toast]);

    // Ejecutar fetchPending cuando despachoDestinoId esté disponible
    useEffect(() => {
        if (despachoDestinoId) {
            void fetchPending();
        }
    }, [despachoDestinoId, fetchPending]);

    // WebSocket para refrescar cuando llegue una notificación de EXPEDIENTE_RECIBIDO
    useEffect(() => {
        if (!despachoDestinoId) return;

        const ws = connectNotifications((n: NotificationWS) => {
            if (n.type === 'EXPEDIENTE_RECIBIDO') {
                toast({
                    title: 'Nuevo expediente recibido',
                    description: n.message || 'Tienes un nuevo expediente pendiente de recepción.',
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                    position: 'top-right'
                });
                setTimeout(() => {
                    void fetchPending();
                }, 500);
            }
        }, despachoDestinoId);

        return () => ws.close();
    }, [despachoDestinoId, fetchPending, toast]);

    const confirm = async (id: string) => {
        try {
            const res = await recepcionesApi.confirm(id, payload?.sub ?? '');
            if (res.success) {
                toast({ title: 'Recepción confirmada', status: 'success', duration: 2000 });
                void fetchPending();
            }
        } catch {
            toast({ title: 'Error al confirmar', status: 'error', duration: 2500 });
        }
    };

    const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
    const [rejectId, setRejectId] = useState<string | null>(null);

    const handleRejectClick = (id: string) => {
        setRejectId(id);
        onRejectOpen();
    };

    const handleConfirmReject = async () => {
        if (!rejectId) return;
        try {
            const res = await recepcionesApi.reject(rejectId);
            if (res.success) {
                toast({ title: 'Recepción rechazada', status: 'info', duration: 2000 });
                void fetchPending();
                onRejectClose();
            }
        } catch {
            toast({ title: 'Error al rechazar', status: 'error', duration: 2500 });
        }
    };

    const cardBg = useColorModeValue('white', 'gray.900');
    const border = useColorModeValue('gray.200', 'gray.700');

    return (
        <Container maxW="container.xl" py={8}>
            <BackBar title="Recepciones" />

            <Grid templateColumns={{ base: '1fr', lg: '320px 1fr' }} gap={6}>
                <GridItem>
                    <Box p={4} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={border}>
                        <Heading size="sm" mb={3}>Filtros</Heading>
                        <SimpleGrid columns={1} spacing={3}>
                            <Input placeholder="Buscar por expediente u origen" value={search} onChange={(e) => setSearch(e.target.value)} />
                            <Button onClick={() => void fetchPending()} colorScheme="blue">Actualizar</Button>
                        </SimpleGrid>
                    </Box>
                </GridItem>

                <GridItem minW={0}>
                    <Box p={0} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={border} overflowX="auto">
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>N° Expediente</Th>
                                    <Th>Origen</Th>
                                    <Th>Fecha envío</Th>
                                    <Th textAlign="right">Acciones</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {loading ? (
                                    <Tr><Td colSpan={4}><Flex justify="center" py={6}><Spinner /></Flex></Td></Tr>
                                ) : rows.length === 0 ? (
                                    <Tr><Td colSpan={4}><Flex justify="center" py={6}><Text color="gray.500">No hay recepciones pendientes</Text></Flex></Td></Tr>
                                ) : (
                                    rows
                                        .filter(r => {
                                            if (!search.trim()) return true;
                                            const searchLower = search.toLowerCase();
                                            return String(r.expedienteId).toLowerCase().includes(searchLower) ||
                                                String(r.despachoOrigenId).toLowerCase().includes(searchLower);
                                        })
                                        .map(r => (
                                            <Tr key={r._id}>
                                                <Td>
                                                    <Flex direction="column">
                                                        <Text fontWeight="medium">{r.expedienteId}</Text>
                                                        <Badge mt={1} colorScheme="blue">Pendiente</Badge>
                                                    </Flex>
                                                </Td>
                                                <Td>{r.despachoOrigenId}</Td>
                                                <Td>{r.fechaEnvio ? new Date(r.fechaEnvio).toLocaleString() : 'N/A'}</Td>
                                                <Td textAlign="right">
                                                    <HStack justify="flex-end" spacing={2}>
                                                        <Button
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="outline"
                                                            onClick={() => handleRejectClick(r._id)}
                                                            title="Rechazar recepción"
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                        <Button size="sm" colorScheme="green" onClick={() => void confirm(r._id)}>
                                                            Confirmar recepción
                                                        </Button>
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </GridItem>
            </Grid>

            <RejectionModal
                isOpen={isRejectOpen}
                onClose={onRejectClose}
                onConfirm={handleConfirmReject}
            />
        </Container>
    );
};

export default RecepcionPage;


