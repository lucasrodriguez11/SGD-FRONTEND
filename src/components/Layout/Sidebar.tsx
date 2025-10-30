import React from 'react';
import {
  Box,
  VStack,
  IconButton,
  Text,
  useColorModeValue,
  Tooltip,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Flex,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {
  Layout,
  FileText,
  Users,
  Calendar,
  BarChart2,
  Settings,
  FolderOpen,
  Mail,
  HelpCircle,
  Menu,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

interface SidebarProps {
  isMobile?: boolean;
}

const mainMenuItems: SidebarItem[] = [
  { label: 'Inicio', icon: Layout, href: '/' },
  { label: 'Expedientes', icon: FileText, href: '/expedientes' },
  { label: 'Usuarios', icon: Users, href: '/usuarios' },
  { label: 'Calendario', icon: Calendar, href: '/calendario' },
  { label: 'Reportes', icon: BarChart2, href: '/reportes' },
];

const secondaryMenuItems: SidebarItem[] = [
  { label: 'Archivos', icon: FolderOpen, href: '/archivos' },
  { label: 'Mensajes', icon: Mail, href: '/mensajes' },
  { label: 'Configuración', icon: Settings, href: '/configuracion' },
  { label: 'Ayuda', icon: HelpCircle, href: '/ayuda' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobile = false }) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('blue.50', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const SidebarContent = () => (
    <VStack
      h="full"
      w="full"
      spacing={1}
      align="stretch"
      py={4}
    >
      {/* Main Menu Items */}
      <VStack spacing={1} px={4}>
        {mainMenuItems.map((item) => (
          <Tooltip
            key={item.label}
            label={item.label}
            placement="right"
            hasArrow
            display={{ base: 'none', lg: 'block' }}
          >
            <Flex
              w="full"
              cursor="pointer"
              borderRadius="md"
              role="group"
              onClick={() => router.push(item.href)}
              bg={router.pathname === item.href ? hoverBg : 'transparent'}
              color={router.pathname === item.href ? activeColor : textColor}
              _hover={{ bg: hoverBg, color: activeColor }}
              p={3}
            >
              <Icon as={item.icon} boxSize={5} />
              <Text ml={4} fontSize="sm" fontWeight="medium">
                {item.label}
              </Text>
            </Flex>
          </Tooltip>
        ))}
      </VStack>

      <Divider my={4} />

      {/* Secondary Menu Items */}
      <VStack spacing={1} px={4}>
        {secondaryMenuItems.map((item) => (
          <Tooltip
            key={item.label}
            label={item.label}
            placement="right"
            hasArrow
            display={{ base: 'none', lg: 'block' }}
          >
            <Flex
              w="full"
              cursor="pointer"
              borderRadius="md"
              role="group"
              onClick={() => router.push(item.href)}
              bg={router.pathname === item.href ? hoverBg : 'transparent'}
              color={router.pathname === item.href ? activeColor : textColor}
              _hover={{ bg: hoverBg, color: activeColor }}
              p={3}
            >
              <Icon as={item.icon} boxSize={5} />
              <Text ml={4} fontSize="sm" fontWeight="medium">
                {item.label}
              </Text>
            </Flex>
          </Tooltip>
        ))}
      </VStack>
    </VStack>
  );

  // Mobile version with drawer
  if (isMobile) {
    return (
      <>
        <IconButton
          aria-label="Open menu"
          icon={<Menu />}
          onClick={onOpen}
          variant="ghost"
          size="md"
          display={{ base: 'flex', lg: 'none' }}
        />

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent maxW="xs">
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <SidebarContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version
  return (
    <Box
      as="aside"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      w="64"
      h="100vh"
      position="fixed"
      top="16" // Adjusted to account for navbar height
      left={0}
      display={{ base: 'none', lg: 'block' }}
    >
      <SidebarContent />
    </Box>
  );
};

export default Sidebar;