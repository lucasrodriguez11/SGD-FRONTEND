import React from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Text,
  Avatar,
  Badge,
  Divider,
  useDisclosure,
  Collapse,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { authToken, authUser, notificationsApi, despachosApi } from '~/services/api';
import Image from 'next/image';
import { connectNotifications, type NotificationWS } from '~/services/ws';
import {
  Menu as MenuIcon,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
}

const navItems: NavItem[] = [];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { isOpen, onToggle } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode();
  const [displayName, setDisplayName] = React.useState<string>('Usuario');
  const [notifUnread, setNotifUnread] = React.useState<number>(0);
  const [notifOpen, setNotifOpen] = React.useState<boolean>(false);
  const [myDespId, setMyDespId] = React.useState<string>('');
  const [myDespachoNombre, setMyDespachoNombre] = React.useState<string>('');
  const [items, setItems] = React.useState<Array<{ id?: string; title: string; text: string; createdAt?: string; readAt?: string }>>([]);

  const formatRelative = (iso?: string): string => {
    if (!iso) return 'ahora';
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return 'ahora';
    const diffMs = Date.now() - d;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 10) return 'ahora';
    if (sec < 60) return `hace ${sec} s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'ayer';
    return `hace ${day} d`;
  };

  // Cargar nombre del despacho y notificaciones
  React.useEffect(() => {
    const u = authUser.get<{ name?: string; despachoId?: string }>();
    if (u?.name) setDisplayName(u.name);
    if (u?.despachoId) {
      setMyDespId(u.despachoId);
      // Cargar nombre del despacho
      void (async () => {
        try {
          const despRes = await despachosApi.getById(u.despachoId);
          if (despRes.success && despRes.data?.despacho?.nombre) {
            setMyDespachoNombre(despRes.data.despacho.nombre);
          }
        } catch {
          // ignore
        }
      })();
    }
    
  }, [myDespId]);

  // Cargar notificaciones cuando el nombre del despacho esté disponible
  React.useEffect(() => {
    if (!myDespachoNombre) return;
    
    void (async () => {
      try {
        const res = await notificationsApi.list({ limit: 20 });
        if (res.success && res.data) {
          const out: Array<{ id?: string; title: string; text: string; createdAt?: string; readAt?: string }> = [];
          for (const n of res.data.notifications as Array<{ _id: string; type: string; message: string; createdAt: string; orgTargetId?: string; readAt?: string }>) {
            // Filtrar por nombre del despacho (orgTargetId es el nombre, no el ID)
            if (!n.orgTargetId || n.orgTargetId === myDespachoNombre) {
              out.push({ id: n._id, title: n.type, text: n.message, createdAt: n.createdAt, readAt: n.readAt });
            }
          }
          setItems(out);
          // Calcular contador de no leídas basado en las notificaciones sin readAt
          const unreadCount = out.filter(item => !item.readAt).length;
          setNotifUnread(unreadCount);
          localStorage.setItem('notif_unread', String(unreadCount));
        }
      } catch {
        // ignore
      }
    })();
  }, [myDespachoNombre]);

  React.useEffect(() => {
    const read = () => {
      try {
        const v = parseInt(localStorage.getItem('notif_unread') ?? '0', 10);
        setNotifUnread(Number.isNaN(v) ? 0 : v);
      } catch { setNotifUnread(0); }
    };
    read();
    const id = setInterval(read, 1000);
    return () => clearInterval(id);
  }, []);

  // Realtime notifications filtered to my despacho
  React.useEffect(() => {
    // Esperar a que el nombre del despacho esté disponible (el backend usa nombres, no IDs)
    if (!myDespachoNombre) return;
    
    const ws = connectNotifications((n: NotificationWS) => {
      // Filtrar notificaciones que sean para este despacho (por nombre)
      if (n.orgTargetId && n.orgTargetId !== myDespachoNombre) {
        return; // Ignorar notificaciones que no son para este despacho
      }
      
      // Agregar notificación al feed inmediatamente (si no está leída, incrementar contador)
      setItems((prev) => {
        // Evitar duplicados
        const exists = prev.some(item => item.id === n.id || (item.title === n.type && item.text === n.message && Math.abs(new Date(item.createdAt || 0).getTime() - new Date(n.createdAt || new Date().toISOString()).getTime()) < 5000));
        if (exists) return prev;
        
        const newItem = { 
          id: n.id, 
          title: n.type, 
          text: n.message ?? n.type, 
          createdAt: n.createdAt ?? new Date().toISOString(),
          readAt: undefined // Nueva notificación no está leída
        };
        
        const updated = [newItem, ...prev].slice(0, 20);
        
        // Incrementar contador inmediatamente
        setNotifUnread((c) => {
          const newCount = c + 1;
          localStorage.setItem('notif_unread', String(newCount));
          return newCount;
        });
        
        return updated;
      });
      
      // NO recargar desde el servidor automáticamente - solo cuando se abre el dropdown
      // Esto evita que se pierdan las notificaciones que llegan por WebSocket
    }, myDespachoNombre);
    return () => ws.close();
  }, [myDespachoNombre]);

  // Theme colors
  const bgColor = useColorModeValue('blue.600', 'blue.800');
  const hoverBg = useColorModeValue('blue.500', 'blue.700');
  const borderColor = useColorModeValue('blue.500', 'blue.700');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');
  const notifTextColor = useColorModeValue('gray.900', 'gray.100');
  const notifTextReadColor = useColorModeValue('gray.500', 'gray.400');

  const handleNavigation = (path: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push(path);
  };

  const handleLogout = () => {
    authToken.clear();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    router.push('/login');
  };

  return (
    <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
      <Box
        bg={bgColor}
        px={4}
        boxShadow="lg"
        borderBottom="1px"
        borderColor={borderColor}
      >
        <Flex
          h={16}
          maxW="1200px"
          mx="auto"
          align="center"
          justify="space-between"
        >
          {/* Logo and Brand */}
          <HStack spacing={4}>
            {isMobile && (
              <IconButton
                aria-label="Menu"
                icon={<MenuIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={onToggle}
              />
            )}
            <Flex align="center" cursor="pointer" onClick={() => handleNavigation('/')}>
              <Image src="/logo-sgd.png" alt="SGD" width={48} height={48} priority />
            </Flex>
          </HStack>

          <HStack spacing={1}>
            {/* Desktop Navigation */}
            {!isMobile && (
              <HStack spacing={1} mx={8}>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    size="sm"
                    leftIcon={item.icon}
                    px={4}
                    _hover={{ bg: hoverBg }}
                    isActive={router.pathname === item.href}
                    _active={{
                      bg: hoverBg,
                      transform: 'scale(0.98)',
                    }}
                  >
                    {item.label}
                    {item.label === 'Notificaciones' && notifUnread > 0 && (
                      <Badge ml={2} colorScheme="red" borderRadius="full">{notifUnread}</Badge>
                    )}
                  </Button>
                ))}
              </HStack>
            )}

            {/* Right Side Items */}

            {/* Notifications dropdown */}
            <Menu isOpen={notifOpen} onClose={() => setNotifOpen(false)}>
              <Box position="relative" display="inline-block">
                <MenuButton as={IconButton} aria-label="Notificaciones" icon={<Bell color="white" />} variant="ghost" colorScheme="whiteAlpha" onClick={async () => { 
                  const opening = !notifOpen;
                  setNotifOpen(opening);
                  // NO recargar desde el servidor al abrir - las notificaciones ya están en el estado
                  // Solo sincronizar en segundo plano sin afectar las existentes
                  if (opening && myDespachoNombre) {
                    // Sincronizar en segundo plano sin bloquear la UI
                    void (async () => {
                      try {
                        const res = await notificationsApi.list({ limit: 20 });
                        if (res.success && res.data) {
                          const serverNotifs: Array<{ id?: string; title: string; text: string; createdAt?: string; readAt?: string }> = [];
                          for (const n of res.data.notifications as Array<{ _id: string; type: string; message: string; createdAt: string; orgTargetId?: string; readAt?: string }>) {
                            if (!n.orgTargetId || n.orgTargetId === myDespachoNombre) {
                              serverNotifs.push({ id: n._id, title: n.type, text: n.message, createdAt: n.createdAt, readAt: n.readAt });
                            }
                          }
                          
                          // Combinar notificaciones del servidor con las existentes (evitar duplicados)
                          // SIEMPRE preservar las existentes primero
                          setItems(prev => {
                            // Si no hay notificaciones existentes, usar las del servidor
                            if (prev.length === 0) {
                              const unreadCount = serverNotifs.filter(item => !item.readAt).length;
                              setNotifUnread(unreadCount);
                              localStorage.setItem('notif_unread', String(unreadCount));
                              return serverNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 20);
                            }
                            
                            // Si hay existentes, combinarlas con las del servidor
                            const combined = [...prev]; // Empezar con las existentes
                            
                            // Agregar notificaciones del servidor que no están en las existentes
                            for (const serverNotif of serverNotifs) {
                              const exists = combined.some(existing => 
                                existing.id === serverNotif.id || 
                                (existing.title === serverNotif.title && existing.text === serverNotif.text && Math.abs(new Date(existing.createdAt || 0).getTime() - new Date(serverNotif.createdAt || 0).getTime()) < 5000)
                              );
                              if (!exists) {
                                combined.push(serverNotif);
                              } else {
                                // Si existe, actualizar el estado readAt si viene del servidor
                                const existingIdx = combined.findIndex(existing => existing.id === serverNotif.id || (existing.title === serverNotif.title && existing.text === serverNotif.text));
                                if (existingIdx >= 0 && serverNotif.readAt && !combined[existingIdx].readAt) {
                                  combined[existingIdx] = { ...combined[existingIdx], readAt: serverNotif.readAt };
                                }
                              }
                            }
                            
                            // Ordenar por fecha (más recientes primero) y limitar a 20
                            const sorted = combined
                              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                              .slice(0, 20);
                            
                            // Recalcular contador basado en las notificaciones combinadas
                            const unreadCount = sorted.filter(item => !item.readAt).length;
                            setNotifUnread(unreadCount);
                            localStorage.setItem('notif_unread', String(unreadCount));
                            
                            return sorted;
                          });
                        }
                      } catch { 
                        // Si falla la llamada, mantener las notificaciones existentes
                        // No hacer nada, las notificaciones ya están en el estado
                      }
                    })();
                  }
                }} />
                {notifUnread > 0 && (
                  <Badge 
                    position="absolute" 
                    top="-2px" 
                    right="-2px" 
                    colorScheme="red" 
                    borderRadius="full"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="10px"
                    fontWeight="bold"
                    zIndex={10}
                    boxShadow="0 0 0 2px white"
                  >
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </Badge>
                )}
              </Box>
              <MenuList maxW="360px" maxH="70vh" overflowY="auto" bg={menuBg} borderColor={borderColor} shadow="lg" p={0}>
                <Flex align="center" justify="space-between" px={3} py={2} borderBottom="1px" borderColor={borderColor}>
                  <Text fontWeight="bold">Notificaciones</Text>
                  <Button size="xs" variant="ghost" onClick={async () => {
                    // marcar todas como leídas sin borrar
                    const ids = items.map((n) => n.id).filter((id): id is string => Boolean(id));
                    for (const id of ids) {
                      try { await notificationsApi.markRead(id); } catch { /* ignore */ }
                    }
                    // Actualizar items marcando todas como leídas
                    setItems(arr => arr.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
                    setNotifUnread(0);
                    localStorage.setItem('notif_unread', '0');
                  }}>Marcar como leídas</Button>
                </Flex>
                {items.length === 0 ? (
                  <Box p={3}><Text color="gray.500">Sin notificaciones</Text></Box>
                ) : (
                  items.map((n, idx) => {
                    const isRecepcion = n.title === 'EXPEDIENTE_RECIBIDO';
                    return (
                      <Flex 
                        key={idx} 
                        px={3} 
                        py={2} 
                        align="start" 
                        _hover={{ bg: menuHoverBg }}
                        cursor={isRecepcion ? 'pointer' : 'default'}
                        onClick={isRecepcion ? async () => {
                          // Marcar como leída y redirigir a recepciones
                          if (n.id && !n.readAt) {
                            try { 
                              await notificationsApi.markRead(n.id);
                              setItems(arr => {
                                const updated = arr.map(item => item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item);
                                // Recalcular contador basado en las actualizadas
                                const unreadCount = updated.filter(item => !item.readAt).length;
                                setNotifUnread(unreadCount);
                                localStorage.setItem('notif_unread', String(unreadCount));
                                return updated;
                              });
                            } catch { }
                          }
                          router.push('/recepcion');
                        } : undefined}
                      >
                        <Box flex="1">
                          <Badge 
                            colorScheme={
                              n.title === 'EXPEDIENTE_RECIBIDO' ? 'orange' :
                              n.title === 'EXPEDIENTE_CONFIRMADO' ? 'green' :
                              n.title === 'EXPEDIENTE_ARCHIVADO' ? 'gray' :
                              'blue'
                            } 
                            mb={1}
                          >
                            {n.title}
                          </Badge>
                          <Text fontSize="sm" color={n.readAt ? notifTextReadColor : notifTextColor} fontWeight={n.readAt ? 'normal' : 'bold'}>
                            {n.text}
                          </Text>
                          <Text fontSize="xs" color={notifTextReadColor}>{formatRelative(n.createdAt)}</Text>
                        </Box>
                        <HStack spacing={1} ml="auto">
                          {!n.readAt && (
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              colorScheme="green"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (n.id) {
                                  try { 
                                    await notificationsApi.markRead(n.id);
                                    setItems(arr => {
                                      const updated = arr.map(item => item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item);
                                      // Recalcular contador basado en las actualizadas
                                      const unreadCount = updated.filter(item => !item.readAt).length;
                                      setNotifUnread(unreadCount);
                                      localStorage.setItem('notif_unread', String(unreadCount));
                                      return updated;
                                    });
                                  } catch { }
                                }
                              }}
                              title="Marcar como leída"
                            >
                              ✓
                            </Button>
                          )}
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            colorScheme="red"
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Borrar de la lista
                              setItems(arr => {
                                const filtered = arr.filter((_, i) => i !== idx);
                                // Recalcular contador basado en las filtradas
                                const unreadCount = filtered.filter(item => !item.readAt).length;
                                setNotifUnread(unreadCount);
                                localStorage.setItem('notif_unread', String(unreadCount));
                                return filtered;
                              });
                            }}
                            title="Eliminar"
                          >
                            ×
                          </Button>
                        </HStack>
                      </Flex>
                    );
                  })
                )}
              </MenuList>
            </Menu>

            {/* Theme toggle */}
            <IconButton aria-label="Cambiar tema" icon={colorMode === 'light' ? <Moon color="white" /> : <Sun color="white" />} variant="ghost" colorScheme="whiteAlpha" onClick={toggleColorMode} />

            {/* User Menu */}
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                colorScheme="whiteAlpha"
                rightIcon={<ChevronDown size={16} color="white" />}
                _hover={{ bg: hoverBg }}
                px={2}
              >
                <HStack spacing={2}>
                  <Avatar size="sm" name={displayName} bg="blue.300" />
                  <Box display={{ base: 'none', md: 'block' }}>
                    <Text size="sm" fontWeight="medium" color="white">{displayName}</Text>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList bg={menuBg} borderColor={borderColor} shadow="lg">
                <MenuItem icon={<User size={16} />} _hover={{ bg: menuHoverBg }} onClick={() => router.push('/perfil')}>
                  Perfil
                </MenuItem>
                <MenuItem icon={<Settings size={16} />} _hover={{ bg: menuHoverBg }} onClick={() => router.push('/configuracion')}>
                  Configuración
                </MenuItem>
                <Divider />
                <MenuItem
                  icon={<LogOut size={16} />}
                  color="red.500"
                  _hover={{ bg: menuHoverBg }}
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Mobile Navigation Menu */}
        <Collapse in={isOpen} animateOpacity>
          <VStack
            pb={4}
            spacing={1}
            align="stretch"
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => {
                  handleNavigation(item.href);
                  onToggle();
                }}
                variant="ghost"
                colorScheme="whiteAlpha"
                justifyContent="start"
                leftIcon={item.icon}
                size="sm"
                w="full"
                _hover={{ bg: hoverBg }}
                isActive={router.pathname === item.href}
              >
                {item.label}
              </Button>
            ))}
          </VStack>
        </Collapse>
      </Box>
    </Box>
  );
};

export default Navbar;