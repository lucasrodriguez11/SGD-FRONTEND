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
import {
  Menu as MenuIcon,
  Home,
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Expedientes', href: './expedientes', icon: <FileText size={20} /> },
  { label: 'Inicio', href: './', icon: <Home size={20} /> },
];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { isOpen, onToggle } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

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
            <Flex align="center" cursor="pointer" onClick={() => handleNavigation('./')}>
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
                </Button>
              ))}
            </HStack>
          )}

          {/* Right Side Items */}
       
            {/* Notifications */}
         

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
                  <Avatar size="sm" name="User Name" bg="blue.300" />
                  <Box display={{ base: 'none', md: 'block' }}>
                    <Text size="sm" fontWeight="medium">
                      Usuario
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList bg={menuBg} borderColor={borderColor} shadow="lg">
                <MenuItem icon={<User size={16} />} _hover={{ bg: menuHoverBg }}>
                  Perfil
                </MenuItem>
                <MenuItem icon={<Settings size={16} />} _hover={{ bg: menuHoverBg }}>
                  Configuración
                </MenuItem>
                <Divider />
                <MenuItem 
                  icon={<LogOut size={16} />} 
                  color="red.500"
                  _hover={{ bg: menuHoverBg }}
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