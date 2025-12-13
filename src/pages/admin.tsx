import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Heading, useToast, FormControl, FormLabel, Input, Select, SimpleGrid, Flex, Text, Icon, useColorModeValue, Badge, Table, Thead, Tbody, Tr, Th, Td, Switch, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Grid, GridItem, Textarea, HStack } from '@chakra-ui/react';
import { Building2, Users as UsersIcon, UserPlus, Tag, FileText } from 'lucide-react';
import { BackBar } from '~/components/Layout/BackBar';
import { authToken, despachosApi, temasApi, usersApi, expedientesApi, type Despacho, type Tema, type CreateDespachoDto, type Expediente, type CreateExpedienteDto } from '~/services/api';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { DespachoModal } from '~/components/Despachos/DespachoModal';
import { ConfirmDialog } from '~/components/UI/ConfirmDialog';

type TokenPayload = { role?: 'ADMIN' | 'USER' };

const AdminPage: React.FC = () => {
    const toast = useToast();
    const router = useRouter();

    // Guard de rol (client-only para evitar hydration)
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    useEffect(() => {
        setMounted(true);
        const t = authToken.get();
        if (!t) { setIsAdmin(false); return; }
        try {
            const p = jwtDecode<TokenPayload>(t);
            setIsAdmin((p?.role ?? 'USER') === 'ADMIN');
        } catch { setIsAdmin(false); }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAdmin) {
            toast({ title: 'Sin permiso', description: 'No tienes acceso a Gestión Admin', status: 'warning', duration: 2500 });
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            router.push('/');
        }
    }, [mounted, isAdmin, router, toast]);

    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [temas, setTemas] = useState<Tema[]>([]);
    const [usuarios, setUsuarios] = useState<Array<{ _id: string; name: string; email: string; role: 'ADMIN' | 'USER'; despachoId?: string }>>([]);
    const [activePanel, setActivePanel] = useState<'usuarios' | 'temas' | 'despachos' | 'expedientes' | null>(null);
    const [selectedDespachoId, setSelectedDespachoId] = useState<string>('');
    const [userFilters, setUserFilters] = useState<{ search?: string; role?: 'ADMIN' | 'USER' | 'ALL'; despachoId?: string }>({ role: 'ALL' });
    // Estado para edición de tema
    const temaEditModal = useDisclosure();
    const [temaEdit, setTemaEdit] = useState<Tema | null>(null);
    const [editNombre, setEditNombre] = useState('');

    // Estado para panel Despachos (embebido)
    const [despList, setDespList] = useState<Despacho[]>([]);
    const [despLoading, setDespLoading] = useState<boolean>(false);
    const [despPage, setDespPage] = useState<number>(1);
    const [despTotalPages, setDespTotalPages] = useState<number>(1);
    const [despFilters, setDespFilters] = useState<{ search?: string; tipo?: string; estado?: string }>({});
    const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);
    const despModal = useDisclosure();
    const [confirmDlg, setConfirmDlg] = useState<{ isOpen: boolean; despacho: Despacho | null; action: 'delete' | 'deletePermanently' | 'activate' | null }>({ isOpen: false, despacho: null, action: null });

    // Estado para panel Expedientes
    const [expList, setExpList] = useState<Expediente[]>([]);
    const [expLoading, setExpLoading] = useState<boolean>(false);
    const [expPage, setExpPage] = useState<number>(1);
    const [expTotalPages, setExpTotalPages] = useState<number>(1);
    const [expFilters, setExpFilters] = useState<{ numeroExpediente?: string; prioridad?: string; tema?: string; estado?: string; despachoActual?: string }>({});
    const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
    const expModal = useDisclosure();
    const expCreateModal = useDisclosure();
    const [confirmExpDlg, setConfirmExpDlg] = useState<{ isOpen: boolean; expediente: Expediente | null; action: 'archive' | 'delete' | null }>({ isOpen: false, expediente: null, action: null });
    const [newExpediente, setNewExpediente] = useState<CreateExpedienteDto>({
        numeroExpediente: '',
        iniciador: '',
        tema: '',
        prioridad: 'Normal',
        fojas: 0,
        despachoActual: '',
        estado: 'RECEPCIONADO',
        fechaVencimiento: undefined,
    });
    const [enableVencNew, setEnableVencNew] = useState(false);
    const [enableVencEdit, setEnableVencEdit] = useState(false);

    const loadDespachos = async () => {
        const d = await despachosApi.getActivos();
        if (d.success && d.data) {
            setDespachos(d.data.despachos);
            if (!selectedDespachoId) {
                const firstId = d?.data?.despachos?.[0]?._id;
                if (firstId) {
                    setSelectedDespachoId(firstId);
                    void loadUsuarios(firstId);
                }
            }
        }
    };

    const loadTemas = async () => {
        const t = await temasApi.listAll();
        if (t.success && t.data) setTemas(t.data.temas);
    };

    const loadUsuarios = async (despachoId: string) => {
        if (!despachoId) return;
        const u = await usersApi.getUsersByDespacho(despachoId);
        if (u.success && u.data) setUsuarios(u.data.users.map(({ _id, name, email, role, despachoId: dId }) => ({ _id, name, email, role, despachoId: dId })));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void loadDespachos(); void loadTemas(); }, []);

    // Fetch despachos (panel embebido)
    const fetchDespachos = async (page: number, filterParams: { search?: string; tipo?: string; estado?: string }) => {
        try {
            setDespLoading(true);
            const result = await despachosApi.list({ page, limit: 10, ...filterParams });
            if (result.success && result.data) {
                setDespList(result.data.despachos);
                setDespTotalPages(result.meta?.totalPages ?? 1);
            }
        } finally {
            setDespLoading(false);
        }
    };

    // Fetch expedientes (panel embebido)
    const fetchExpedientes = async (page: number, filterParams: { numeroExpediente?: string; prioridad?: string; tema?: string; estado?: string; despachoActual?: string }) => {
        try {
            setExpLoading(true);
            const result = await expedientesApi.list({ page, limit: 10, ...filterParams });
            if (result.success && result.data) {
                setExpList(result.data.expedientes);
                setExpTotalPages(result.meta?.totalPages ?? 1);
            }
        } finally {
            setExpLoading(false);
        }
    };

    // Crear usuario
    const [uName, setUName] = useState('');
    const [uEmail, setUEmail] = useState('');
    const [uPass, setUPass] = useState('');
    const [uDesp, setUDesp] = useState<string>('');
    const [uRole, setURole] = useState<'ADMIN' | 'USER'>('USER');
    const userModal = useDisclosure();
    const userEditModal = useDisclosure();
    const userPassModal = useDisclosure();
    const [selUserId, setSelUserId] = useState<string>('');
    const [eName, setEName] = useState('');
    const [eEmail, setEEmail] = useState('');
    const [eRole, setERole] = useState<'ADMIN' | 'USER'>('USER');
    const [eDesp, setEDesp] = useState<string>('');
    const [pNew, setPNew] = useState('');
    const [confirmUserDlg, setConfirmUserDlg] = useState<{ isOpen: boolean; userId?: string; name?: string }>({ isOpen: false });

    // Asegura que el combo de despachos esté fresco al abrir el modal de usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (userModal.isOpen) { void loadDespachos(); } }, [userModal.isOpen]);
    
    // Asegura que el combo de despachos esté fresco al abrir el modal de crear expediente
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (expCreateModal.isOpen) { void loadDespachos(); } }, [expCreateModal.isOpen]);

    const createUser = async () => {
        try {
            if (!uName.trim() || !uEmail.trim() || uPass.length < 6) {
                toast({ title: 'Completa nombre, email y contraseña (mín. 6)', status: 'warning', duration: 2500 });
                return;
            }
            const res = await usersApi.create({ name: uName, email: uEmail, password: uPass, despachoId: uDesp || undefined, role: uRole });
            if (res.success) {
                toast({ title: 'Usuario creado', status: 'success', duration: 2000 });
                userModal.onClose();
                setUName(''); setUEmail(''); setUPass(''); setUDesp(''); setURole('USER');
                // Recargar usuarios del despacho seleccionado
                const targetDesp = uDesp || selectedDespachoId;
                if (targetDesp) {
                    await loadUsuarios(targetDesp);
                }
            }
        } catch {
            toast({ title: 'Error al crear usuario', status: 'error', duration: 2500 });
        }
    };

    // Crear tema
    const [nuevoTema, setNuevoTema] = useState('');
    const temaModal = useDisclosure();
    const createTema = async () => {
        try {
            const res = await temasApi.create(nuevoTema);
            if (res.success) {
                toast({ title: 'Tema creado', status: 'success', duration: 2000 });
                setNuevoTema('');
                temaModal.onClose();
                void loadTemas();
            }
        } catch {
            toast({ title: 'Error al crear tema', status: 'error', duration: 2500 });
        }
    };

    // Acciones Despachos (panel embebido)
    const handleSubmitDespacho = async (data: CreateDespachoDto | Partial<CreateDespachoDto>) => {
        try {
            if (selectedDespacho) {
                await despachosApi.update(selectedDespacho._id, data as Partial<CreateDespachoDto>);
                toast({ title: 'Despacho actualizado', status: 'success', duration: 2000 });
            } else {
                await despachosApi.create(data as CreateDespachoDto);
                toast({ title: 'Despacho creado', status: 'success', duration: 2000 });
            }
            despModal.onClose();
            setSelectedDespacho(null);
            void fetchDespachos(despPage, despFilters);
            // refrescar combo de despachos para la sección Usuarios
            void loadDespachos();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast({ title: message, status: 'error', duration: 2500 });
            throw error;
        }
    };

    const handleConfirmDespacho = async () => {
        if (!confirmDlg.despacho || !confirmDlg.action) return;
        const isDelete = confirmDlg.action === 'delete';
        const isDeletePermanently = confirmDlg.action === 'deletePermanently';
        try {
            if (isDeletePermanently) {
                await despachosApi.deletePermanently(confirmDlg.despacho._id);
                toast({ title: 'Despacho eliminado permanentemente', status: 'success', duration: 2000 });
            } else if (isDelete) {
                await despachosApi.delete(confirmDlg.despacho._id);
                toast({ title: 'Despacho desactivado', status: 'success', duration: 2000 });
            } else {
                await despachosApi.update(confirmDlg.despacho._id, { estado: 'ACTIVO' });
                toast({ title: 'Despacho activado', status: 'success', duration: 2000 });
            }
            setConfirmDlg({ isOpen: false, despacho: null, action: null });
            void fetchDespachos(despPage, despFilters);
            // refrescar lista global de despachos
            void loadDespachos();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast({ title: message, status: 'error', duration: 2500 });
        }
    };

    const cardBg = useColorModeValue('white', 'gray.900');
    const border = useColorModeValue('gray.200', 'gray.700');
    const activeBg = useColorModeValue('blue.50', 'blue.900');
    const activeBorder = useColorModeValue('blue.400', 'blue.600');
    const activeText = useColorModeValue('blue.700', 'blue.200');

    if (!isAdmin) return null;

    return (
        <Container maxW="1600px" px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, md: 8 }}>
            <BackBar title="Gestión Admin" />
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={6}>
                <Flex
                    align="center"
                    justify="space-between"
                    p={4}
                    borderRadius="lg"
                    bg={activePanel === 'despachos' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'despachos' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('despachos'); void fetchDespachos(1, {}); }}
                >
                    <Flex align="center" gap={2}><Icon as={Building2} boxSize={5} color={activePanel === 'despachos' ? activeText : 'blue.500'} /> <Text fontSize="sm" fontWeight="bold" color={activePanel === 'despachos' ? activeText : undefined}>Despachos</Text></Flex>
                    <Badge fontSize="xs" colorScheme="blue">GESTIONAR</Badge>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    p={4}
                    borderRadius="lg"
                    bg={activePanel === 'usuarios' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'usuarios' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('usuarios'); void loadDespachos(); if (selectedDespachoId) void loadUsuarios(selectedDespachoId); }}
                >
                    <Flex align="center" gap={2}><Icon as={UsersIcon} boxSize={5} color={activePanel === 'usuarios' ? activeText : 'blue.500'} /> <Text fontSize="sm" fontWeight="bold" color={activePanel === 'usuarios' ? activeText : undefined}>Usuarios</Text></Flex>
                    <Badge fontSize="xs" colorScheme="blue">GESTIONAR</Badge>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    p={4}
                    borderRadius="lg"
                    bg={activePanel === 'temas' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'temas' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('temas'); void loadTemas(); }}
                >
                    <Flex align="center" gap={2}><Icon as={Tag} boxSize={5} color={activePanel === 'temas' ? activeText : 'blue.500'} /> <Text fontSize="sm" fontWeight="bold" color={activePanel === 'temas' ? activeText : undefined}>Temas</Text></Flex>
                    <Badge fontSize="xs" colorScheme="blue">GESTIONAR</Badge>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    p={4}
                    borderRadius="lg"
                    bg={activePanel === 'expedientes' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'expedientes' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('expedientes'); void fetchExpedientes(1, {}); }}
                >
                    <Flex align="center" gap={2}><Icon as={FileText} boxSize={5} color={activePanel === 'expedientes' ? activeText : 'blue.500'} /> <Text fontSize="sm" fontWeight="bold" color={activePanel === 'expedientes' ? activeText : undefined}>Expedientes</Text></Flex>
                    <Badge fontSize="xs" colorScheme="blue">GESTIONAR</Badge>
                </Flex>
            </SimpleGrid>

            {activePanel === 'usuarios' && (
                <Box p={4} borderWidth="1px" borderRadius="md">
                    <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                        <GridItem>
                            <Box borderWidth="1px" borderRadius="md" p={4}>
                                <Heading size="md" mb={3}>Filtros</Heading>
                                <FormControl mb={3}>
                                    <FormLabel>Buscar</FormLabel>
                                    <Input placeholder="Nombre o email" value={userFilters.search ?? ''} onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value }))} />
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Rol</FormLabel>
                                    <Select value={userFilters.role ?? 'ALL'} onChange={(e) => setUserFilters((f) => ({ ...f, role: (e.target.value as 'ADMIN' | 'USER' | 'ALL') }))}>
                                        <option value="ALL">Todos</option>
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={4}>
                                    <FormLabel>Despacho</FormLabel>
                                    <Select placeholder="Selecciona despacho" value={selectedDespachoId} onChange={(e) => {
                                        const id = e.target.value; 
                                        setSelectedDespachoId(id);
                                        setUserFilters((f) => ({ ...f, despachoId: id }));
                                        if (id) void loadUsuarios(id);
                                    }}>
                                        {despachos.map((d) => (<option key={d._id} value={d._id}>{d.tipo} - {d.nombre}</option>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </GridItem>
                        <GridItem minW={0}>
                            <Flex justify="space-between" align="center" mb={3}>
                                <Heading size="md">Usuarios</Heading>
                                <Button leftIcon={<UserPlus size={16} />} colorScheme="blue" onClick={() => { if (userFilters.despachoId) setUDesp(userFilters.despachoId); userModal.onOpen(); }}>Crear usuario</Button>
                            </Flex>
                            <Box overflowX="auto">
                                <Table size="sm" variant="simple">
                                    <Thead><Tr><Th>Nombre</Th><Th>Email</Th><Th>Rol</Th><Th>Acciones</Th></Tr></Thead>
                                    <Tbody>
                                        {usuarios
                                            .filter(u => (userFilters.role === 'ALL' || !userFilters.role) ? true : u.role === userFilters.role)
                                            .filter(u => !userFilters.search ? true : (`${u.name} ${u.email}`.toLowerCase().includes((userFilters.search ?? '').toLowerCase())))
                                            .map(u => (
                                                <Tr key={u._id}>
                                                    <Td>{u.name}</Td>
                                                    <Td>{u.email}</Td>
                                                    <Td><Badge colorScheme={u.role === 'ADMIN' ? 'purple' : 'blue'}>{u.role}</Badge></Td>
                                                    <Td>
                                                        <HStack spacing={2} flexWrap="wrap">
                                                            <Button size="xs" onClick={async () => { const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'; await usersApi.changeRole(u._id, newRole); toast({ title: 'Rol actualizado', status: 'success', duration: 1500 }); void loadUsuarios(selectedDespachoId); }}>Rol</Button>
                                                            <Button size="xs" onClick={() => { setSelUserId(u._id); setEName(u.name); setEEmail(u.email); setERole(u.role); setEDesp(u.despachoId ?? ''); userEditModal.onOpen(); }}>Editar</Button>
                                                            <Button size="xs" onClick={() => { setSelUserId(u._id); setPNew(''); userPassModal.onOpen(); }}>Contraseña</Button>
                                                            <Button size="xs" colorScheme="red" onClick={() => setConfirmUserDlg({ isOpen: true, userId: u._id, name: u.name })}>Eliminar</Button>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        </GridItem>
                    </Grid>
                </Box>
            )}

            {activePanel === 'temas' && (
                <Box p={4} borderWidth="1px" borderRadius="md">
                    <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                        <GridItem>
                            <Box borderWidth="1px" borderRadius="md" p={4}>
                                <Heading size="md" mb={3}>Temas</Heading>
                                <Button w="full" colorScheme="blue" onClick={temaModal.onOpen}>Nuevo tema</Button>
                            </Box>
                        </GridItem>
                        <GridItem minW={0}>
                            <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                                <Box p={3} borderBottom="1px" borderColor="gray.200">
                                    <Heading size="sm">Listado</Heading>
                                </Box>
                                <Box overflowX="auto" maxH="70vh" overflowY="auto">
                                    <Table size="sm" variant="simple">
                                        <Thead><Tr><Th>Nombre</Th><Th>Activo</Th><Th>Acciones</Th></Tr></Thead>
                                        <Tbody>
                                            {temas.map(t => (
                                                <Tr key={t._id}>
                                                    <Td>{t.nombre}</Td>
                                                    <Td><Switch isChecked={t.activo ?? true} onChange={async (e) => { await temasApi.update(t._id, { activo: e.target.checked }); void loadTemas(); }} /></Td>
                                                    <Td>
                                                        <HStack spacing={2} flexWrap="wrap">
                                                            <Button size="xs" onClick={() => { setTemaEdit(t); setEditNombre(t.nombre); temaEditModal.onOpen(); }}>Editar</Button>
                                                            <Button size="xs" colorScheme="red" onClick={async () => { await temasApi.remove(t._id); void loadTemas(); }}>Eliminar</Button>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </Box>
                        </GridItem>
                    </Grid>
                </Box>
            )}

            {activePanel === 'despachos' && (
                <Box p={4} borderWidth="1px" borderRadius="md">
                    <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                        <GridItem>
                            <Box borderWidth="1px" borderRadius="md" p={4}>
                                <Heading size="md" mb={3}>Filtros</Heading>
                                <FormControl mb={3}>
                                    <FormLabel>Buscar</FormLabel>
                                    <Input placeholder="Nombre, código, responsable..." value={despFilters.search ?? ''} onChange={(e) => { setDespFilters((f) => ({ ...f, search: e.target.value })); setDespPage(1); void fetchDespachos(1, { ...despFilters, search: e.target.value }); }} />
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select placeholder="Todos los tipos" value={despFilters.tipo ?? ''} onChange={(e) => { setDespFilters((f) => ({ ...f, tipo: e.target.value || undefined })); setDespPage(1); void fetchDespachos(1, { ...despFilters, tipo: e.target.value || undefined }); }}>
                                        <option value="">Todos</option>
                                        <option value="MUNICIPALIDAD">MUNICIPALIDAD</option>
                                        <option value="DIRECCION">DIRECCION</option>
                                        <option value="SUBDIRECCIÓN">SUBDIRECCIÓN</option>
                                        <option value="AREA">AREA</option>
                                        <option value="DEPARTAMENTO">DEPARTAMENTO</option>
                                        <option value="SECRETARIA">SECRETARIA</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={4}>
                                    <FormLabel>Estado</FormLabel>
                                    <Select placeholder="Todos los estados" value={despFilters.estado ?? ''} onChange={(e) => { setDespFilters((f) => ({ ...f, estado: e.target.value || undefined })); setDespPage(1); void fetchDespachos(1, { ...despFilters, estado: e.target.value || undefined }); }}>
                                        <option value="">Todos</option>
                                        <option value="ACTIVO">ACTIVO</option>
                                        <option value="INACTIVO">INACTIVO</option>
                                    </Select>
                                </FormControl>
                            </Box>
                        </GridItem>
                        <GridItem minW={0}>
                            <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                                <Box p={3} borderBottom="1px" borderColor="gray.200">
                                    <Flex justify="space-between" align="center">
                                        <Heading size="sm">Listado</Heading>
                                        <Button size="sm" colorScheme="blue" onClick={() => { setSelectedDespacho(null); despModal.onOpen(); }}>Nuevo Despacho</Button>
                                    </Flex>
                                </Box>
                                <Box overflowX="auto" maxH="70vh" overflowY="auto">
                                    <Table size="sm" variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Código</Th>
                                                <Th>Nombre</Th>
                                                <Th>Tipo</Th>
                                                <Th>Responsable</Th>
                                                <Th>Estado</Th>
                                                <Th minW="200px">Acciones</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {despLoading ? (
                                                <Tr><Td colSpan={6} textAlign="center">Cargando...</Td></Tr>
                                            ) : despList.length === 0 ? (
                                                <Tr><Td colSpan={6} textAlign="center">No hay despachos</Td></Tr>
                                            ) : (
                                                despList.map((d) => (
                                                    <Tr key={d._id}>
                                                        <Td>{d.codigo}</Td>
                                                        <Td>{d.nombre}</Td>
                                                        <Td><Badge colorScheme="purple">{d.tipo}</Badge></Td>
                                                        <Td>{d.responsable}</Td>
                                                        <Td><Badge colorScheme={d.estado === 'ACTIVO' ? 'green' : 'gray'}>{d.estado}</Badge></Td>
                                                        <Td>
                                                            <HStack spacing={2} flexWrap="wrap">
                                                                <Button size="xs" minW="60px" onClick={() => { setSelectedDespacho(d); despModal.onOpen(); }}>Editar</Button>
                                                                {d.estado === 'ACTIVO' ? (
                                                                    <>
                                                                        <Button size="xs" minW="80px" colorScheme="orange" onClick={() => setConfirmDlg({ isOpen: true, despacho: d, action: 'delete' })}>Desactivar</Button>
                                                                        <Button size="xs" minW="70px" colorScheme="red" onClick={() => setConfirmDlg({ isOpen: true, despacho: d, action: 'deletePermanently' })}>Eliminar</Button>
                                                                    </>
                                                                ) : (
                                                                    <Button size="xs" minW="70px" colorScheme="green" onClick={() => setConfirmDlg({ isOpen: true, despacho: d, action: 'activate' })}>Activar</Button>
                                                                )}
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))
                                            )}
                                        </Tbody>
                                    </Table>
                                </Box>
                                {despTotalPages > 1 && (
                                    <Flex justify="space-between" align="center" p={3} borderTop="1px" borderColor="gray.200">
                                        <Text fontSize="sm">Página {despPage} de {despTotalPages}</Text>
                                        <Flex gap={2}>
                                            <Button size="sm" isDisabled={despPage === 1} onClick={() => { setDespPage(despPage - 1); void fetchDespachos(despPage - 1, despFilters); }}>Anterior</Button>
                                            <Button size="sm" isDisabled={despPage === despTotalPages} onClick={() => { setDespPage(despPage + 1); void fetchDespachos(despPage + 1, despFilters); }}>Siguiente</Button>
                                        </Flex>
                                    </Flex>
                                )}
                            </Box>
                        </GridItem>
                    </Grid>

                    <DespachoModal isOpen={despModal.isOpen} onClose={despModal.onClose} onSubmit={handleSubmitDespacho} initial={selectedDespacho} />
                    <ConfirmDialog
                        isOpen={confirmDlg.isOpen}
                        onClose={() => setConfirmDlg({ isOpen: false, despacho: null, action: null })}
                        onConfirm={handleConfirmDespacho}
                        title={confirmDlg.action === 'deletePermanently' ? 'Eliminar Despacho' : confirmDlg.action === 'delete' ? 'Desactivar Despacho' : 'Activar Despacho'}
                        message={confirmDlg.action === 'deletePermanently' 
                            ? `¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE el despacho "${confirmDlg.despacho?.nombre}"? Esta acción NO se puede deshacer.`
                            : confirmDlg.action === 'delete' 
                            ? `¿Estás seguro de que deseas desactivar el despacho "${confirmDlg.despacho?.nombre}"?`
                            : `¿Estás seguro de que deseas activar el despacho "${confirmDlg.despacho?.nombre}"?`}
                        confirmText={confirmDlg.action === 'deletePermanently' ? 'Eliminar' : confirmDlg.action === 'delete' ? 'Desactivar' : 'Activar'}
                        type={confirmDlg.action === 'deletePermanently' ? 'error' : confirmDlg.action === 'delete' ? 'warning' : 'success'}
                    />
                </Box>
            )}

            {activePanel === 'expedientes' && (
                <Box p={4} borderWidth="1px" borderRadius="md">
                    <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                        <GridItem>
                            <Box borderWidth="1px" borderRadius="md" p={4}>
                                <Heading size="md" mb={3}>Filtros</Heading>
                                <FormControl mb={3}>
                                    <FormLabel>N° Expediente</FormLabel>
                                    <Input placeholder="Buscar por número..." value={expFilters.numeroExpediente ?? ''} onChange={(e) => { setExpFilters((f) => ({ ...f, numeroExpediente: e.target.value || undefined })); setExpPage(1); void fetchExpedientes(1, { ...expFilters, numeroExpediente: e.target.value || undefined }); }} />
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Prioridad</FormLabel>
                                    <Select placeholder="Todas las prioridades" value={expFilters.prioridad ?? ''} onChange={(e) => { setExpFilters((f) => ({ ...f, prioridad: e.target.value || undefined })); setExpPage(1); void fetchExpedientes(1, { ...expFilters, prioridad: e.target.value || undefined }); }}>
                                        <option value="">Todas</option>
                                        <option value="Baja">Baja</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Tema</FormLabel>
                                    <Select placeholder="Todos los temas" value={expFilters.tema ?? ''} onChange={(e) => { setExpFilters((f) => ({ ...f, tema: e.target.value || undefined })); setExpPage(1); void fetchExpedientes(1, { ...expFilters, tema: e.target.value || undefined }); }}>
                                        <option value="">Todos</option>
                                        {temas.filter(t => t.activo).map((t) => (<option key={t._id} value={t.nombre}>{t.nombre}</option>))}
                                    </Select>
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Estado</FormLabel>
                                    <Select placeholder="Todos los estados" value={expFilters.estado ?? ''} onChange={(e) => { setExpFilters((f) => ({ ...f, estado: e.target.value || undefined })); setExpPage(1); void fetchExpedientes(1, { ...expFilters, estado: e.target.value || undefined }); }}>
                                        <option value="">Todos</option>
                                        <option value="RECEPCIONADO">RECEPCIONADO</option>
                                        <option value="ENVIADO">ENVIADO</option>
                                        <option value="ARCHIVADO">ARCHIVADO</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={4}>
                                    <FormLabel>Despacho</FormLabel>
                                    <Select placeholder="Todos los despachos" value={expFilters.despachoActual ?? ''} onChange={(e) => { setExpFilters((f) => ({ ...f, despachoActual: e.target.value || undefined })); setExpPage(1); void fetchExpedientes(1, { ...expFilters, despachoActual: e.target.value || undefined }); }}>
                                        <option value="">Todos</option>
                                        {despachos.filter(d => d.estado === 'ACTIVO').map((d) => (<option key={d._id} value={d.nombre}>{d.tipo} - {d.nombre}</option>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </GridItem>
                        <GridItem minW={0}>
                            <Box borderWidth="1px" borderRadius="md" overflow="hidden">
                                <Box p={3} borderBottom="1px" borderColor="gray.200">
                                    <Flex justify="space-between" align="center">
                                        <Heading size="sm">Listado</Heading>
                                        <Button size="sm" colorScheme="blue" onClick={() => { 
                                            setNewExpediente({ numeroExpediente: '', iniciador: '', tema: '', prioridad: 'Normal', fojas: 0, despachoActual: '', estado: 'RECEPCIONADO', fechaVencimiento: undefined }); 
                                            setEnableVencNew(false);
                                            expCreateModal.onOpen(); 
                                        }}>Nuevo Expediente</Button>
                                    </Flex>
                                </Box>
                                <Box overflowX="auto" maxH="70vh" overflowY="auto">
                                    <Table size="sm" variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>N° Expediente</Th>
                                                <Th>Iniciador</Th>
                                                <Th>Tema</Th>
                                                <Th>Prioridad</Th>
                                                <Th>Despacho Actual</Th>
                                                <Th>Estado</Th>
                                                <Th>Fojas</Th>
                                                <Th minW="200px">Acciones</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {expLoading ? (
                                                <Tr><Td colSpan={8} textAlign="center">Cargando...</Td></Tr>
                                            ) : expList.length === 0 ? (
                                                <Tr><Td colSpan={8} textAlign="center">No hay expedientes</Td></Tr>
                                            ) : (
                                                expList.map((exp) => (
                                                    <Tr key={exp._id}>
                                                        <Td><Text fontWeight="bold" fontFamily="mono">{exp.numeroExpediente}</Text></Td>
                                                        <Td>{exp.iniciador}</Td>
                                                        <Td>{exp.tema}</Td>
                                                        <Td><Badge colorScheme={exp.prioridad === 'Alta' ? 'red' : exp.prioridad === 'Normal' ? 'blue' : 'gray'}>{exp.prioridad}</Badge></Td>
                                                        <Td>{exp.despachoActual}</Td>
                                                        <Td><Badge colorScheme={exp.estado === 'RECEPCIONADO' ? 'blue' : exp.estado === 'ENVIADO' ? 'orange' : 'gray'}>{exp.estado}</Badge></Td>
                                                        <Td>{exp.fojas}</Td>
                                                        <Td>
                                                            <HStack spacing={2} flexWrap="wrap">
                                                                <Button size="xs" minW="60px" onClick={() => { 
                                                                    setSelectedExpediente(exp); 
                                                                    setEnableVencEdit(!!exp.fechaVencimiento);
                                                                    expModal.onOpen(); 
                                                                }}>Editar</Button>
                                                                <Button size="xs" minW="70px" colorScheme="orange" onClick={() => setConfirmExpDlg({ isOpen: true, expediente: exp, action: 'archive' })}>Archivar</Button>
                                                                <Button size="xs" minW="70px" colorScheme="red" onClick={() => setConfirmExpDlg({ isOpen: true, expediente: exp, action: 'delete' })}>Eliminar</Button>
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))
                                            )}
                                        </Tbody>
                                    </Table>
                                </Box>
                                {expTotalPages > 1 && (
                                    <Flex justify="space-between" align="center" p={3} borderTop="1px" borderColor="gray.200">
                                        <Text fontSize="sm">Página {expPage} de {expTotalPages}</Text>
                                        <Flex gap={2}>
                                            <Button size="sm" isDisabled={expPage === 1} onClick={() => { setExpPage(expPage - 1); void fetchExpedientes(expPage - 1, expFilters); }}>Anterior</Button>
                                            <Button size="sm" isDisabled={expPage === expTotalPages} onClick={() => { setExpPage(expPage + 1); void fetchExpedientes(expPage + 1, expFilters); }}>Siguiente</Button>
                                        </Flex>
                                    </Flex>
                                )}
                            </Box>
                        </GridItem>
                    </Grid>

                    {/* Modal Editar Expediente */}
                    <Modal isOpen={expModal.isOpen} onClose={expModal.onClose} isCentered size="lg">
                        <ModalOverlay />
                        <ModalContent maxW={{ base: '95%', md: '600px' }} mx={{ base: 2, md: 0 }}>
                            <ModalHeader>Editar Expediente</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody pb={4}>
                                {selectedExpediente && (
                                    <>
                                        <FormControl mb={3}>
                                            <FormLabel>N° Expediente</FormLabel>
                                            <Input value={selectedExpediente.numeroExpediente} isReadOnly />
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Iniciador</FormLabel>
                                            <Input
                                                value={selectedExpediente.iniciador}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, iniciador: e.target.value })}
                                            />
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Tema</FormLabel>
                                            <Input
                                                value={selectedExpediente.tema}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, tema: e.target.value })}
                                            />
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Prioridad</FormLabel>
                                            <Select
                                                value={selectedExpediente.prioridad}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, prioridad: e.target.value as 'Baja' | 'Normal' | 'Alta' })}
                                            >
                                                <option value="Baja">Baja</option>
                                                <option value="Normal">Normal</option>
                                                <option value="Alta">Alta</option>
                                            </Select>
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Extracto</FormLabel>
                                            <Textarea
                                                value={selectedExpediente.extracto ?? ''}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, extracto: e.target.value })}
                                            />
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Fojas</FormLabel>
                                            <Input
                                                type="number"
                                                value={selectedExpediente.fojas}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, fojas: parseInt(e.target.value, 10) || 0 })}
                                            />
                                        </FormControl>
                                        <FormControl mb={3}>
                                            <FormLabel>Estado</FormLabel>
                                            <Select
                                                value={selectedExpediente.estado}
                                                onChange={(e) => setSelectedExpediente({ ...selectedExpediente, estado: e.target.value as 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO' })}
                                            >
                                                <option value="RECEPCIONADO">RECEPCIONADO</option>
                                                <option value="ENVIADO">ENVIADO</option>
                                                <option value="ARCHIVADO">ARCHIVADO</option>
                                            </Select>
                                        </FormControl>
                                <FormControl mb={3}>
                                    <HStack justify="space-between" mb={1}>
                                        <FormLabel m={0}>Vencimiento</FormLabel>
                                        <HStack spacing={2}>
                                            <Switch size="sm" isChecked={enableVencEdit} onChange={(e) => {
                                                setEnableVencEdit(e.target.checked);
                                                if (!e.target.checked) {
                                                    setSelectedExpediente({ ...selectedExpediente, fechaVencimiento: undefined });
                                                }
                                            }} />
                                            <FormLabel m={0} fontSize="sm">Activar</FormLabel>
                                        </HStack>
                                    </HStack>
                                    {enableVencEdit && (
                                        <Input
                                            type="date"
                                            value={selectedExpediente.fechaVencimiento ? new Date(selectedExpediente.fechaVencimiento).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setSelectedExpediente({ ...selectedExpediente, fechaVencimiento: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                        />
                                    )}
                                </FormControl>
                                        <Button
                                            w="full"
                                            colorScheme="blue"
                                            onClick={async () => {
                                                try {
                                                    if (!selectedExpediente) return;
                                                    const res = await expedientesApi.update(selectedExpediente._id, {
                                                        iniciador: selectedExpediente.iniciador,
                                                        tema: selectedExpediente.tema,
                                                        prioridad: selectedExpediente.prioridad,
                                                        extracto: selectedExpediente.extracto,
                                                        fojas: selectedExpediente.fojas,
                                                        estado: selectedExpediente.estado,
                                                        fechaVencimiento: selectedExpediente.fechaVencimiento,
                                                    });
                                                    if (res.success) {
                                                        toast({ title: 'Expediente actualizado', status: 'success', duration: 2000 });
                                                        expModal.onClose();
                                                        setSelectedExpediente(null);
                                                        void fetchExpedientes(expPage, expFilters);
                                                    }
                                                } catch (error) {
                                                    const message = error instanceof Error ? error.message : 'Error desconocido';
                                                    toast({ title: message, status: 'error', duration: 2500 });
                                                }
                                            }}
                                        >
                                            Guardar
                                        </Button>
                                    </>
                                )}
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Modal Crear Expediente */}
                    <Modal isOpen={expCreateModal.isOpen} onClose={expCreateModal.onClose} isCentered size="lg">
                        <ModalOverlay />
                        <ModalContent maxW={{ base: '95%', md: '600px' }} mx={{ base: 2, md: 0 }}>
                            <ModalHeader>Nuevo Expediente</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody pb={4}>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>N° Expediente</FormLabel>
                                    <Input
                                        value={newExpediente.numeroExpediente}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, numeroExpediente: e.target.value })}
                                        placeholder="Ej: 2025/001"
                                    />
                                </FormControl>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>Iniciador</FormLabel>
                                    <Input
                                        value={newExpediente.iniciador}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, iniciador: e.target.value })}
                                        placeholder="Nombre del iniciador"
                                    />
                                </FormControl>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>Tema</FormLabel>
                                    <Input
                                        value={newExpediente.tema}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, tema: e.target.value })}
                                        placeholder="Tema del expediente"
                                    />
                                </FormControl>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>Prioridad</FormLabel>
                                    <Select
                                        value={newExpediente.prioridad}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, prioridad: e.target.value as 'Baja' | 'Normal' | 'Alta' })}
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Alta">Alta</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Extracto</FormLabel>
                                    <Textarea
                                        value={newExpediente.extracto ?? ''}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, extracto: e.target.value })}
                                        placeholder="Descripción del expediente"
                                    />
                                </FormControl>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>Fojas</FormLabel>
                                    <Input
                                        type="number"
                                        value={newExpediente.fojas}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, fojas: parseInt(e.target.value, 10) || 0 })}
                                        min={0}
                                    />
                                </FormControl>
                                <FormControl mb={3} isRequired>
                                    <FormLabel>Despacho Actual</FormLabel>
                                    <Select
                                        value={newExpediente.despachoActual}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, despachoActual: e.target.value })}
                                        placeholder="Selecciona despacho"
                                    >
                                        {despachos.map((d) => (
                                            <option key={d._id} value={d.nombre}>{d.tipo} - {d.nombre}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl mb={3}>
                                    <FormLabel>Estado</FormLabel>
                                    <Select
                                        value={newExpediente.estado}
                                        onChange={(e) => setNewExpediente({ ...newExpediente, estado: e.target.value as 'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO' })}
                                    >
                                        <option value="RECEPCIONADO">RECEPCIONADO</option>
                                        <option value="ENVIADO">ENVIADO</option>
                                        <option value="ARCHIVADO">ARCHIVADO</option>
                                    </Select>
                                </FormControl>
                                <FormControl mb={3}>
                                    <HStack justify="space-between" mb={1}>
                                        <FormLabel m={0}>Vencimiento</FormLabel>
                                        <HStack spacing={2}>
                                            <Switch size="sm" isChecked={enableVencNew} onChange={(e) => {
                                                setEnableVencNew(e.target.checked);
                                                if (!e.target.checked) {
                                                    setNewExpediente({ ...newExpediente, fechaVencimiento: undefined });
                                                }
                                            }} />
                                            <FormLabel m={0} fontSize="sm">Activar</FormLabel>
                                        </HStack>
                                    </HStack>
                                    {enableVencNew && (
                                        <Input
                                            type="date"
                                            value={newExpediente.fechaVencimiento ? new Date(newExpediente.fechaVencimiento).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setNewExpediente({ ...newExpediente, fechaVencimiento: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                        />
                                    )}
                                </FormControl>
                                <Button
                                    w="full"
                                    colorScheme="blue"
                                    onClick={async () => {
                                        try {
                                            if (!newExpediente.numeroExpediente || !newExpediente.iniciador || !newExpediente.tema || !newExpediente.despachoActual) {
                                                toast({ title: 'Completa todos los campos requeridos', status: 'warning', duration: 2000 });
                                                return;
                                            }
                                            const res = await expedientesApi.create(newExpediente);
                                            if (res.success) {
                                                toast({ title: 'Expediente creado', status: 'success', duration: 2000 });
                                                expCreateModal.onClose();
                                                setNewExpediente({ numeroExpediente: '', iniciador: '', tema: '', prioridad: 'Normal', fojas: 0, despachoActual: '', estado: 'RECEPCIONADO', fechaVencimiento: undefined });
                                                setEnableVencNew(false);
                                                void fetchExpedientes(expPage, expFilters);
                                            }
                                        } catch (error) {
                                            const message = error instanceof Error ? error.message : 'Error desconocido';
                                            toast({ title: message, status: 'error', duration: 2500 });
                                        }
                                    }}
                                >
                                    Crear
                                </Button>
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Confirmar archivar/eliminar expediente */}
                    <ConfirmDialog
                        isOpen={confirmExpDlg.isOpen}
                        onClose={() => setConfirmExpDlg({ isOpen: false, expediente: null, action: null })}
                        onConfirm={async () => {
                            try {
                                if (!confirmExpDlg.expediente || !confirmExpDlg.action) return;
                                
                                if (confirmExpDlg.action === 'archive') {
                                    const res = await expedientesApi.archive(confirmExpDlg.expediente._id);
                                    if (res.success) {
                                        toast({ title: 'Expediente archivado', status: 'success', duration: 2000 });
                                        setConfirmExpDlg({ isOpen: false, expediente: null, action: null });
                                        void fetchExpedientes(expPage, expFilters);
                                    }
                                } else if (confirmExpDlg.action === 'delete') {
                                    const res = await expedientesApi.delete(confirmExpDlg.expediente._id);
                                    if (res.success) {
                                        toast({ title: 'Expediente eliminado permanentemente', status: 'success', duration: 2000 });
                                        setConfirmExpDlg({ isOpen: false, expediente: null, action: null });
                                        void fetchExpedientes(expPage, expFilters);
                                    }
                                }
                            } catch (error) {
                                const message = error instanceof Error ? error.message : 'Error desconocido';
                                toast({ title: message, status: 'error', duration: 2500 });
                            }
                        }}
                        title={confirmExpDlg.action === 'delete' ? 'Eliminar Expediente' : 'Archivar Expediente'}
                        message={confirmExpDlg.action === 'delete' 
                            ? `¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE el expediente "${confirmExpDlg.expediente?.numeroExpediente}"? Esta acción NO se puede deshacer y eliminará también todos los movimientos y recepciones relacionados.`
                            : `¿Estás seguro de que deseas archivar el expediente "${confirmExpDlg.expediente?.numeroExpediente}"? El expediente será marcado como archivado.`}
                        confirmText={confirmExpDlg.action === 'delete' ? 'Eliminar' : 'Archivar'}
                        type={confirmExpDlg.action === 'delete' ? 'error' : 'warning'}
                    />
                </Box>
            )}

            {/* Modal Crear Usuario */}
            <Modal isOpen={userModal.isOpen} onClose={userModal.onClose} isCentered size="md">
                <ModalOverlay />
                <ModalContent maxW={{ base: '95%', md: '540px' }} mx={{ base: 2, md: 0 }}>
                    <ModalHeader>Crear Usuario</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <FormControl mb={2}><FormLabel>Nombre</FormLabel><Input value={uName} onChange={(e) => setUName(e.target.value)} /></FormControl>
                        <FormControl mb={2}><FormLabel>Email</FormLabel><Input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} /></FormControl>
                        <FormControl mb={2}><FormLabel>Contraseña</FormLabel><Input type="password" value={uPass} onChange={(e) => setUPass(e.target.value)} placeholder="Mínimo 6 caracteres" /></FormControl>
                        <FormControl mb={2}><FormLabel>Despacho</FormLabel>
                            <Select placeholder="(opcional)" value={uDesp} onChange={(e) => setUDesp(e.target.value)}>
                                {despachos.map((d) => (<option key={d._id} value={d._id}>{d.tipo} - {d.nombre}</option>))}
                            </Select>
                        </FormControl>
                        <FormControl mb={4}><FormLabel>Rol</FormLabel>
                            <Select value={uRole} onChange={(e) => setURole(e.target.value as 'ADMIN' | 'USER')}>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </Select>
                        </FormControl>
                        <Button w="full" colorScheme="blue" onClick={createUser}>Crear</Button>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal Editar Usuario */}
            <Modal isOpen={userEditModal.isOpen} onClose={userEditModal.onClose} isCentered size="md">
                <ModalOverlay />
                <ModalContent maxW={{ base: '95%', md: '540px' }} mx={{ base: 2, md: 0 }}>
                    <ModalHeader>Editar Usuario</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <FormControl mb={2}><FormLabel>Nombre</FormLabel><Input value={eName} onChange={(e) => setEName(e.target.value)} /></FormControl>
                        <FormControl mb={2}><FormLabel>Email</FormLabel><Input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} /></FormControl>
                        <FormControl mb={2}><FormLabel>Despacho</FormLabel>
                            <Select placeholder="(opcional)" value={eDesp} onChange={(e) => setEDesp(e.target.value)}>
                                {despachos.map((d) => (<option key={d._id} value={d._id}>{d.tipo} - {d.nombre}</option>))}
                            </Select>
                        </FormControl>
                        <FormControl mb={4}><FormLabel>Rol</FormLabel>
                            <Select value={eRole} onChange={(e) => setERole(e.target.value as 'ADMIN' | 'USER')}>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </Select>
                        </FormControl>
                        <Button w="full" colorScheme="blue" onClick={async () => {
                            try {
                                if (!selUserId) return;
                                const payload: { name?: string; email?: string; role?: 'ADMIN' | 'USER'; despachoId?: string | null } = { name: eName, email: eEmail, role: eRole, despachoId: eDesp || null };
                                const res = await usersApi.update(selUserId, payload);
                                if (res.success) { toast({ title: 'Usuario actualizado', status: 'success', duration: 1500 }); userEditModal.onClose(); void loadUsuarios(selectedDespachoId); }
                            } catch {
                                toast({ title: 'No se pudo actualizar', status: 'error', duration: 2000 });
                            }
                        }}>Guardar</Button>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal Cambiar Contraseña */}
            <Modal isOpen={userPassModal.isOpen} onClose={userPassModal.onClose} isCentered size="sm">
                <ModalOverlay />
                <ModalContent maxW={{ base: '92%', md: '420px' }} mx={{ base: 2, md: 0 }}>
                    <ModalHeader>Cambiar contraseña</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <FormControl mb={3}><FormLabel>Nueva contraseña</FormLabel><Input type="password" value={pNew} onChange={(e) => setPNew(e.target.value)} placeholder="Mínimo 6 caracteres" /></FormControl>
                        <Button w="full" colorScheme="blue" isDisabled={!pNew || pNew.length < 6} onClick={async () => {
                            try {
                                if (!selUserId) return;
                                const res = await usersApi.resetPassword(selUserId, pNew);
                                if (res.success) { toast({ title: 'Contraseña actualizada', status: 'success', duration: 1500 }); userPassModal.onClose(); setPNew(''); }
                            } catch {
                                toast({ title: 'No se pudo cambiar la contraseña', status: 'error', duration: 2000 });
                            }
                        }}>Guardar</Button>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Confirmar eliminar usuario */}
            <ConfirmDialog
                isOpen={confirmUserDlg.isOpen}
                onClose={() => setConfirmUserDlg({ isOpen: false })}
                onConfirm={async () => {
                    try {
                        if (!confirmUserDlg.userId) return;
                        const res = await usersApi.delete(confirmUserDlg.userId);
                        if (res.success) { toast({ title: 'Usuario eliminado', status: 'success', duration: 1500 }); setConfirmUserDlg({ isOpen: false }); void loadUsuarios(selectedDespachoId); }
                    } catch {
                        toast({ title: 'No se pudo eliminar', status: 'error', duration: 2000 });
                    }
                }}
                title="Eliminar usuario"
                message={`¿Seguro que deseas eliminar a "${confirmUserDlg.name ?? ''}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                type="warning"
            />

            {/* Modal Crear Tema */}
            <Modal isOpen={temaModal.isOpen} onClose={temaModal.onClose} isCentered size="sm">
                <ModalOverlay />
                <ModalContent maxW={{ base: '92%', md: '420px' }} mx={{ base: 2, md: 0 }}>
                    <ModalHeader>Nuevo tema</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <FormControl mb={3}><FormLabel>Nombre</FormLabel><Input value={nuevoTema} onChange={(e) => setNuevoTema(e.target.value)} /></FormControl>
                        <Button w="full" colorScheme="blue" onClick={createTema}>Crear</Button>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal Editar Tema (minimalista) */}
            <Modal isOpen={temaEditModal.isOpen} onClose={temaEditModal.onClose} isCentered size="sm">
                <ModalOverlay />
                <ModalContent maxW={{ base: '92%', md: '420px' }} mx={{ base: 2, md: 0 }}>
                    <ModalHeader>Editar tema</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <FormControl mb={3}><FormLabel>Nuevo nombre</FormLabel><Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} /></FormControl>
                        <Button w="full" colorScheme="blue" onClick={async () => { if (temaEdit) { await temasApi.update(temaEdit._id, { nombre: editNombre }); temaEditModal.onClose(); setTemaEdit(null); void loadTemas(); } }}>Guardar</Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default AdminPage;


