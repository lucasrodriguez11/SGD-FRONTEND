import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, Input, SimpleGrid, Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from '@chakra-ui/react';
import { authApi, authToken, authUser } from '~/services/api';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/router';

// registro de entidad deshabilitado

const LoginPage: React.FC = () => {
    const toast = useToast();
    const router = useRouter();

    // Login
    const [email, setEmail] = useState(process.env.NODE_ENV !== 'production' ? 'user@admin.com' : '');
    const [password, setPassword] = useState(process.env.NODE_ENV !== 'production' ? '1230' : '');

    // Registro deshabilitado; se mantiene solo el tab de login

    const handleLogin = async () => {
        try {
            const res = await authApi.login({ email, password });
            if (res.success && res.data) {
                authToken.set(res.data.token);
                authUser.set(res.data.user);
                toast({ title: 'Bienvenido', status: 'success', duration: 2000 });
                void router.push('/');
            }
        } catch (error) {
            const err = error as AxiosError<{ error?: { message?: string } }>;
            const status = err.response?.status;
            const apiMsg = err.response?.data?.error?.message;
            let message = 'Error de autenticación';
            if (status === 400 || status === 401) {
                message = 'Credenciales inválidas. Verifica tu email y contraseña.';
            } else if (status === 429) {
                message = 'Demasiados intentos. Intenta nuevamente en unos minutos.';
            } else if (!status) {
                message = 'No se pudo conectar con el servidor.';
            } else if (apiMsg) {
                message = apiMsg;
            }
            toast({ title: message, status: 'error', duration: 3000 });
        }
    };

    // Registro con código de despacho
    const [name, setName] = useState('');
    const [codigo, setCodigo] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const handleRegister = async () => {
        try {
            const res = await authApi.registerWithCode({ name, email: regEmail, password: regPassword, codigo });
            if (res.success && res.data) {
                authToken.set(res.data.token);
                authUser.set(res.data.user);
                toast({ title: 'Cuenta creada', status: 'success', duration: 2000 });
                void router.push('/');
            }
        } catch {
            toast({ title: 'No se pudo registrar. Verifica el código y los datos.', status: 'error', duration: 3000 });
        }
    };

    // Registro deshabilitado

    return (
        <Box minH="100vh" bgGradient="linear(to-b, blue.50, white)" display="flex" alignItems="center" justifyContent="center" px={4}>
            <Box w="full" maxW="520px" bg="white" borderRadius="3xl" boxShadow="2xl" p={8}>
                <Heading textAlign="center" mb={6} fontWeight="extrabold">Bienvenido</Heading>

                <Tabs isFitted variant="enclosed" mb={4}>
                    <TabList>
                        <Tab bg="blue.50" _selected={{ bg: 'blue.100', color: 'blue.800' }} borderTopLeftRadius="md" borderTopRightRadius="md">Ingresar</Tab>
                        <Tab bg="blue.50" _selected={{ bg: 'blue.100', color: 'blue.800' }} borderTopLeftRadius="md" borderTopRightRadius="md">Crear cuenta</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel px={0}>
                            <SimpleGrid columns={1} spacing={4}>
                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@admin.com" size="lg" borderRadius="lg" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Contraseña</FormLabel>
                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" size="lg" borderRadius="lg" />
                                </FormControl>
                                <Button colorScheme="blue" size="lg" borderRadius="lg" onClick={handleLogin}>Ingresar</Button>
                            </SimpleGrid>
                        </TabPanel>
                        <TabPanel px={0}>
                            <SimpleGrid columns={1} spacing={4}>
                                <FormControl>
                                    <FormLabel>Nombre</FormLabel>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" size="lg" borderRadius="lg" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="tu@email.com" size="lg" borderRadius="lg" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Contraseña</FormLabel>
                                    <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••" size="lg" borderRadius="lg" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Código de Despacho</FormLabel>
                                    <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: CULTURA-001" size="lg" borderRadius="lg" />
                                </FormControl>
                                <Button variant="solid" colorScheme="blue" size="lg" borderRadius="lg" onClick={handleRegister}>Crear cuenta</Button>
                            </SimpleGrid>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Box>
    );
};

export default LoginPage;


