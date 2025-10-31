import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  Badge,
  Flex,
  Button,
  Spinner,
  VStack,
  useColorModeValue,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaEllipsisV, FaEye } from 'react-icons/fa';
import type { Expediente } from '~/services/api';

interface ExpedientesTableProps {
  expedientes: Expediente[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewExpediente?: (expediente: Expediente) => void;
}

export const ExpedientesTable: React.FC<ExpedientesTableProps> = ({
  expedientes,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  onViewExpediente,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const PrioridadBadge = ({ prioridad }: { prioridad: string }) => {
    const colorScheme = {
      Alta: 'red',
      Normal: 'blue',
      Baja: 'gray',
    }[prioridad] ?? 'gray';

    return (
      <Badge
        colorScheme={colorScheme}
        px={3}
        py={1}
        borderRadius="full"
        textTransform="none"
        fontSize="sm"
        fontWeight="medium"
      >
        {prioridad}
      </Badge>
    );
  };

  const EstadoBadge = ({ estado }: { estado: string }) => {
    const colorScheme = {
      RECEPCIONADO: 'blue',
      ENVIADO: 'orange',
      ARCHIVADO: 'gray',
    }[estado] ?? 'gray';

    return (
      <Badge
        colorScheme={colorScheme}
        px={3}
        py={1}
        borderRadius="full"
        textTransform="none"
        fontSize="sm"
        fontWeight="medium"
      >
        {estado}
      </Badge>
    );
  };

  const TableActions = ({ expediente }: { expediente: Expediente }) => {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FaEllipsisV />}
          variant="ghost"
          size="sm"
          aria-label="Acciones"
        />
        <MenuList>
          <MenuItem icon={<FaEye />} onClick={() => onViewExpediente?.(expediente)}>
            Ver Detalles
          </MenuItem>
        </MenuList>
      </Menu>
    );
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text color="gray.500">Cargando expedientes...</Text>
        </VStack>
      </Flex>
    );
  }

  if (expedientes.length === 0) {
    return (
      <Flex justify="center" align="center" h="400px">
        <VStack spacing={4}>
          <Text fontSize="4xl">📭</Text>
          <Text color="gray.500" fontSize="lg">
            No hay expedientes registrados
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="2xl" shadow="lg" overflow="hidden">
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead bg={headerBgColor}>
            <Tr>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                N° Expediente
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Iniciador
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Tema
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Prioridad
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Despacho Actual
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Estado
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Fojas
              </Th>
              <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                Acciones
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {expedientes.map((expediente) => (
              <Tr
                key={expediente._id}
                _hover={{ bg: hoverBgColor }}
                transition="background 0.2s"
              >
                <Td borderColor={borderColor}>
                  <Text fontWeight="bold" fontFamily="mono">
                    {expediente.numeroExpediente}
                  </Text>
                </Td>
                <Td borderColor={borderColor}>
                  <Text fontWeight="semibold">{expediente.iniciador}</Text>
                  {expediente.extracto && (
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                      {expediente.extracto}
                    </Text>
                  )}
                </Td>
                <Td borderColor={borderColor}>
                  <Text fontSize="sm">{expediente.tema}</Text>
                </Td>
                <Td borderColor={borderColor}>
                  <PrioridadBadge prioridad={expediente.prioridad} />
                </Td>
                <Td borderColor={borderColor}>
                  <Text fontSize="sm">{expediente.despachoActual}</Text>
                </Td>
                <Td borderColor={borderColor}>
                  <EstadoBadge estado={expediente.estado} />
                </Td>
                <Td borderColor={borderColor}>
                  <Text fontFamily="mono">{expediente.fojas}</Text>
                </Td>
                <Td borderColor={borderColor}>
                  <TableActions expediente={expediente} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Paginación */}
      {totalPages > 1 && (
        <Flex
          justify="space-between"
          align="center"
          p={4}
          borderTop="1px"
          borderColor={borderColor}
        >
          <Text fontSize="sm" color="gray.500">
            Página {currentPage} de {totalPages}
          </Text>
          <HStack spacing={2}>
            <Button
              leftIcon={<ChevronLeftIcon />}
              onClick={() => onPageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              size="sm"
              borderRadius="lg"
            >
              Anterior
            </Button>
            <Button
              rightIcon={<ChevronRightIcon />}
              onClick={() => onPageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              size="sm"
              borderRadius="lg"
            >
              Siguiente
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};