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
    Spinner,
    VStack,
    useColorModeValue,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    HStack,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaEllipsisV, FaEnvelope, FaPhone } from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import type { Despacho } from '~/services/api';

interface DespachosTableProps {
    despachos: Despacho[];
    isLoading: boolean;
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onEdit: (despacho: Despacho) => void;
    onDelete?: (despacho: Despacho) => void;
    onActivate?: (despacho: Despacho) => void;
}

export const DespachosTable: React.FC<DespachosTableProps> = ({
    despachos,
    isLoading,
    totalPages,
    currentPage,
    onPageChange,
    onEdit,
    onDelete,
    onActivate,
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const headerBgColor = useColorModeValue('gray.50', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

    const TipoBadge = ({ tipo }: { tipo: string }) => {
        const colorScheme = {
            DIRECCION: 'purple',
            'SUBDIRECCIÓN': 'blue',
            AREA: 'green',
            DEPARTAMENTO: 'orange',
            SECRETARIA: 'pink',
        }[tipo] ?? 'gray';

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
                {tipo}
            </Badge>
        );
    };

    const EstadoBadge = ({ estado }: { estado: string }) => {
        const colorScheme = estado === 'ACTIVO' ? 'green' : 'gray';

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
                {estado === 'ACTIVO' ? '✓ Activo' : '○ Inactivo'}
            </Badge>
        );
    };

    const TableActions = ({ despacho }: { despacho: Despacho }) => {
        const current = (despacho.estado || '').toUpperCase().trim();
        const isActive = current === 'ACTIVO';
        const hasAdminActions = onDelete !== undefined || onActivate !== undefined;

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
                    <MenuItem icon={<FaEdit />} onClick={() => onEdit(despacho)}>
                        {hasAdminActions ? 'Editar' : 'Ver Perfil'}
                    </MenuItem>
                    {hasAdminActions && (
                        <>
                            {isActive && onDelete ? (
                                <MenuItem icon={<FaTrash />} onClick={() => onDelete(despacho)} color="red.500">
                                    Desactivar
                                </MenuItem>
                            ) : (
                                onActivate && (
                                    <MenuItem icon={<FaEdit />} onClick={() => onActivate(despacho)}>
                                        Activar
                                    </MenuItem>
                                )
                            )}
                        </>
                    )}
                </MenuList>
            </Menu>
        );
    };

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px">
                <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" color="blue.500" />
                    <Text color="gray.500">Cargando despachos...</Text>
                </VStack>
            </Flex>
        );
    }

    if (despachos.length === 0) {
        return (
            <Flex justify="center" align="center" h="400px">
                <VStack spacing={4}>
                    <Text fontSize="4xl">📭</Text>
                    <Text color="gray.500" fontSize="lg">
                        No hay despachos registrados
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
                                Código
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Nombre
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Tipo
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Responsable
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Contacto
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Estado
                            </Th>
                            <Th borderColor={borderColor} fontSize="sm" fontWeight="bold">
                                Acciones
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {despachos.map((despacho) => (
                            <Tr
                                key={despacho._id}
                                _hover={{ bg: hoverBgColor }}
                                transition="background 0.2s"
                            >
                                <Td borderColor={borderColor}>
                                    <Text fontWeight="bold" fontFamily="mono">
                                        {despacho.codigo}
                                    </Text>
                                </Td>
                                <Td borderColor={borderColor}>
                                    <Text fontWeight="semibold">{despacho.nombre}</Text>
                                    {despacho.descripcion && (
                                        <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                            {despacho.descripcion}
                                        </Text>
                                    )}
                                </Td>
                                <Td borderColor={borderColor}>
                                    <TipoBadge tipo={despacho.tipo} />
                                </Td>
                                <Td borderColor={borderColor}>
                                    <Text>{despacho.responsable ?? '-'}</Text>
                                </Td>
                                <Td borderColor={borderColor}>
                                    <VStack align="start" spacing={1}>
                                        {despacho.email && (
                                            <HStack spacing={1}>
                                                <FaEnvelope size={12} />
                                                <Text fontSize="sm">{despacho.email}</Text>
                                            </HStack>
                                        )}
                                        {despacho.telefono && (
                                            <HStack spacing={1}>
                                                <FaPhone size={12} />
                                                <Text fontSize="sm">{despacho.telefono}</Text>
                                            </HStack>
                                        )}
                                        {!despacho.email && !despacho.telefono && <Text>-</Text>}
                                    </VStack>
                                </Td>
                                <Td borderColor={borderColor}>
                                    <EstadoBadge estado={despacho.estado} />
                                </Td>
                                <Td borderColor={borderColor}>
                                    <TableActions despacho={despacho} />
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

