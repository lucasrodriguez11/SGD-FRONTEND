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
import { useRouter } from 'next/router';
import { authToken, authUser, notificationsApi } from '~/services/api';
import { connectNotifications, type NotificationWS } from '~/services/ws';
import {
  Menu as MenuIcon,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
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
  const [displayName, setDisplayName] = React.useState<string>('Usuario');
  const [notifUnread, setNotifUnread] = React.useState<number>(0);
  const [notifOpen, setNotifOpen] = React.useState<boolean>(false);
  const [myDespId, setMyDespId] = React.useState<string>('');
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

  React.useEffect(() => {
    const u = authUser.get<{ name?: string; despachoId?: string }>();
    if (u?.name) setDisplayName(u.name);
    if (u?.despachoId) setMyDespId(u.despachoId);
    void (async () => {
      try {
        const res = await notificationsApi.list({ limit: 20 });
        if (res.success && res.data) {
          const out: Array<{ id?: string; title: string; text: string; createdAt?: string; readAt?: string }> = [];
          for (const n of res.data.notifications as Array<{ _id: string; type: string; message: string; createdAt: string; orgTargetId?: string; readAt?: string }>) {
            if (!n.orgTargetId || (myDespId ? n.orgTargetId === myDespId : true)) {
              out.push({ id: n._id, title: n.type, text: n.message, createdAt: n.createdAt, readAt: n.readAt });
            }
          }
          setItems(out);
        }
      } catch {
        // ignore
      }
    })();
  }, [myDespId]);

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
    const ws = connectNotifications((n: NotificationWS) => {
      setItems((prev) => [{ title: n.type, text: n.message ?? n.type, createdAt: n.createdAt }, ...prev].slice(0, 20));
      setNotifUnread((c) => c + 1);
      localStorage.setItem('notif_unread', String((parseInt(localStorage.getItem('notif_unread') ?? '0', 10) || 0) + 1));
    }, myDespId);
    return () => ws.close();
  }, [myDespId]);

  // Theme colors
  const bgColor = useColorModeValue('blue.600', 'blue.800');
  const hoverBg = useColorModeValue('blue.500', 'blue.700');
  const borderColor = useColorModeValue('blue.500', 'blue.700');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');

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
              <Text
                fontSize="xl"
                fontWeight="bold"
                bgGradient="linear(to-r, white, blue.100)"
                bgClip="text"
                letterSpacing="tight"
              >
                SGDM
              </Text>
              <Badge
                ml={2}
                colorScheme="blue"
                variant="solid"
                fontSize="xs"
                borderRadius="full"
              >
                v2
              </Badge>
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
              <MenuButton as={IconButton} aria-label="Notificaciones" icon={<Bell />} variant="ghost" colorScheme="whiteAlpha" onClick={() => { const opening = !notifOpen; setNotifOpen(opening); if (opening) { setNotifUnread(0); localStorage.setItem('notif_unread', '0'); } }} position="relative">
                {notifUnread > 0 && (
                  <Badge position="absolute" top="2px" right="2px" colorScheme="red" borderRadius="full">{notifUnread}</Badge>
                )}
              </MenuButton>
              <MenuList maxW="360px" maxH="70vh" overflowY="auto" bg={menuBg} borderColor={borderColor} shadow="lg" p={0}>
                <Flex align="center" justify="space-between" px={3} py={2} borderBottom="1px" borderColor={borderColor}>
                  <Text fontWeight="bold">Notificaciones</Text>
                  <Button size="xs" variant="ghost" onClick={async () => {
                    // marcar todas como leídas sin borrar
                    const ids = items.map((n) => n.id).filter((id): id is string => Boolean(id));
                    for (const id of ids) {
                      try { await notificationsApi.markRead(id); } catch { /* ignore */ }
                    }
                    setNotifUnread(0);
                    localStorage.setItem('notif_unread', '0');
                  }}>Marcar como leídas</Button>
                </Flex>
                {items.length === 0 ? (
                  <Box p={3}><Text color="gray.500">Sin notificaciones</Text></Box>
                ) : (
                  items.map((n, idx) => (
                    <Flex key={idx} px={3} py={2} align="start" _hover={{ bg: menuHoverBg }}>
                      <Box>
                        <Badge colorScheme="blue" mb={1}>{n.title}</Badge>
                        <Text fontSize="sm" color="gray.600" fontWeight={n.readAt ? 'normal' : 'bold'}>
                          {n.text}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{formatRelative(n.createdAt)}</Text>
                      </Box>
                      <Button size="xs" ml="auto" variant="ghost" onClick={async () => {
                        setItems(arr => arr.filter((_, i) => i !== idx));
                        if (n.id) {
                          try { await notificationsApi.markRead(n.id); } catch { }
                        }
                        setNotifUnread((c) => Math.max(0, c - 1));
                        localStorage.setItem('notif_unread', String(Math.max(0, (parseInt(localStorage.getItem('notif_unread') ?? '0', 10) || 0) - 1)));
                      }}>×</Button>
                    </Flex>
                  ))
                )}
              </MenuList>
            </Menu>

            {/* User Menu */}
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                colorScheme="whiteAlpha"
                rightIcon={<ChevronDown size={16} />}
                _hover={{ bg: hoverBg }}
                px={2}
              >
                <HStack spacing={2}>
                  <Avatar size="sm" name={displayName} bg="blue.300" />
                  <Box display={{ base: 'none', md: 'block' }}>
                    <Text size="sm" fontWeight="medium">{displayName}</Text>
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