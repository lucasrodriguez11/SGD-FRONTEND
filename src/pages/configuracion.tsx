import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Container, FormControl, FormLabel, Heading, HStack, Input, InputGroup, InputRightElement, IconButton, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, Textarea, useToast, useColorModeValue, Select } from '@chakra-ui/react';
import { authUser, despachosApi, usersApi, type Despacho, type CreateDespachoDto } from '~/services/api';
import { Eye, EyeOff, Edit2, Check } from 'lucide-react';

const ConfiguracionPage: React.FC = () => {
    const toast = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [user, setUser] = useState<{ name?: string; email?: string; despachoId?: string } | null>(null);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [despacho, setDespacho] = useState<Despacho | null>(null);
    const [despachoNombre, setDespachoNombre] = useState('');
    const [despachoCodigo, setDespachoCodigo] = useState('');
    const [despachoTipo, setDespachoTipo] = useState<string>('');
    const [resp, setResp] = useState('');
    const [dEmail, setDEmail] = useState('');
    const [tel, setTel] = useState('');
    const [desc, setDesc] = useState('');
    const [showCodigo, setShowCodigo] = useState(false);
    const [userRole, setUserRole] = useState<'ADMIN' | 'USER'>('USER');

    // Estados para modo edición - Perfil de Usuario
    const [editingUserName, setEditingUserName] = useState(false);
    const [editingUserEmail, setEditingUserEmail] = useState(false);

    // Estados para modo edición - Perfil de Despacho
    const [editingDespachoNombre, setEditingDespachoNombre] = useState(false);
    const [editingDespachoCodigo, setEditingDespachoCodigo] = useState(false);
    const [editingDespachoTipo, setEditingDespachoTipo] = useState(false);
    const [editingResponsable, setEditingResponsable] = useState(false);
    const [editingDespachoEmail, setEditingDespachoEmail] = useState(false);
    const [editingTelefono, setEditingTelefono] = useState(false);
    const [editingDescripcion, setEditingDescripcion] = useState(false);
    useEffect(() => {
        const u = authUser.get<{ name?: string; email?: string; despachoId?: string; role?: 'ADMIN' | 'USER' }>();
        if (u) {
            setUser(u);
            setName(u.name ?? '');
            setEmail(u.email ?? '');
            setUserRole(u.role ?? 'USER');
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!user?.despachoId) return;
            const res = await despachosApi.getById(user.despachoId);
            if (res.success && res.data) setDespacho(res.data.despacho);
        };
        void load();
    }, [user?.despachoId]);

    useEffect(() => {
        if (despacho) {
            setDespachoNombre(despacho.nombre ?? '');
            setDespachoCodigo(despacho.codigo ?? '');
            setDespachoTipo(despacho.tipo ?? '');
            setResp(despacho.responsable ?? '');
            setDEmail(despacho.email ?? '');
            setTel(despacho.telefono ?? '');
            setDesc(despacho.descripcion ?? '');
        }
    }, [despacho]);

    // Theme colors
    const inputBg = useColorModeValue('gray.50', 'gray.700');
    const inputBgEditing = useColorModeValue('white', 'gray.600');
    const inputColor = useColorModeValue('gray.900', 'gray.100');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Container maxW="container.md" py={10}>
            <Heading mb={6} textAlign="center">Configuración</Heading>
            <Tabs variant="enclosed">
                <TabList>
                    <Tab>Perfil de Usuario</Tab>
                    <Tab>Perfil de Despacho</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <VStack spacing={4} align="stretch">
                            <Box display="flex" alignItems="center" gap={4}>
                                <Avatar name={name ?? 'Usuario'} />
                                <Text color="gray.500">Actualiza tu información</Text>
                            </Box>
                            <FormControl>
                                <FormLabel>Nombre</FormLabel>
                                <InputGroup>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        readOnly={!editingUserName}
                                        bg={editingUserName ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        <IconButton
                                            aria-label={editingUserName ? 'Confirmar' : 'Editar'}
                                            icon={editingUserName ? <Check size={18} /> : <Edit2 size={18} />}
                                            size="sm"
                                            onClick={() => setEditingUserName(!editingUserName)}
                                            variant="ghost"
                                            colorScheme={editingUserName ? 'green' : 'gray'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <InputGroup>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        readOnly={!editingUserEmail}
                                        bg={editingUserEmail ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        <IconButton
                                            aria-label={editingUserEmail ? 'Confirmar' : 'Editar'}
                                            icon={editingUserEmail ? <Check size={18} /> : <Edit2 size={18} />}
                                            size="sm"
                                            onClick={() => setEditingUserEmail(!editingUserEmail)}
                                            variant="ghost"
                                            colorScheme={editingUserEmail ? 'green' : 'gray'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <Heading size="sm" mt={6}>Cambiar contraseña</Heading>
                            <FormControl>
                                <FormLabel>Contraseña actual</FormLabel>
                                <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} bg={inputBg} color={inputColor} borderColor={borderColor} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Nueva contraseña</FormLabel>
                                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} bg={inputBg} color={inputColor} borderColor={borderColor} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Confirmar nueva contraseña</FormLabel>
                                <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} bg={inputBg} color={inputColor} borderColor={borderColor} />
                            </FormControl>
                            <Button colorScheme="blue" w="full" onClick={async () => {
                                try {
                                    const res = await usersApi.meUpdate({ name, email });
                                    if (res.success && res.data?.user) {
                                        const prev = authUser.get() ?? {};
                                        authUser.set({ ...prev, ...res.data.user });
                                        toast({ title: 'Perfil actualizado', status: 'success', duration: 2000 });
                                        // Cerrar modos de edición
                                        setEditingUserName(false);
                                        setEditingUserEmail(false);
                                    }
                                    if (newPass && newPass === confirmPass && currentPass) {
                                        const ch = await usersApi.changePassword({ currentPassword: currentPass, newPassword: newPass });
                                        if (ch.success) {
                                            toast({ title: 'Contraseña actualizada', status: 'success', duration: 2000 });
                                            setCurrentPass('');
                                            setNewPass('');
                                            setConfirmPass('');
                                        }
                                    }
                                } catch {
                                    toast({ title: 'No se pudo guardar', status: 'error', duration: 2500 });
                                }
                            }}>Guardar</Button>
                        </VStack>
                    </TabPanel>
                    <TabPanel>
                        <VStack spacing={4} align="stretch">
                            <Heading size="sm">Perfil de Despacho</Heading>
                            <Box display="flex" alignItems="center" gap={4}>
                                <Avatar name={despacho?.nombre ?? 'Despacho'} bg="green.300" />
                                <Text color="gray.500">Este avatar se usa en el Perfil del despacho</Text>
                            </Box>
                            <FormControl>
                                <FormLabel>Nombre</FormLabel>
                                <InputGroup>
                                    <Input
                                        placeholder="Nombre del despacho"
                                        value={despachoNombre}
                                        onChange={(e) => setDespachoNombre(e.target.value)}
                                        readOnly={!editingDespachoNombre || userRole !== 'ADMIN'}
                                        bg={editingDespachoNombre && userRole === 'ADMIN' ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        {userRole === 'ADMIN' ? (
                                            <IconButton
                                                aria-label={editingDespachoNombre ? 'Confirmar' : 'Editar'}
                                                icon={editingDespachoNombre ? <Check size={18} /> : <Edit2 size={18} />}
                                                size="sm"
                                                onClick={() => setEditingDespachoNombre(!editingDespachoNombre)}
                                                variant="ghost"
                                                colorScheme={editingDespachoNombre ? 'green' : 'gray'}
                                            />
                                        ) : null}
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Código</FormLabel>
                                <InputGroup>
                                    <Input
                                        type={showCodigo ? 'text' : 'password'}
                                        value={despachoCodigo}
                                        onChange={(e) => setDespachoCodigo(e.target.value)}
                                        readOnly={!editingDespachoCodigo || userRole !== 'ADMIN'}
                                        bg={editingDespachoCodigo && userRole === 'ADMIN' ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                        placeholder="Código del despacho"
                                    />
                                    <InputRightElement width="6rem">
                                        <HStack spacing={1}>
                                            {userRole === 'ADMIN' && (
                                                <IconButton
                                                    aria-label={editingDespachoCodigo ? 'Confirmar' : 'Editar'}
                                                    icon={editingDespachoCodigo ? <Check size={18} /> : <Edit2 size={18} />}
                                                    size="sm"
                                                    onClick={() => setEditingDespachoCodigo(!editingDespachoCodigo)}
                                                    variant="ghost"
                                                    colorScheme={editingDespachoCodigo ? 'green' : 'gray'}
                                                />
                                            )}
                                            <IconButton
                                                aria-label={showCodigo ? 'Ocultar código' : 'Mostrar código'}
                                                icon={showCodigo ? <EyeOff size={18} /> : <Eye size={18} />}
                                                size="sm"
                                                onClick={() => setShowCodigo(!showCodigo)}
                                                variant="ghost"
                                            />
                                        </HStack>
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Tipo</FormLabel>
                                <InputGroup>
                                    <Select
                                        value={despachoTipo}
                                        onChange={(e) => setDespachoTipo(e.target.value)}
                                        isDisabled={!editingDespachoTipo || userRole !== 'ADMIN'}
                                        bg={editingDespachoTipo && userRole === 'ADMIN' ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    >
                                        <option value="DIRECCION">DIRECCION</option>
                                        <option value="SUBDIRECCIÓN">SUBDIRECCIÓN</option>
                                        <option value="AREA">AREA</option>
                                        <option value="DEPARTAMENTO">DEPARTAMENTO</option>
                                        <option value="SECRETARIA">SECRETARIA</option>
                                    </Select>
                                    <InputRightElement width="3rem">
                                        {userRole === 'ADMIN' ? (
                                            <IconButton
                                                aria-label={editingDespachoTipo ? 'Confirmar' : 'Editar'}
                                                icon={editingDespachoTipo ? <Check size={18} /> : <Edit2 size={18} />}
                                                size="sm"
                                                onClick={() => setEditingDespachoTipo(!editingDespachoTipo)}
                                                variant="ghost"
                                                colorScheme={editingDespachoTipo ? 'green' : 'gray'}
                                            />
                                        ) : null}
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Responsable</FormLabel>
                                <InputGroup>
                                    <Input
                                        placeholder="Responsable"
                                        value={resp}
                                        onChange={(e) => setResp(e.target.value)}
                                        readOnly={!editingResponsable}
                                        bg={editingResponsable ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        <IconButton
                                            aria-label={editingResponsable ? 'Confirmar' : 'Editar'}
                                            icon={editingResponsable ? <Check size={18} /> : <Edit2 size={18} />}
                                            size="sm"
                                            onClick={() => setEditingResponsable(!editingResponsable)}
                                            variant="ghost"
                                            colorScheme={editingResponsable ? 'green' : 'gray'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <InputGroup>
                                    <Input
                                        placeholder="email@ejemplo.com"
                                        value={dEmail}
                                        onChange={(e) => setDEmail(e.target.value)}
                                        readOnly={!editingDespachoEmail}
                                        bg={editingDespachoEmail ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        <IconButton
                                            aria-label={editingDespachoEmail ? 'Confirmar' : 'Editar'}
                                            icon={editingDespachoEmail ? <Check size={18} /> : <Edit2 size={18} />}
                                            size="sm"
                                            onClick={() => setEditingDespachoEmail(!editingDespachoEmail)}
                                            variant="ghost"
                                            colorScheme={editingDespachoEmail ? 'green' : 'gray'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Teléfono</FormLabel>
                                <InputGroup>
                                    <Input
                                        placeholder="Teléfono"
                                        value={tel}
                                        onChange={(e) => setTel(e.target.value)}
                                        readOnly={!editingTelefono}
                                        bg={editingTelefono ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                    />
                                    <InputRightElement width="3rem">
                                        <IconButton
                                            aria-label={editingTelefono ? 'Confirmar' : 'Editar'}
                                            icon={editingTelefono ? <Check size={18} /> : <Edit2 size={18} />}
                                            size="sm"
                                            onClick={() => setEditingTelefono(!editingTelefono)}
                                            variant="ghost"
                                            colorScheme={editingTelefono ? 'green' : 'gray'}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Descripción</FormLabel>
                                <InputGroup>
                                    <Textarea
                                        placeholder="Descripción"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        readOnly={!editingDescripcion}
                                        bg={editingDescripcion ? inputBgEditing : inputBg}
                                        color={inputColor}
                                        borderColor={borderColor}
                                        resize="vertical"
                                    />
                                </InputGroup>
                                <Box mt={2} display="flex" justifyContent="flex-end">
                                    <IconButton
                                        aria-label={editingDescripcion ? 'Confirmar' : 'Editar'}
                                        icon={editingDescripcion ? <Check size={18} /> : <Edit2 size={18} />}
                                        size="sm"
                                        onClick={() => setEditingDescripcion(!editingDescripcion)}
                                        variant="ghost"
                                        colorScheme={editingDescripcion ? 'green' : 'gray'}
                                    />
                                </Box>
                            </FormControl>
                            <Button colorScheme="blue" w="full" onClick={async () => {
                                try {
                                    if (!user?.despachoId || !despacho) return;
                                    const payload: Partial<CreateDespachoDto> & { descripcion?: string } = {
                                        responsable: resp ?? undefined,
                                        email: dEmail ?? undefined,
                                        telefono: tel ?? undefined,
                                        descripcion: desc ?? undefined,
                                    };
                                    // Si es ADMIN, también puede editar nombre, código y tipo
                                    if (userRole === 'ADMIN') {
                                        if (despachoNombre.trim()) payload.nombre = despachoNombre.trim();
                                        if (despachoCodigo.trim()) payload.codigo = despachoCodigo.trim().toUpperCase();
                                        if (despachoTipo.trim()) {
                                            const tipo = despachoTipo.trim() as 'DIRECCION' | 'SUBDIRECCIÓN' | 'AREA' | 'DEPARTAMENTO' | 'SECRETARIA';
                                            payload.tipo = tipo;
                                        }
                                    }
                                    const res = await despachosApi.update(user.despachoId, payload);
                                    if (res.success) {
                                        toast({ title: 'Despacho actualizado', status: 'success', duration: 2000 });
                                        const refreshed = await despachosApi.getById(user.despachoId);
                                        if (refreshed.success && refreshed.data) {
                                            setDespacho(refreshed.data.despacho);
                                            // Cerrar todos los modos de edición
                                            setEditingDespachoNombre(false);
                                            setEditingDespachoCodigo(false);
                                            setEditingDespachoTipo(false);
                                            setEditingResponsable(false);
                                            setEditingDespachoEmail(false);
                                            setEditingTelefono(false);
                                            setEditingDescripcion(false);
                                        }
                                    }
                                } catch {
                                    toast({ title: 'No se pudo guardar', status: 'error', duration: 2500 });
                                }
                            }}>Guardar</Button>
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    );
};

export default ConfiguracionPage;


