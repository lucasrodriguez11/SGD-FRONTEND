import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  useDisclosure,
  Flex,
  Text,
  Icon,
  useColorModeValue,
  useToast,
  Badge,
  SimpleGrid,
  Button,
} from '@chakra-ui/react';
import { FaFileAlt, FaExchangeAlt } from 'react-icons/fa';
import { Users, Inbox, Compass, Building2 } from 'lucide-react';
import { authUser } from '~/services/api';
import { connectNotifications, connectInbox, type NotificationWS } from '~/services/ws';
import { useRouter } from 'next/router';
import { ExpedienteModal } from '../components/Expedientes/ExpedienteModal';
import { MovimientoModal } from '../components/Expedientes/MovimientoModal';
import { expedientesApi, movimientosApi, recepcionesApi, type Expediente, type CreateExpedienteDto, type CreateMovimientoDto } from '~/services/api';

const HomePage = () => {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const toast = useToast();
  const router = useRouter();

  const {
    isOpen: isExpedienteModalOpen,
    onOpen: onExpedienteModalOpen,
    onClose: onExpedienteModalClose,
  } = useDisclosure();

  const {
    isOpen: isMovimientoModalOpen,
    onOpen: onMovimientoModalOpen,
    onClose: onMovimientoModalClose,
  } = useDisclosure();

  const fetchExpedientes = useCallback(async () => {
    try {
      const result = await expedientesApi.list();
      if (result.success && result.data) {
        setExpedientes(result.data.expedientes);
      }
    } catch (error) {
      console.error('Error al cargar expedientes:', error);
      toast({
        title: 'Error al cargar expedientes',
        status: 'error',
        duration: 3000,
      });
    }
  }, [toast]);

  useEffect(() => {
    void fetchExpedientes();
  }, [fetchExpedientes]);

  // local notifications list
  const notifSeed: { title: string; text: string; color: 'blue' | 'orange' | 'gray' }[] = [
    { title: 'EXPEDIENTE_ARCHIVADO', text: 'Expediente 0023 - Reclamo de luminarias fue archivado en Despacho...', color: 'blue' },
    { title: 'NUEVO_MOVIMIENTO', text: 'Expediente 0240 fue enviado a Área de...', color: 'orange' },
    { title: 'Archivo Job de Archivado', text: 'Automático cada 5 minutos', color: 'gray' },
  ];
  const [notifList, setNotifList] = useState(notifSeed);
  const [unread, setUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [recepUnread, setRecepUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = authUser.get<{ role?: 'ADMIN' | 'USER'; despachoId?: string }>();
    setIsAdmin((u?.role ?? 'USER') === 'ADMIN');
    const storedNotif = parseInt(localStorage.getItem('notif_unread') ?? '0', 10);
    const storedInbox = parseInt(localStorage.getItem('inbox_unread') ?? '0', 10);
    const storedRecep = parseInt(localStorage.getItem('recep_unread') ?? '0', 10);
    if (!Number.isNaN(storedNotif)) setUnread(storedNotif);
    if (!Number.isNaN(storedInbox)) setInboxUnread(storedInbox);
    if (!Number.isNaN(storedRecep)) setRecepUnread(storedRecep);
    if (u?.despachoId) {
      void recepcionesApi.pendingByDespacho(u.despachoId).then((res) => {
        if (res.success && res.data) {
          const c = res.data.recepciones.length;
          setRecepUnread(c);
          localStorage.setItem('recep_unread', String(c));
        }
      }).catch(() => { /* ignore network error */ });
    }
  }, []);

  // WS notifications: prepend in panel
  useEffect(() => {
    const ws = connectNotifications((n: NotificationWS) => {
      if (n.type === 'EXPEDIENTE_REGISTRADO' || n.type === 'EXPEDIENTE_CREADO') {
        toast({ title: `Expediente ${n.numeroExpediente} registrado`, status: 'info', duration: 2500 });
      }
      if (n.type === 'EXPEDIENTE_RECIBIDO') {
        setRecepUnread((c) => { const v = c + 1; localStorage.setItem('recep_unread', String(v)); return v; });
      }
      setUnread((c) => {
        const v = c + 1;
        localStorage.setItem('notif_unread', String(v));
        return v;
      });
      const text = n.message ?? (n.type === 'EXPEDIENTE_REGISTRADO' ? `Registrado en ${n.despachoActual}` : n.type);
      setNotifList((prev) => [{ title: n.type, text, color: 'blue' as const }, ...prev].slice(0, 20));
    });
    return () => ws.close();
  }, [toast]);

  useEffect(() => {
    const ws = connectInbox(() => {
      setInboxUnread((c) => c + 1);
    });
    return () => ws.close();
  }, []);

  const handleExpedienteSubmit = async (data: CreateExpedienteDto) => {
    try {
      await expedientesApi.create(data);
      toast({
        title: 'Expediente registrado con éxito',
        status: 'success',
        duration: 3000
      });
      void fetchExpedientes();
      onExpedienteModalClose();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Error al crear expediente';
      toast({
        title: message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleMovimientoSubmit = async (data: CreateMovimientoDto) => {
    try {
      await movimientosApi.create(data);
      toast({
        title: 'Movimiento registrado con éxito',
        status: 'success',
        duration: 3000
      });
      void fetchExpedientes(); // Refrescar para ver cambios
      onMovimientoModalClose();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Error al registrar movimiento';
      toast({
        title: message,
        status: 'error',
        duration: 3000
      });
    }
  };

  // UI colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const border = useColorModeValue('gray.200', 'gray.700');
  const subtle = useColorModeValue('gray.600', 'gray.300');

  const Card: React.FC<{
    icon: React.ReactElement;
    title: string;
    cta: string;
    colorScheme: 'blue' | 'green' | 'gray';
    onClick: () => void;
    badgeCount?: number;
  }> = ({ icon, title, cta, colorScheme, onClick }) => (
    <Flex
      flexDir="column"
      align="center"
      p={6}
      borderRadius="lg"
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      shadow="sm"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onClick}
      minH="120px"
    >
      <Box mb={3} position="relative">
        {icon}
        {unread > 0 && title === 'Notificaciones' && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full">{unread}</Badge>
        )}
        {inboxUnread > 0 && title === 'Inbox' && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full">{inboxUnread}</Badge>
        )}
        {recepUnread > 0 && title === 'Recepcionar' && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full">{recepUnread}</Badge>
        )}
      </Box>
      <Text fontSize="lg" fontWeight="bold" mb={1} textAlign="center">
        {title}
      </Text>
      <Badge colorScheme={colorScheme}>{cta}</Badge>
    </Flex>
  );

  const itemBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <Container maxW="container.xl" py={10}>
      <Flex gap={6} align="start" direction={{ base: 'column', lg: 'row' }}>
        {/* Left: Actions grid */}
        <Box flex="2">
          {/* Row 1 */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Card
              icon={<Icon as={Compass} boxSize={9} color="blue.400" />}
              title="Explorar"
              cta="ABRIR"
              colorScheme="blue"
              onClick={() => router.push('/buscar')}
            />
            <Card
              icon={<Icon as={FaFileAlt} boxSize={9} color="blue.500" />}
              title="Registrar Expediente"
              cta="REGISTRAR"
              colorScheme="blue"
              onClick={onExpedienteModalOpen}
            />
          </SimpleGrid>

          {/* Row 2 */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Card
              icon={<Icon as={FaExchangeAlt} boxSize={9} color="blue.400" />}
              title="Recepcionar Expediente"
              cta="ABRIR"
              colorScheme="blue"
              onClick={() => { setRecepUnread(0); localStorage.setItem('recep_unread', '0'); void router.push('/recepcion'); }}
            />
            <Card
              icon={<Icon as={FaExchangeAlt} boxSize={9} color="green.500" />}
              title="Enviar Expediente"
              cta="ENVIAR"
              colorScheme="green"
              onClick={onMovimientoModalOpen}
            />
          </SimpleGrid>

          {/* Row 3 */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Card
              icon={<Icon as={Inbox} boxSize={9} color="blue.400" />}
              title="Inbox"
              cta="ABRIR"
              colorScheme="blue"
              onClick={() => { setInboxUnread(0); localStorage.setItem('inbox_unread', '0'); void router.push('/inbox'); }}
            />
            <Card
              icon={<Icon as={Building2} boxSize={9} color="blue.400" />}
              title="Despacho"
              cta="VER"
              colorScheme="blue"
              onClick={() => router.push('/perfil')}
            />
          </SimpleGrid>

          {isAdmin && (
            <Box>
              <Flex
                align="center"
                justify="space-between"
                p={6}
                borderRadius="lg"
                bg={cardBg}
                borderWidth="1px"
                borderColor={border}
                shadow="sm"
              >
                <Flex align="center" gap={3}>
                  <Icon as={Users} color="blue.500" />
                  <Text fontSize="lg" fontWeight="bold">
                    Gestión Admin
                  </Text>
                </Flex>
                <Button size="sm" onClick={() => router.push('/admin')}>
                  Abrir
                </Button>
              </Flex>
            </Box>
          )}
        </Box>

        {/* Right: Notifications panel */}
        <Box flex="1" w="full">
          <Box
            p={5}
            borderRadius="lg"
            bg={cardBg}
            border="1px"
            borderColor={border}
            shadow="sm"
          >
            <Flex align="center" justify="space-between" mb={2}>
              <Heading size="md">Feed</Heading>
            </Flex>
            <Box maxH="520px" minH="520px" overflowY="auto" pr={1}>
              <VStack spacing={3} align="stretch">
                {notifList.map((n, idx) => (
                  <Box key={idx} p={3} borderRadius="md" bg={itemBg}>
                    <Flex align="center" gap={2} mb={1}>
                      <Badge colorScheme={n.color}>{n.title}</Badge>
                      <Text fontSize="xs" color={subtle}>ahora</Text>
                    </Flex>
                    <Text fontSize="sm" color={subtle}>{n.text}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Box>
        </Box>
      </Flex>

      <ExpedienteModal isOpen={isExpedienteModalOpen} onClose={onExpedienteModalClose} onSubmit={handleExpedienteSubmit} />
      <MovimientoModal isOpen={isMovimientoModalOpen} onClose={onMovimientoModalClose} onSubmit={handleMovimientoSubmit} expedientes={expedientes} />
    </Container>
  );
};

export default HomePage;
