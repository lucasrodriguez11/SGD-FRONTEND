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
import { expedientesApi, movimientosApi, recepcionesApi, despachosApi, type Expediente, type CreateExpedienteDto, type CreateMovimientoDto, type Movimiento } from '~/services/api';
import type { AxiosError } from 'axios';

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

  // Feed de movimientos del despacho
  interface FeedItem {
    id: string;
    type: string;
    title: string;
    text: string;
    color: 'blue' | 'orange' | 'green' | 'gray' | 'purple' | 'red';
    fecha: Date;
    movimiento?: Movimiento;
  }
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [despachoNombre, setDespachoNombre] = useState<string>('');
  const [unread, setUnread] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [recepUnread, setRecepUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Cargar nombre del despacho y movimientos iniciales
  useEffect(() => {
    const u = authUser.get<{ role?: 'ADMIN' | 'USER'; despachoId?: string }>();
    setIsAdmin((u?.role ?? 'USER') === 'ADMIN');
    const storedNotif = parseInt(localStorage.getItem('notif_unread') ?? '0', 10);
    const storedInbox = parseInt(localStorage.getItem('inbox_unread') ?? '0', 10);
    const storedRecep = parseInt(localStorage.getItem('recep_unread') ?? '0', 10);
    if (!Number.isNaN(storedNotif)) setUnread(storedNotif);
    if (!Number.isNaN(storedInbox)) setInboxUnread(storedInbox);
    if (!Number.isNaN(storedRecep)) setRecepUnread(storedRecep);

    const loadDespachoAndMovimientos = async () => {
      if (!u?.despachoId) return;

      // Cargar nombre del despacho
      try {
        const despRes = await despachosApi.getById(u.despachoId);
        if (despRes.success && despRes.data?.despacho?.nombre) {
          const nombre = despRes.data.despacho.nombre;
          setDespachoNombre(nombre);

          // Cargar movimientos del despacho
          const movRes = await movimientosApi.getByDespacho(nombre);
          if (movRes.success && movRes.data?.movimientos) {
            const items: FeedItem[] = movRes.data.movimientos
              .slice(0, 30) // Limitar a 30 más recientes
              .map((mov) => {
                const expedienteNum = typeof mov.expedienteId === 'object' && mov.expedienteId && 'numeroExpediente' in mov.expedienteId
                  ? (mov.expedienteId as { numeroExpediente: string }).numeroExpediente
                  : String(mov.expedienteId);

                let title = '';
                let text = '';
                let color: FeedItem['color'] = 'blue';

                if (mov.estado === 'ENVIADO') {
                  title = 'EXPEDIENTE ENVIADO';
                  text = `Expediente ${expedienteNum} fue enviado de ${mov.despachoAnterior} a ${mov.despachoNuevo}`;
                  color = 'orange';
                } else if (mov.estado === 'RECEPCIONADO') {
                  title = 'EXPEDIENTE RECEPCIONADO';
                  const responsable = mov.usuarioResponsable || '—';
                  text = `Expediente ${expedienteNum} fue recibido por ${responsable} en ${mov.despachoNuevo}`;
                  color = 'green';
                } else if (mov.estado === 'ARCHIVADO') {
                  title = 'EXPEDIENTE ARCHIVADO';
                  text = `Expediente ${expedienteNum} fue archivado en ${mov.despachoNuevo || mov.despachoAnterior}`;
                  color = 'gray';
                } else if (mov.estado === 'RECHAZADO') {
                  title = 'EXPEDIENTE RECHAZADO';
                  text = `Expediente ${expedienteNum} rechazado por ${mov.despachoNuevo} (devuelto a ${mov.despachoAnterior})`;
                  color = 'red';
                }

                if (mov.fojasAgregadas > 0) {
                  text += ` (+${mov.fojasAgregadas} fojas)`;
                }

                return {
                  id: mov._id || `mov-${Date.now()}-${Math.random()}`,
                  type: mov.estado,
                  title,
                  text,
                  color,
                  fecha: new Date(mov.fechaMovimiento),
                  movimiento: mov,
                };
              });

            // Ordenar por fecha más reciente primero
            items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
            setFeedItems(items);
          }
        }
      } catch (error) {
        console.error('Error loading despacho/movimientos:', error);
      }

      // Cargar recepciones pendientes
      if (u.despachoId) {
        void recepcionesApi.pendingByDespacho(u.despachoId).then((res) => {
          if (res.success && res.data) {
            const c = res.data.recepciones.length;
            setRecepUnread(c);
            localStorage.setItem('recep_unread', String(c));
          }
        }).catch(() => { /* ignore network error */ });
      }
    };

    void loadDespachoAndMovimientos();
  }, []);

  // WebSocket para actualizar feed en tiempo real
  useEffect(() => {
    const u = authUser.get<{ despachoId?: string }>();
    if (!u?.despachoId || !despachoNombre) return;

    const ws = connectNotifications((n: NotificationWS) => {
      // Actualizar badge de recepciones
      if (n.type === 'EXPEDIENTE_RECIBIDO' || n.type === 'NUEVO_MOVIMIENTO') {
        setRecepUnread((c) => {
          const v = c + 1;
          localStorage.setItem('recep_unread', String(v));
          return v;
        });
        if (u.despachoId) {
          void recepcionesApi.pendingByDespacho(u.despachoId).then((res) => {
            if (res.success && res.data) {
              const c = res.data.recepciones.length;
              setRecepUnread(c);
              localStorage.setItem('recep_unread', String(c));
            }
          }).catch(() => { /* ignore */ });
        }
      }

      // Agregar al feed según el tipo de notificación
      if (n.type === 'NUEVO_MOVIMIENTO' || n.type === 'EXPEDIENTE_RECIBIDO' || n.type === 'EXPEDIENTE_CONFIRMADO' || n.type === 'EXPEDIENTE_ARCHIVADO' || n.type === 'EXPEDIENTE_REGISTRADO' || n.type === 'EXPEDIENTE_RECHAZADO') {
        // Recargar movimientos del despacho para obtener el último
        void movimientosApi.getByDespacho(despachoNombre).then((res) => {
          const ultimoMov = res.data?.movimientos?.[0];
          if (res.success && ultimoMov) {
            const expedienteNum = typeof ultimoMov.expedienteId === 'object' && ultimoMov.expedienteId && 'numeroExpediente' in ultimoMov.expedienteId
              ? (ultimoMov.expedienteId as { numeroExpediente: string }).numeroExpediente
              : String(ultimoMov.expedienteId);

            let title = '';
            let text = '';
            let color: FeedItem['color'] = 'blue';

            if (ultimoMov.estado === 'ENVIADO') {
              title = 'EXPEDIENTE ENVIADO';
              text = `Expediente ${expedienteNum} fue enviado de ${ultimoMov.despachoAnterior} a ${ultimoMov.despachoNuevo}`;
              color = 'orange';
            } else if (ultimoMov.estado === 'RECEPCIONADO') {
              title = 'EXPEDIENTE RECEPCIONADO';
              const responsable = ultimoMov.usuarioResponsable || '—';
              text = `Expediente ${expedienteNum} fue recibido por ${responsable} en ${ultimoMov.despachoNuevo}`;
              color = 'green';
            } else if (ultimoMov.estado === 'ARCHIVADO') {
              title = 'EXPEDIENTE ARCHIVADO';
              text = `Expediente ${expedienteNum} fue archivado en ${ultimoMov.despachoNuevo || ultimoMov.despachoAnterior}`;
              color = 'gray';
            } else if (ultimoMov.estado === 'RECHAZADO') {
              title = 'EXPEDIENTE RECHAZADO';
              text = `Expediente ${expedienteNum} rechazado por ${ultimoMov.despachoNuevo} (devuelto a ${ultimoMov.despachoAnterior})`;
              color = 'red';
            }

            if (ultimoMov.fojasAgregadas > 0) {
              text += ` (+${ultimoMov.fojasAgregadas} fojas)`;
            }

            const newItem: FeedItem = {
              id: ultimoMov._id || `mov-${Date.now()}`,
              type: ultimoMov.estado,
              title,
              text,
              color,
              fecha: new Date(ultimoMov.fechaMovimiento),
              movimiento: ultimoMov,
            };

            setFeedItems((prev) => {
              // Evitar duplicados
              const exists = prev.some(p => p.id === newItem.id);
              if (exists) return prev;
              return [newItem, ...prev].slice(0, 50); // Mantener máximo 50 items
            });
          }
        }).catch(() => { /* ignore */ });
      }

      setUnread((c) => {
        const v = c + 1;
        localStorage.setItem('notif_unread', String(v));
        return v;
      });
    }, u.despachoId);

    return () => ws.close();
  }, [despachoNombre, toast]);

  useEffect(() => {
    const ws = connectInbox(() => {
      setInboxUnread((c) => c + 1);
    });
    return () => ws.close();
  }, []);

  const handleExpedienteSubmit = async (data: CreateExpedienteDto) => {
    try {
      const res = await expedientesApi.create(data);
      const numero = res?.data?.expediente?.numeroExpediente ?? data.numeroExpediente;
      toast({ title: `Expediente "${numero}" fue registrado con éxito`, status: 'success', duration: 3000 });
      void fetchExpedientes();
      onExpedienteModalClose();
    } catch (err: unknown) {
      // Mostrar mensaje del backend (p.ej., EXPEDIENTE_DUPLICATE 409)
      const e = err as AxiosError<{ error?: { message?: string } }>;
      const message = e.response?.data?.error?.message ?? e.message ?? 'Error al crear expediente';
      toast({ title: message, status: 'error', duration: 3000 });
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
  }> = ({ icon, title, cta, colorScheme, onClick, badgeCount }) => (
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
        {(badgeCount !== undefined && badgeCount > 0) && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full" minW="20px" textAlign="center">{badgeCount}</Badge>
        )}
        {unread > 0 && title === 'Notificaciones' && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full">{unread}</Badge>
        )}
        {inboxUnread > 0 && title === 'Inbox' && (
          <Badge position="absolute" top="-6px" right="-10px" colorScheme="red" borderRadius="full">{inboxUnread}</Badge>
        )}
      </Box>
      <Text fontSize="lg" fontWeight="bold" mb={1} textAlign="center">
        {title}
      </Text>
      <Badge colorScheme={colorScheme}>{cta}</Badge>
    </Flex>
  );

  const itemBg = useColorModeValue('gray.50', 'gray.800');

  // Función para calcular tiempo relativo
  const getTimeAgo = (fecha: Date): string => {
    const now = new Date();
    const diff = now.getTime() - fecha.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'hace un momento';
    if (minutes < 60) return `hace ${minutes} min${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;

    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: fecha.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

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
              badgeCount={recepUnread}
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

        {/* Feed panel - Responsive */}
        <Box flex={{ base: '1', lg: '1' }} w="full" minW={0}>
          <Box
            p={{ base: 4, md: 5 }}
            borderRadius="lg"
            bg={cardBg}
            border="1px"
            borderColor={border}
            shadow="sm"
            h={{ base: 'auto', lg: 'fit-content' }}
            maxH={{ base: '600px', lg: 'calc(100vh - 200px)' }}
            display="flex"
            flexDirection="column"
          >
            <Flex align="center" justify="space-between" mb={3}>
              <Heading size="md">Feed del Despacho</Heading>
              {despachoNombre && (
                <Badge colorScheme="blue" fontSize="xs">{despachoNombre}</Badge>
              )}
            </Flex>
            <Box
              flex="1"
              overflowY="auto"
              pr={1}
              css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('gray.300', 'gray.600'),
                  borderRadius: '3px',
                },
              }}
            >
              {feedItems.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text color={subtle} fontSize="sm">No hay movimientos registrados aún</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {feedItems.map((item) => {
                    const timeAgo = getTimeAgo(item.fecha);
                    return (
                      <Box
                        key={item.id}
                        p={3}
                        borderRadius="md"
                        bg={itemBg}
                        borderLeft="3px solid"
                        borderLeftColor={
                          item.color === 'orange' ? 'orange.400' :
                            item.color === 'green' ? 'green.400' :
                              item.color === 'gray' ? 'gray.400' :
                                item.color === 'purple' ? 'purple.400' :
                                  item.color === 'red' ? 'red.400' :
                                    'blue.400'
                        }
                        transition="all 0.2s"
                        _hover={{ shadow: 'sm', transform: 'translateX(2px)' }}
                      >
                        <Flex align="center" gap={2} mb={1} flexWrap="wrap">
                          <Badge
                            colorScheme={
                              item.color === 'orange' ? 'orange' :
                                item.color === 'green' ? 'green' :
                                  item.color === 'gray' ? 'gray' :
                                    item.color === 'purple' ? 'purple' :
                                      item.color === 'red' ? 'red' :
                                        'blue'
                            }
                            fontSize="xs"
                          >
                            {item.title}
                          </Badge>
                          <Text fontSize="xs" color={subtle} whiteSpace="nowrap">
                            {timeAgo}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" color={subtle} lineHeight="1.5">
                          {item.text}
                        </Text>
                        {item.movimiento?.observaciones && (
                          <Text fontSize="xs" color={subtle} fontStyle="italic" mt={1}>
                            &quot;{item.movimiento.observaciones}&quot;
                          </Text>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
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
