import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Heading, useToast, FormControl, FormLabel, Input, Select, SimpleGrid, Flex, Text, Icon, useColorModeValue, Badge, Table, Thead, Tbody, Tr, Th, Td, Switch, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Grid, GridItem } from '@chakra-ui/react';
import { Building2, Users as UsersIcon, UserPlus, Tag } from 'lucide-react';
import { BackBar } from '~/components/Layout/BackBar';
import { authToken, despachosApi, temasApi, usersApi, type Despacho, type Tema, type CreateDespachoDto } from '~/services/api';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { FiltrosDespacho } from '~/components/Despachos/FiltrosDespacho';
import { DespachosTable } from '~/components/Despachos/DespachosTable';
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
    const [activePanel, setActivePanel] = useState<'usuarios' | 'temas' | 'despachos' | null>(null);
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
    const [confirmDlg, setConfirmDlg] = useState<{ isOpen: boolean; despacho: Despacho | null; action: 'delete' | 'activate' | null }>({ isOpen: false, despacho: null, action: null });

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
        try {
            if (isDelete) {
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
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Flex
                    align="center"
                    justify="space-between"
                    p={6}
                    borderRadius="lg"
                    bg={activePanel === 'despachos' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'despachos' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('despachos'); void fetchDespachos(1, {}); }}
                >
                    <Flex align="center" gap={3}><Icon as={Building2} color={activePanel === 'despachos' ? activeText : 'blue.500'} /> <Text fontWeight="bold" color={activePanel === 'despachos' ? activeText : undefined}>Despachos</Text></Flex>
                    <Badge colorScheme="blue">GESTIONAR</Badge>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    p={6}
                    borderRadius="lg"
                    bg={activePanel === 'usuarios' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'usuarios' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('usuarios'); void loadDespachos(); if (selectedDespachoId) void loadUsuarios(selectedDespachoId); }}
                >
                    <Flex align="center" gap={3}><Icon as={UsersIcon} color={activePanel === 'usuarios' ? activeText : 'blue.500'} /> <Text fontWeight="bold" color={activePanel === 'usuarios' ? activeText : undefined}>Usuarios</Text></Flex>
                    <Badge colorScheme="blue">GESTIONAR</Badge>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    p={6}
                    borderRadius="lg"
                    bg={activePanel === 'temas' ? activeBg : cardBg}
                    borderWidth="1px"
                    borderColor={activePanel === 'temas' ? activeBorder : border}
                    shadow="sm"
                    cursor="pointer"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => { setActivePanel('temas'); void loadTemas(); }}
                >
                    <Flex align="center" gap={3}><Icon as={Tag} color={activePanel === 'temas' ? activeText : 'blue.500'} /> <Text fontWeight="bold" color={activePanel === 'temas' ? activeText : undefined}>Temas</Text></Flex>
                    <Badge colorScheme="blue">GESTIONAR</Badge>
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
                                                        <Button size="xs" mr={2} onClick={async () => { const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN'; await usersApi.changeRole(u._id, newRole); toast({ title: 'Rol actualizado', status: 'success', duration: 1500 }); void loadUsuarios(selectedDespachoId); }}>Rol</Button>
                                                        <Button size="xs" mr={2} onClick={() => { setSelUserId(u._id); setEName(u.name); setEEmail(u.email); setERole(u.role); setEDesp(u.despachoId ?? ''); userEditModal.onOpen(); }}>Editar</Button>
                                                        <Button size="xs" mr={2} onClick={() => { setSelUserId(u._id); setPNew(''); userPassModal.onOpen(); }}>Contraseña</Button>
                                                        <Button size="xs" colorScheme="red" onClick={() => setConfirmUserDlg({ isOpen: true, userId: u._id, name: u.name })}>Eliminar</Button>
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
                                                        <Button size="xs" mr={2} onClick={() => { setTemaEdit(t); setEditNombre(t.nombre); temaEditModal.onOpen(); }}>Editar</Button>
                                                        <Button size="xs" colorScheme="red" onClick={async () => { await temasApi.remove(t._id); void loadTemas(); }}>Eliminar</Button>
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
                    <Flex justify="flex-end" align="center" mb={4}>
                        <Button colorScheme="blue" onClick={() => { setSelectedDespacho(null); despModal.onOpen(); }}>Nuevo Despacho</Button>
                    </Flex>
                    <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
                        <GridItem>
                            <FiltrosDespacho onFilter={(f) => { setDespFilters(f); setDespPage(1); void fetchDespachos(1, f); }} onClear={() => { setDespFilters({}); setDespPage(1); void fetchDespachos(1, {}); }} />
                        </GridItem>
                        <GridItem minW={0}>
                            <DespachosTable
                                despachos={despList}
                                isLoading={despLoading}
                                totalPages={despTotalPages}
                                currentPage={despPage}
                                onPageChange={(p) => { setDespPage(p); void fetchDespachos(p, despFilters); }}
                                onEdit={(d) => { setSelectedDespacho(d); despModal.onOpen(); }}
                                onDelete={(d) => setConfirmDlg({ isOpen: true, despacho: d, action: 'delete' })}
                                onActivate={(d) => setConfirmDlg({ isOpen: true, despacho: d, action: 'activate' })}
                            />
                        </GridItem>
                    </Grid>

                    <DespachoModal isOpen={despModal.isOpen} onClose={despModal.onClose} onSubmit={handleSubmitDespacho} initial={selectedDespacho} />
                    <ConfirmDialog
                        isOpen={confirmDlg.isOpen}
                        onClose={() => setConfirmDlg({ isOpen: false, despacho: null, action: null })}
                        onConfirm={handleConfirmDespacho}
                        title={confirmDlg.action === 'delete' ? 'Desactivar Despacho' : 'Activar Despacho'}
                        message={confirmDlg.action === 'delete' ? `¿Estás seguro de que deseas desactivar el despacho "${confirmDlg.despacho?.nombre}"?` : `¿Estás seguro de que deseas activar el despacho "${confirmDlg.despacho?.nombre}"?`}
                        confirmText={confirmDlg.action === 'delete' ? 'Desactivar' : 'Activar'}
                        type={confirmDlg.action === 'delete' ? 'warning' : 'success'}
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


