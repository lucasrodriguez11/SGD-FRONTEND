import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Flex, Grid, GridItem, Heading, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Select, Spinner, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { BackBar } from '~/components/Layout/BackBar';
import { inboxApi, despachosApi, authUser, type Despacho } from '~/services/api';
import { connectInbox } from '~/services/ws';
import { useRouter } from 'next/router';
import { Plus, Search, Send } from 'lucide-react';

type Thread = { peerId: string; lastMessage?: { text: string; createdAt?: string; fromDespachoId: string; toDespachoId: string }; unread: number };

const InboxPage: React.FC = () => {
    const router = useRouter();
    const toast = useToast();
    const u = authUser.get<{ despachoId?: string }>();
    const myDespachoId = u?.despachoId ?? '';

    // Data
    const [threads, setThreads] = useState<Thread[]>([]);
    const [despachos, setDespachos] = useState<Despacho[]>([]);
    const [peerId, setPeerId] = useState<string>(typeof router.query?.to === 'string' ? router.query.to : '');
    const [history, setHistory] = useState<Array<{ _id?: string; fromDespachoId: string; toDespachoId: string; text: string; createdAt?: string }>>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // UI
    const [search, setSearch] = useState('');
    const [text, setText] = useState('');
    const newChat = useDisclosure();
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    // Track recently seen messages to avoid duplicates (history fetch + WS echo)
    const recentKeys = useRef<Set<string>>(new Set());

    const despachosById = useMemo(() => new Map(despachos.map(d => [d._id, d])), [despachos]);

    const loadBase = useCallback(async () => {
        const [d, t] = await Promise.allSettled([despachosApi.getActivos(), inboxApi.listThreads()]);
        if (d.status === 'fulfilled' && d.value.success && d.value.data) setDespachos(d.value.data.despachos);
        if (t.status === 'fulfilled' && t.value.success && t.value.data) setThreads(t.value.data.threads);
    }, []);

    useEffect(() => { void loadBase(); localStorage.setItem('inbox_unread', '0'); }, [loadBase]);

    useEffect(() => {
        if (peerId) void openThread(peerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [peerId]);

    const openThread = useCallback(async (id: string) => {
        if (!id) return;
        setPeerId(id);
        setLoadingHistory(true);
        setText('');
        // Clear recent de-dup set and show clean slate while loading
        recentKeys.current.clear();
        setHistory([]);
        try {
            const res = await inboxApi.listConversation(id, 200);
            if (res.success && res.data) {
                setHistory(res.data.messages);
                // Prime dedupe keys so WS echo doesn't duplicate
                for (const m of res.data.messages) {
                    const key = `${m.fromDespachoId}|${m.toDespachoId}|${m.text}|${m.createdAt ?? ''}`;
                    recentKeys.current.add(key);
                }
            }
            // mark read on backend and reset locally
            await inboxApi.readThread(id).catch(() => { /* ignore */ });
            setThreads(prev => prev.map(th => th.peerId === id ? { ...th, unread: 0 } : th));
        } catch {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    // WS updates
    useEffect(() => {
        const ws = connectInbox((m) => {
            // If message belongs to selected conversation, append
            if ((m.fromDespachoId === peerId && m.toDespachoId === myDespachoId) || (m.toDespachoId === peerId && m.fromDespachoId === myDespachoId)) {
                const key = `${m.fromDespachoId}|${m.toDespachoId}|${m.text}|${m.createdAt ?? ''}`;
                if (recentKeys.current.has(key)) return;
                recentKeys.current.add(key);
                setHistory((arr) => [...arr, { fromDespachoId: m.fromDespachoId, toDespachoId: m.toDespachoId, text: m.text, createdAt: m.createdAt }]);
            }
            // Update threads summary
            const otherId = m.fromDespachoId === myDespachoId ? m.toDespachoId : m.fromDespachoId;
            setThreads((arr) => {
                const exists = arr.find(t => t.peerId === otherId);
                const incUnread = m.toDespachoId === myDespachoId && otherId !== peerId ? 1 : 0;
                const updated = exists ? arr.map(t => t.peerId === otherId ? { peerId: otherId, lastMessage: m, unread: (t.unread ?? 0) + incUnread } : t)
                    : [{ peerId: otherId, lastMessage: m, unread: incUnread }, ...arr];
                return updated;
            });
        });
        return () => ws.close();
    }, [peerId, myDespachoId]);

    // autoscroll chat
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

    const send = async () => {
        if (!peerId || !text.trim()) return;
        try {
            const res = await inboxApi.sendMessage({ toDespachoId: peerId, text, fromDespachoId: myDespachoId });
            if (res.success && res.data?.message) {
                // Limpiamos input y dejamos que el WS agregue el mensaje (evita duplicados)
                setText('');
                setThreads(prev => prev.map(t => t.peerId === peerId ? { ...t, lastMessage: res.data!.message } : t));
            } else {
                toast({ title: 'No se pudo enviar', status: 'warning', duration: 2000 });
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
            const msg: string = e?.response?.data?.error?.message ?? e?.message ?? '';
            const pretty = /forbidden|not allowed|no autorizado|no pertenece/i.test(msg)
                ? 'No podés enviar mensajes desde este despacho.'
                : /fromDespachoId/i.test(msg)
                    ? 'Falta seleccionar tu despacho de origen.'
                    : 'No se pudo enviar el mensaje';
            toast({ title: pretty, status: 'error', duration: 2500 });
        }
    };

    const filteredThreads = threads.filter(t => {
        const name = despachosById.get(t.peerId)?.nombre ?? t.peerId;
        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <Container maxW="container.xl" py={8}>
            <BackBar title="Inbox" />
            <Grid templateColumns={{ base: '1fr', lg: '360px 1fr' }} gap={4}>
                {/* Threads list */}
                <GridItem>
                    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white">
                        <Box p={3} borderBottom="1px" borderColor="gray.200">
                            <InputGroup>
                                <InputLeftElement pointerEvents="none">
                                    <Icon as={Search} color="gray.400" />
                                </InputLeftElement>
                                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                <IconButton aria-label="Nuevo chat" icon={<Plus />} ml={2} onClick={newChat.onOpen} />
                            </InputGroup>
                        </Box>
                        <List maxH="70vh" overflowY="auto">
                            {filteredThreads.map((t) => {
                                const d = despachosById.get(t.peerId);
                                const last = t.lastMessage?.text ?? '';
                                return (
                                    <ListItem key={t.peerId} px={4} py={3} borderBottom="1px" borderColor="gray.100" cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => void openThread(t.peerId)}>
                                        <Flex align="center" gap={3}>
                                            <Box w={10} h={10} borderRadius="full" bg="blue.100" display="flex" alignItems="center" justifyContent="center" fontWeight="bold">{(d?.nombre ?? '??').slice(0, 2).toUpperCase()}</Box>
                                            <Box flex={1} minW={0}>
                                                <Text fontWeight="bold" noOfLines={1}>{d?.nombre ?? t.peerId}</Text>
                                                <Text fontSize="sm" color="gray.500" noOfLines={1}>{last}</Text>
                                            </Box>
                                            {t.unread > 0 && <Box bg="red.400" color="white" px={2} py={0.5} borderRadius="full" fontSize="xs">{t.unread}</Box>}
                                        </Flex>
                                    </ListItem>
                                );
                            })}
                            {filteredThreads.length === 0 && (
                                <Box p={4} color="gray.500">No hay conversaciones</Box>
                            )}
                        </List>
                    </Box>
                </GridItem>

                {/* Chat panel */}
                <GridItem minW={0}>
                    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" minH="75vh" display="flex" flexDirection="column">
                        <Flex align="center" justify="space-between" p={4} borderBottom="1px" borderColor="gray.200">
                            <Heading size="md">{despachosById.get(peerId)?.nombre ?? 'Selecciona un despacho'}</Heading>
                            {peerId && <Box w={2} h={2} bg="teal.500" borderRadius="full" />}
                        </Flex>
                        <Box flex={1} px={4} py={3} overflowY="auto">
                            {loadingHistory && <Flex justify="center" py={10}><Spinner /></Flex>}
                            {!loadingHistory && history.map((m, i) => (
                                <Flex key={i} justify={m.fromDespachoId === myDespachoId ? 'flex-end' : 'flex-start'} mb={2}>
                                    <Box bg={m.fromDespachoId === myDespachoId ? 'blue.500' : 'gray.100'} color={m.fromDespachoId === myDespachoId ? 'white' : 'gray.800'} px={3} py={2} borderRadius="lg" maxW="70%">{m.text}</Box>
                                </Flex>
                            ))}
                            <div ref={chatEndRef} />
                        </Box>
                        <HStack p={3} borderTop="1px" borderColor="gray.200">
                            <Input placeholder="Escribe un mensaje..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void send(); }} />
                            <IconButton aria-label="Enviar" icon={<Send />} colorScheme="blue" onClick={send} isDisabled={!peerId || !text.trim()} />
                        </HStack>
                    </Box>
                </GridItem>
            </Grid>

            {/* Nuevo chat */}
            <Modal isOpen={newChat.isOpen} onClose={newChat.onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Nuevo chat</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Select placeholder="Selecciona un despacho" onChange={async (e) => { const id = e.target.value; newChat.onClose(); await openThread(id); }}>
                            {despachos.map((d) => (<option key={d._id} value={d._id}>{d.tipo} · {d.nombre}</option>))}
                        </Select>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default InboxPage;


