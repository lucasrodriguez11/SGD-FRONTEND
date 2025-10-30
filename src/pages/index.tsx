import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Button,
  useDisclosure,
  Flex,
  Text,
  Icon,
  useColorModeValue,
  Divider,
  useToast,
  Badge,
  Stack,
} from '@chakra-ui/react';
import { FaFileAlt, FaExchangeAlt } from 'react-icons/fa';
import { ExpedienteModal } from '../components/Expedientes/ExpedienteModal';
import { MovimientoModal } from '../components/Expedientes/MovimientoModal';

const HomePage = () => {
  const [expedientes, setExpedientes] = useState([]);
  const toast = useToast();

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

  const fetchExpedientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}expediente/listar`);
      const data = await response.json();
      setExpedientes(data.expedientes);
    } catch (error) {
      console.error('Error al cargar expedientes:', error);
    }
  };

  useEffect(() => {
    fetchExpedientes();
  }, []);

  const handleExpedienteSubmit = async (data: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}expediente/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear expediente');
      toast({ title: 'Expediente creado con éxito', status: 'success', duration: 3000 });
      fetchExpedientes();
      onExpedienteModalClose();
    } catch (error) {
      toast({ title: 'Error al crear expediente', status: 'error', duration: 3000 });
    }
  };

  const handleMovimientoSubmit = async (data: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}movimiento/registrarmov`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al registrar movimiento');
      toast({ title: 'Movimiento registrado con éxito', status: 'success', duration: 3000 });
      onMovimientoModalClose();
    } catch (error) {
      toast({ title: 'Error al registrar movimiento', status: 'error', duration: 3000 });
    }
  };

  return (
    <Container maxW="container.lg" py={70}>
      <VStack spacing={12} align="stretch">
        <Heading size="2xl" textAlign="center" fontWeight="extrabold" color={useColorModeValue('blue.600', 'blue.300')}>
       
        </Heading>

        <Box
          p={5}
          borderRadius="lg"
          bg={useColorModeValue('white', 'gray.900')}
          shadow="2x1"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="center">
            <Flex
              flexDir="column"
              align="center"
              p={5}
              borderRadius="md"
              bg={useColorModeValue('blue.50', 'blue.800')}
              shadow="md"
              _hover={{ transform: 'scale(1.05)', shadow: 'lg' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={onExpedienteModalOpen}
            >
              <Icon as={FaFileAlt} boxSize={10} color={useColorModeValue('blue.600', 'blue.200')} mb={3} />
              <Text fontSize="lg" fontWeight="bold">
                Nuevo Expediente
              </Text>
              <Badge mt={2} colorScheme="blue">
                Crear
              </Badge>
            </Flex>

            <Divider orientation="vertical" height="auto" display={{ base: 'none', md: 'block' }} />

            <Flex
              flexDir="column"
              align="center"
              p={5}
              borderRadius="md"
              bg={useColorModeValue('green.50', 'green.800')}
              shadow="md"
              _hover={{ transform: 'scale(1.05)', shadow: 'lg' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={onMovimientoModalOpen}
            >
              <Icon as={FaExchangeAlt} boxSize={10} color={useColorModeValue('green.600', 'green.200')} mb={3} />
              <Text fontSize="lg" fontWeight="bold">
                Registrar Movimiento
              </Text>
              <Badge mt={2} colorScheme="green">
                Registrar
              </Badge>
            </Flex>
            <Divider orientation="vertical" height="auto" display={{ base: 'none', md: 'block' }} />

{/* 
            <Flex
              flexDir="column"
              align="center"
              p={5}
              borderRadius="md"
              bg={useColorModeValue('green.50', 'green.800')}
              shadow="md"
              _hover={{ transform: 'scale(1.05)', shadow: 'lg' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={onMovimientoModalOpen}
            >
              <Icon as={FaExchangeAlt} boxSize={10} color={useColorModeValue('green.600', 'green.200')} mb={3} />
              <Text fontSize="lg" fontWeight="bold">
                Registrar Movimiento
              </Text>
              <Badge mt={2} colorScheme="green">
                Registrar
              </Badge>
            </Flex> */}
          </Stack>
        </Box>
      </VStack>



      <ExpedienteModal
        isOpen={isExpedienteModalOpen}
        onClose={onExpedienteModalClose}
        onSubmit={handleExpedienteSubmit}
      />

      <MovimientoModal
        isOpen={isMovimientoModalOpen}
        onClose={onMovimientoModalClose}
        onSubmit={handleMovimientoSubmit}
        expedientes={expedientes}
      />
    </Container>
  );
};

export default HomePage;
