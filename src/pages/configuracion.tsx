import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Container, FormControl, FormLabel, Heading, Input, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, Textarea, useToast } from '@chakra-ui/react';
import { authUser, despachosApi, usersApi, type Despacho, type CreateDespachoDto } from '~/services/api';

const ConfiguracionPage: React.FC = () => {
    const toast = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [user, setUser] = useState<{ name?: string; email?: string; despachoId?: string } | null>(null);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [despacho, setDespacho] = useState<Despacho | null>(null);
    const [resp, setResp] = useState('');
    const [dEmail, setDEmail] = useState('');
    const [tel, setTel] = useState('');
    const [desc, setDesc] = useState('');
    useEffect(() => {
        const u = authUser.get<{ name?: string; email?: string; despachoId?: string }>();
        if (u) {
            setUser(u);
            setName(u.name ?? '');
            setEmail(u.email ?? '');
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
        setResp(despacho?.responsable ?? '');
        setDEmail(despacho?.email ?? '');
        setTel(despacho?.telefono ?? '');
        setDesc('');
    }, [despacho]);

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
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                            </FormControl>
                            <Heading size="sm" mt={6}>Cambiar contraseña</Heading>
                            <FormControl>
                                <FormLabel>Contraseña actual</FormLabel>
                                <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Nueva contraseña</FormLabel>
                                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Confirmar nueva contraseña</FormLabel>
                                <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                            </FormControl>
                            <Button colorScheme="blue" w="full" onClick={async () => {
                                try {
                                    const res = await usersApi.meUpdate({ name, email });
                                    if (res.success && res.data?.user) {
                                        const prev = authUser.get() ?? {};
                                        authUser.set({ ...prev, ...res.data.user });
                                        toast({ title: 'Perfil actualizado', status: 'success', duration: 2000 });
                                    }
                                    if (newPass && newPass === confirmPass && currentPass) {
                                        const ch = await usersApi.changePassword({ currentPassword: currentPass, newPassword: newPass });
                                        if (ch.success) toast({ title: 'Contraseña actualizada', status: 'success', duration: 2000 });
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
                                <Input placeholder="Nombre del despacho" value={despacho?.nombre ?? ''} readOnly />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Código</FormLabel>
                                <Input value={despacho?.codigo ?? ''} readOnly />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Tipo</FormLabel>
                                <Input value={despacho?.tipo ?? ''} readOnly />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Responsable</FormLabel>
                                <Input placeholder="Responsable" value={resp} onChange={(e) => setResp(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input placeholder="email@ejemplo.com" value={dEmail} onChange={(e) => setDEmail(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Teléfono</FormLabel>
                                <Input placeholder="Teléfono" value={tel} onChange={(e) => setTel(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Descripción</FormLabel>
                                <Textarea placeholder="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} />
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
                                    const res = await despachosApi.update(user.despachoId, payload);
                                    if (res.success) {
                                        toast({ title: 'Despacho actualizado', status: 'success', duration: 2000 });
                                        const refreshed = await despachosApi.getById(user.despachoId);
                                        if (refreshed.success && refreshed.data) setDespacho(refreshed.data.despacho);
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


