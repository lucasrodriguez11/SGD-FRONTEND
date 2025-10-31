import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Heading, Table, Tbody, Td, Th, Thead, Tr, useToast, Grid, GridItem, Input, SimpleGrid, Badge, useColorModeValue, Flex, Text, Spinner } from '@chakra-ui/react';
import { BackBar } from '~/components/Layout/BackBar';
import { recepcionesApi, authToken } from '~/services/api';
import { jwtDecode } from 'jwt-decode';

type TokenPayload = { userId: string; role: 'ADMIN' | 'USER'; despachoId?: string };

const RecepcionPage: React.FC = () => {
    const toast = useToast();
    const [rows, setRows] = useState<Array<{ _id: string; expedienteId: string; despachoOrigenId: string; despachoDestinoId: string; fechaEnvio: string }>>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const token = authToken.get();
    const payload = useMemo(() => (token ? jwtDecode<TokenPayload>(token) : null), [token]);
    const despachoDestinoId = payload?.despachoId ?? '';

    const fetchPending = useCallback(async () => {
        if (!despachoDestinoId) return;
        setLoading(true);
        const res = await recepcionesApi.pendingByDespacho(despachoDestinoId);
        if (res.success && res.data) setRows(res.data.recepciones);
        setLoading(false);
    }, [despachoDestinoId]);

    useEffect(() => { void fetchPending(); }, [fetchPending]);

    const confirm = async (id: string) => {
        try {
            const res = await recepcionesApi.confirm(id, payload?.userId ?? '');
            if (res.success) {
                toast({ title: 'Recepción confirmada', status: 'success', duration: 2000 });
                void fetchPending();
            }
        } catch {
            toast({ title: 'Error al confirmar', status: 'error', duration: 2500 });
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
                                {loading && (
                                    <Tr><Td colSpan={4}><Flex justify="center" py={6}><Spinner /></Flex></Td></Tr>
                                )}
                                {!loading && rows
                                    .filter(r => r.expedienteId.includes(search) || r.despachoOrigenId.toLowerCase().includes(search.toLowerCase()))
                                    .map(r => (
                                        <Tr key={r._id}>
                                            <Td>
                                                <Flex direction="column">
                                                    <Text fontWeight="medium">{r.expedienteId}</Text>
                                                    <Badge mt={1} colorScheme="blue">Pendiente</Badge>
                                                </Flex>
                                            </Td>
                                            <Td>{r.despachoOrigenId}</Td>
                                            <Td>{new Date(r.fechaEnvio).toLocaleString()}</Td>
                                            <Td textAlign="right">
                                                <Button size="sm" colorScheme="green" onClick={() => void confirm(r._id)}>Confirmar recibido</Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                {!loading && rows.length === 0 && (
                                    <Tr><Td colSpan={4}><Flex justify="center" py={6}><Text color="gray.500">No hay recepciones pendientes</Text></Flex></Td></Tr>
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </GridItem>
            </Grid>
        </Container>
    );
};

export default RecepcionPage;


