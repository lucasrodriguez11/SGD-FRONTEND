import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Box,
  Text,
  Badge,
  Flex,
  Button,
  useDisclosure,
  Spinner,
  Select,
  Heading,
  HStack,
  VStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FaEye, FaHistory, FaEllipsisV } from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Expediente } from 'src/types';

interface ExpedientesTableProps {
  expedientes: Expediente[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewExpediente: (expediente: Expediente) => void;
  onViewHistory: (expediente: Expediente) => void;
}

export const ExpedientesTable: React.FC<ExpedientesTableProps> = ({
  expedientes,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  onViewExpediente,
  onViewHistory
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const PrioridadBadge = ({ prioridad }: { prioridad: string }) => {
    const colorScheme = {
      'Alta': 'red',
      'Normal': 'yellow',
      'Baja': 'green'
    }[prioridad];

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

  const TableActions = ({ expediente }: { expediente: Expediente }) => (
    <Menu>
       <MenuItem 
          icon={<FaEye />} 
          onClick={() => onViewExpediente(expediente)}
        >
        </MenuItem>
        <MenuItem 
          icon={<FaHistory />} 
          onClick={() => onViewHistory(expediente)}
        >
        </MenuItem>
    </Menu>
  );

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

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Expedientes</Heading>
        <HStack spacing={4}>
          <Text color="gray.500" fontSize="sm">
            Total: {expedientes.length} expedientes
          </Text>
        </HStack>
      </Flex>

      <Box 
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        backgroundColor={bgColor}
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Table variant="simple">
          <Thead backgroundColor={headerBgColor}>
            <Tr>
              <Th 
                py={4}
                borderBottomWidth="2px" 
                borderBottomColor="blue.500"
              >
                Nro de Expediente
              </Th>
              <Th 
                borderBottomWidth="2px" 
                borderBottomColor="blue.500"
              >
                Iniciador
              </Th>
              <Th 
                borderBottomWidth="2px" 
                borderBottomColor="blue.500"
              >
                Tema
              </Th>
              <Th 
                borderBottomWidth="2px" 
                borderBottomColor="blue.500"
              >
                Prioridad
              </Th>
              <Th 
                textAlign="center"
                borderBottomWidth="2px" 
                borderBottomColor="blue.500"
                
              >
                Acciones
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {expedientes.map((expediente) => (
              <Tr 
                key={expediente._id}
                _hover={{ bg: hoverBgColor }}
                transition="background-color 0.2s"
                cursor="pointer"
              >
                <Td fontWeight="medium">
                  {expediente.numeroExpediente}
                </Td>
                <Td>{expediente.iniciador}</Td>
                <Td maxW="300px">
                  <Text noOfLines={1}>{expediente.tema}</Text>
                </Td>
                <Td>
                  <PrioridadBadge prioridad={expediente.prioridad} />
                </Td>
                <Td>
                  <Flex justify="center">
                    <TableActions expediente={expediente} />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
          <Flex 
            justify="space-between" 
            align="center" 
            flexWrap="wrap"
            gap={4}
          >
            <HStack spacing={4}>
              <Select
                w="100px"
                size="sm"
                borderRadius="md"
                value={currentPage}
                onChange={(e) => onPageChange(Number(e.target.value))}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color="gray.600">
                de {totalPages} páginas
              </Text>
            </HStack>

            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<ChevronLeftIcon />}
                onClick={() => onPageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                size="sm"
                rightIcon={<ChevronRightIcon />}
                onClick={() => onPageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                variant="outline"
              >
                Siguiente
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};