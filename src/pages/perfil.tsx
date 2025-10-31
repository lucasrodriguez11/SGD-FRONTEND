import React, { useEffect, useState, useCallback } from 'react';
import {
    Avatar,
    Box,
    Button,
    Container,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    VStack,
    Badge,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    Flex,
    useToast,
    useColorModeValue,
} from '@chakra-ui/react';
import { authUser, despachosApi, expedientesApi, movimientosApi, usersApi, type Expediente, type Movimiento, type UserDTO, type Despacho, type CreateMovimientoDto } from '~/services/api';
import { useRouter } from 'next/router';
import { BackBar } from '~/components/Layout/BackBar';
import { MessageSquare, Send, Archive } from 'lucide-react';
import { MovimientoModal } from '~/components/Expedientes/MovimientoModal';

interface TabPanelInformacionDespachoProps {
    despacho: Despacho;
}

const TabPanelInformacionDespacho: React.FC<TabPanelInformacionDespachoProps> = ({ despacho }) => {
    const boxBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const labelColor = useColorModeValue('gray.600', 'gray.400');
    const textColor = useColorModeValue('gray.800', 'gray.200');
    const textEmptyColor = useColorModeValue('gray.400', 'gray.500');

    return (
        <Box borderWidth="1px" borderRadius="md" p={6} bg={boxBg} borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
                <Box>
                    <Heading size="sm" mb={2} color={labelColor}>Responsable</Heading>
                    <Text fontSize="md" color={despacho.responsable ? textColor : textEmptyColor}>
                        {despacho.responsable ?? 'No especificado'}
                    </Text>
                </Box>
                <Box>
                    <Heading size="sm" mb={2} color={labelColor}>Email</Heading>
                    <Text fontSize="md" color={despacho.email ? textColor : textEmptyColor}>
                        {despacho.email ?? 'No especificado'}
                    </Text>
                </Box>
                <Box>
                    <Heading size="sm" mb={2} color={labelColor}>Teléfono</Heading>
                    <Text fontSize="md" color={despacho.telefono ? textColor : textEmptyColor}>
                        {despacho.telefono ?? 'No especificado'}
                    </Text>
                </Box>
                <Box>
                    <Heading size="sm" mb={2} color={labelColor}>Descripción</Heading>
                    <Text fontSize="md" color={despacho.descripcion ? textColor : textEmptyColor} whiteSpace="pre-wrap">
                        {despacho.descripcion ?? 'No especificado'}
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
};

const PerfilPage: React.FC = () => {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [despacho, setDespacho] = useState<Despacho | null>(null);
    const router = useRouter();
    const queryDespacho = typeof router.query?.despachoId === 'string' ? router.query.despachoId : undefined;
    const toast = useToast();

    // Estados para tabs
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [enviados, setEnviados] = useState<Movimiento[]>([]);
    const [recepcionados, setRecepcionados] = useState<Movimiento[]>([]);
    const [archivados, setArchivados] = useState<Expediente[]>([]);
    const [usuarios, setUsuarios] = useState<UserDTO[]>([]);
    const [loading, setLoading] = useState<Record<string, boolean>>({
        expedientes: false,
        enviados: false,
        recepcionados: false,
        archivados: false,
        usuarios: false,
    });

    // Enviar/Archivar acciones rápidas
    const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
    const [isMovOpen, setIsMovOpen] = useState(false);
    const openEnviar = (id: string) => { setSelectedExpId(id); setIsMovOpen(true); };
    const closeEnviar = () => { setIsMovOpen(false); setSelectedExpId(null); };

    useEffect(() => {
        const load = async () => {
            const u = authUser.get<UserDTO>();
            if (u) setUser(u);
            const targetId = queryDespacho ?? u?.despachoId;
            if (!targetId) return;

            const res = await despachosApi.getById(targetId);
            if (res.success && res.data) {
                setDespacho(res.data.despacho);
            }
        };
        void load();
    }, [queryDespacho]);

    const targetDespachoId = queryDespacho ?? user?.despachoId;

    const loadExpedientes = useCallback(async () => {
        if (!targetDespachoId) return;
        setLoading(prev => ({ ...prev, expedientes: true }));
        try {
            const res = await expedientesApi.getByDespacho(targetDespachoId, { limit: 50 });
            if (res.success && res.data) {
                setExpedientes(res.data.expedientes);
            }
        } catch {
            toast({ title: 'Error al cargar expedientes', status: 'error', duration: 2000 });
        } finally {
            setLoading(prev => ({ ...prev, expedientes: false }));
        }
    }, [targetDespachoId, toast]);

    const loadEnviados = useCallback(async () => {
        if (!targetDespachoId) return;
        setLoading(prev => ({ ...prev, enviados: true }));
        try {
            const res = await movimientosApi.getEnviadosByDespacho(targetDespachoId, 50);
            if (res.success && res.data) {
                setEnviados(res.data.movimientos);
            }
        } catch {
            toast({ title: 'Error al cargar enviados', status: 'error', duration: 2000 });
        } finally {
            setLoading(prev => ({ ...prev, enviados: false }));
        }
    }, [targetDespachoId, toast]);

    const loadRecepcionados = useCallback(async () => {
        if (!targetDespachoId) return;
        setLoading(prev => ({ ...prev, recepcionados: true }));
        try {
            const res = await movimientosApi.getRecepcionadosByDespacho(targetDespachoId, 50);
            if (res.success && res.data) {
                setRecepcionados(res.data.movimientos);
            }
        } catch {
            toast({ title: 'Error al cargar recepcionados', status: 'error', duration: 2000 });
        } finally {
            setLoading(prev => ({ ...prev, recepcionados: false }));
        }
    }, [targetDespachoId, toast]);

    const loadArchivados = useCallback(async () => {
        if (!targetDespachoId) return;
        setLoading(prev => ({ ...prev, archivados: true }));
        try {
            const res = await expedientesApi.getByDespacho(targetDespachoId, { estado: 'ARCHIVADO', limit: 50 });
            if (res.success && res.data) {
                setArchivados(res.data.expedientes);
            }
        } catch {
            toast({ title: 'Error al cargar archivados', status: 'error', duration: 2000 });
        } finally {
            setLoading(prev => ({ ...prev, archivados: false }));
        }
    }, [targetDespachoId, toast]);

    const loadUsuarios = useCallback(async () => {
        if (!targetDespachoId) return;
        setLoading(prev => ({ ...prev, usuarios: true }));
        try {
            const res = await usersApi.getUsersByDespacho(targetDespachoId);
            if (res.success && res.data) {
                setUsuarios(res.data.users);
            }
        } catch {
            toast({ title: 'Error al cargar usuarios', status: 'error', duration: 2000 });
        } finally {
            setLoading(prev => ({ ...prev, usuarios: false }));
        }
    }, [targetDespachoId, toast]);

    const handleEnviarSubmit = async (data: CreateMovimientoDto) => {
        try {
            await movimientosApi.create(data);
            toast({ title: 'Expediente enviado', status: 'success', duration: 2000 });
            void loadExpedientes();
            closeEnviar();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al enviar';
            toast({ title: message, status: 'error', duration: 2000 });
        }
    };

    const handleArchivar = async (id: string) => {
        try {
            await expedientesApi.archive(id);
            toast({ title: 'Expediente archivado', status: 'success', duration: 2000 });
            void loadExpedientes();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al archivar';
            toast({ title: message, status: 'error', duration: 2000 });
        }
    };

    // Cargar expedientes al montar si hay targetDespachoId
    useEffect(() => {
        if (targetDespachoId && expedientes.length === 0) {
            void loadExpedientes();
        }
    }, [targetDespachoId, expedientes.length, loadExpedientes]);

    const handleTabChange = (index: number) => {
        if (index === 0 && expedientes.length === 0) void loadExpedientes();
        else if (index === 1 && enviados.length === 0) void loadEnviados();
        else if (index === 2 && recepcionados.length === 0) void loadRecepcionados();
        else if (index === 3 && archivados.length === 0) void loadArchivados();
        else if (index === 4 && usuarios.length === 0) void loadUsuarios();
    };

    if (!despacho) {
        return (
            <Container maxW="container.lg" py={10}>
                <BackBar title="Perfil" />
                <Flex justify="center" align="center" h="400px">
                    <Spinner size="xl" />
                </Flex>
            </Container>
        );
    }

    const isOwnProfile = !queryDespacho || queryDespacho === user?.despachoId;

    return (
        <>
            <Container maxW="container.lg" py={10}>
                <BackBar title="Perfil" />
                <VStack spacing={4} mb={6} align="center">
                    <Avatar size="xl" name={despacho.nombre} bg="green.300" />
                    <VStack spacing={1}>
                        <Heading size="lg">{despacho.tipo} · {despacho.nombre}</Heading>
                        <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                            PERFIL DEL DESPACHO
                        </Badge>
                    </VStack>
                    {!isOwnProfile && queryDespacho && (
                        <Button
                            leftIcon={<MessageSquare size={18} />}
                            colorScheme="blue"
                            size="md"
                            onClick={() => router.push(`/inbox?to=${queryDespacho}`)}
                        >
                            Enviar mensaje
                        </Button>
                    )}
                </VStack>

                <Tabs variant="enclosed" onChange={handleTabChange}>
                    <TabList>
                        <Tab>Expedientes</Tab>
                        <Tab>Enviados</Tab>
                        <Tab>Recepcionados</Tab>
                        <Tab>Archivados</Tab>
                        <Tab>Usuarios</Tab>
                        <Tab>Información del Despacho</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            {loading.expedientes ? (
                                <Flex justify="center" p={8}>
                                    <Spinner size="lg" />
                                </Flex>
                            ) : expedientes.length === 0 ? (
                                <Box borderWidth="1px" borderRadius="md" p={6} textAlign="center" color="gray.500">
                                    No hay expedientes en este despacho
                                </Box>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>N° Expediente</Th>
                                                <Th>Iniciador</Th>
                                                <Th>Tema</Th>
                                                <Th>Prioridad</Th>
                                                <Th>Estado</Th>
                                                <Th>Fojas</Th>
                                                {isOwnProfile && <Th textAlign="right">Acciones</Th>}
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {expedientes.map((exp) => (
                                                <Tr key={exp._id}>
                                                    <Td fontWeight="bold" fontFamily="mono">{exp.numeroExpediente}</Td>
                                                    <Td>{exp.iniciador}</Td>
                                                    <Td>{exp.tema}</Td>
                                                    <Td>
                                                        <Badge colorScheme={exp.prioridad === 'Alta' ? 'red' : exp.prioridad === 'Normal' ? 'blue' : 'gray'}>
                                                            {exp.prioridad}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme={exp.estado === 'RECEPCIONADO' ? 'green' : exp.estado === 'ENVIADO' ? 'orange' : 'gray'}>
                                                            {exp.estado}
                                                        </Badge>
                                                    </Td>
                                                    <Td fontFamily="mono">{exp.fojas}</Td>
                                                    {isOwnProfile && (
                                                        <Td textAlign="right">
                                                            <HStack spacing={2} justify="flex-end">
                                                                <Button size="sm" leftIcon={<Send size={14} />} onClick={() => openEnviar(exp._id)} colorScheme="blue" variant="outline">Enviar</Button>
                                                                <Button size="sm" leftIcon={<Archive size={14} />} onClick={() => void handleArchivar(exp._id)} variant="outline">Archivar</Button>
                                                            </HStack>
                                                        </Td>
                                                    )}
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </TabPanel>
                        <TabPanel>
                            {loading.enviados ? (
                                <Flex justify="center" p={8}>
                                    <Spinner size="lg" />
                                </Flex>
                            ) : enviados.length === 0 ? (
                                <Box borderWidth="1px" borderRadius="md" p={6} textAlign="center" color="gray.500">
                                    No hay movimientos enviados desde este despacho
                                </Box>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Fecha</Th>
                                                <Th>Expediente</Th>
                                                <Th>Desde</Th>
                                                <Th>Hacia</Th>
                                                <Th>Estado</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {enviados.map((mov) => (
                                                <Tr key={mov._id}>
                                                    <Td>{new Date(mov.fechaMovimiento).toLocaleDateString()}</Td>
                                                    <Td fontFamily="mono">
                                                        {typeof mov.expedienteId === 'object' && mov.expedienteId && 'numeroExpediente' in mov.expedienteId
                                                            ? String((mov.expedienteId as { numeroExpediente: string }).numeroExpediente)
                                                            : String(mov.expedienteId)}
                                                    </Td>
                                                    <Td>{mov.despachoAnterior}</Td>
                                                    <Td>{mov.despachoNuevo}</Td>
                                                    <Td>
                                                        <Badge colorScheme="orange">{mov.estado}</Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </TabPanel>
                        <TabPanel>
                            {loading.recepcionados ? (
                                <Flex justify="center" p={8}>
                                    <Spinner size="lg" />
                                </Flex>
                            ) : recepcionados.length === 0 ? (
                                <Box borderWidth="1px" borderRadius="md" p={6} textAlign="center" color="gray.500">
                                    No hay movimientos recepcionados en este despacho
                                </Box>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Fecha</Th>
                                                <Th>Expediente</Th>
                                                <Th>Desde</Th>
                                                <Th>Hacia</Th>
                                                <Th>Estado</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {recepcionados.map((mov) => (
                                                <Tr key={mov._id}>
                                                    <Td>{new Date(mov.fechaMovimiento).toLocaleDateString()}</Td>
                                                    <Td fontFamily="mono">
                                                        {typeof mov.expedienteId === 'object' && mov.expedienteId && 'numeroExpediente' in mov.expedienteId
                                                            ? String((mov.expedienteId as { numeroExpediente: string }).numeroExpediente)
                                                            : String(mov.expedienteId)}
                                                    </Td>
                                                    <Td>{mov.despachoAnterior}</Td>
                                                    <Td>{mov.despachoNuevo}</Td>
                                                    <Td>
                                                        <Badge colorScheme="green">{mov.estado}</Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </TabPanel>
                        <TabPanel>
                            {loading.archivados ? (
                                <Flex justify="center" p={8}>
                                    <Spinner size="lg" />
                                </Flex>
                            ) : archivados.length === 0 ? (
                                <Box borderWidth="1px" borderRadius="md" p={6} textAlign="center" color="gray.500">
                                    No hay expedientes archivados en este despacho
                                </Box>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>N° Expediente</Th>
                                                <Th>Iniciador</Th>
                                                <Th>Tema</Th>
                                                <Th>Prioridad</Th>
                                                <Th>Fojas</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {archivados.map((exp) => (
                                                <Tr key={exp._id}>
                                                    <Td fontWeight="bold" fontFamily="mono">{exp.numeroExpediente}</Td>
                                                    <Td>{exp.iniciador}</Td>
                                                    <Td>{exp.tema}</Td>
                                                    <Td>
                                                        <Badge colorScheme={exp.prioridad === 'Alta' ? 'red' : exp.prioridad === 'Normal' ? 'blue' : 'gray'}>
                                                            {exp.prioridad}
                                                        </Badge>
                                                    </Td>
                                                    <Td fontFamily="mono">{exp.fojas}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </TabPanel>
                        <TabPanel>
                            {loading.usuarios ? (
                                <Flex justify="center" p={8}>
                                    <Spinner size="lg" />
                                </Flex>
                            ) : usuarios.length === 0 ? (
                                <Box borderWidth="1px" borderRadius="md" p={6} textAlign="center" color="gray.500">
                                    No hay usuarios registrados en este despacho
                                </Box>
                            ) : (
                                <Box overflowX="auto">
                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Nombre</Th>
                                                <Th>Email</Th>
                                                <Th>Rol</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {usuarios.map((usr) => (
                                                <Tr key={usr._id}>
                                                    <Td fontWeight="semibold">{usr.name}</Td>
                                                    <Td>{usr.email}</Td>
                                                    <Td>
                                                        <Badge colorScheme={usr.role === 'ADMIN' ? 'purple' : 'blue'}>
                                                            {usr.role}
                                                        </Badge>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}
                        </TabPanel>
                        <TabPanel>
                            <TabPanelInformacionDespacho despacho={despacho} />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
            {/* Modal Enviar Expediente */}
            <MovimientoModal isOpen={isMovOpen} onClose={closeEnviar} onSubmit={handleEnviarSubmit} expedientes={expedientes} initialExpedienteId={selectedExpId ?? undefined} />
        </>
    );
};

export default PerfilPage;