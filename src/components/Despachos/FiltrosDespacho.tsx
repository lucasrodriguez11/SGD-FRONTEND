import React, { useState } from 'react';
import {
    Box,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    Heading,
    useColorModeValue,
    Divider,
} from '@chakra-ui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';

// Tipos disponibles (sincronizado con backend)
const TIPOS = [
    'MUNICIPALIDAD',
    'DIRECCION',
    'SUBDIRECCIÓN',
    'AREA',
    'DEPARTAMENTO',
    'SECRETARIA',
];

interface FiltrosDespachoProps {
    onFilter: (filters: {
        search?: string;
        tipo?: string;
        estado?: string;
    }) => void;
    onClear: () => void;
}

export const FiltrosDespacho: React.FC<FiltrosDespachoProps> = ({
    onFilter,
    onClear,
}) => {
    const [search, setSearch] = useState('');
    const [tipo, setTipo] = useState('');
    const [estado, setEstado] = useState('');

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const handleFilter = () => {
        const filters: {
            search?: string;
            tipo?: string;
            estado?: string;
        } = {};
        if (search) filters.search = search;
        if (tipo) filters.tipo = tipo;
        if (estado) filters.estado = estado;
        onFilter(filters);
    };

    const handleClear = () => {
        setSearch('');
        setTipo('');
        setEstado('');
        onClear();
    };

    return (
        <Box
            bg={bgColor}
            borderRadius="2xl"
            p={6}
            shadow="lg"
            borderWidth="1px"
            borderColor={borderColor}
            position="sticky"
            top={4}
        >
            <VStack spacing={6} align="stretch">
                <Heading size="md" fontWeight="bold">
                    Filtros
                </Heading>

                <Divider />

                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        Buscar
                    </FormLabel>
                    <Input
                        placeholder="Nombre, código, responsable..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        Tipo
                    </FormLabel>
                    <Select
                        placeholder="Todos los tipos"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    >
                        {TIPOS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        Estado
                    </FormLabel>
                    <Select
                        placeholder="Todos los estados"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </Select>
                </FormControl>

                <Divider />

                <VStack spacing={3}>
                    <Button
                        leftIcon={<FaSearch />}
                        colorScheme="blue"
                        width="full"
                        onClick={handleFilter}
                        borderRadius="lg"
                        size="lg"
                    >
                        Aplicar Filtros
                    </Button>
                    <Button
                        leftIcon={<FaTimes />}
                        variant="outline"
                        width="full"
                        onClick={handleClear}
                        borderRadius="lg"
                        size="lg"
                    >
                        Limpiar
                    </Button>
                </VStack>
            </VStack>
        </Box>
    );
};

