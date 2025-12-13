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

interface FiltrosExpedienteProps {
    onFilter: (filters: {
        numeroExpediente?: string;
        prioridad?: string;
        tema?: string;
        estado?: string;
        despachoActual?: string;
    }) => void;
    onClear: () => void;
}

export const FiltrosExpediente: React.FC<FiltrosExpedienteProps> = ({
    onFilter,
    onClear,
}) => {
    const [numeroExpediente, setNumeroExpediente] = useState('');
    const [prioridad, setPrioridad] = useState('');
    const [tema, setTema] = useState('');
    const [estado, setEstado] = useState('');
    const [despachoActual, setDespachoActual] = useState('');

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const handleFilter = () => {
        const filters: {
            numeroExpediente?: string;
            prioridad?: string;
            tema?: string;
            estado?: string;
            despachoActual?: string;
        } = {};
        if (numeroExpediente) filters.numeroExpediente = numeroExpediente;
        if (prioridad) filters.prioridad = prioridad;
        if (tema) filters.tema = tema;
        if (estado) filters.estado = estado;
        if (despachoActual) filters.despachoActual = despachoActual;
        onFilter(filters);
    };

    const handleClear = () => {
        setNumeroExpediente('');
        setPrioridad('');
        setTema('');
        setEstado('');
        setDespachoActual('');
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
                        N° Expediente
                    </FormLabel>
                    <Input
                        placeholder="Buscar por número..."
                        value={numeroExpediente}
                        onChange={(e) => setNumeroExpediente(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        Prioridad
                    </FormLabel>
                    <Select
                        placeholder="Todas las prioridades"
                        value={prioridad}
                        onChange={(e) => setPrioridad(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    >
                        <option value="Alta">Alta</option>
                        <option value="Normal">Normal</option>
                        <option value="Baja">Baja</option>
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
                        <option value="RECEPCIONADO">RECEPCIONADO</option>
                        <option value="ENVIADO">ENVIADO</option>
                        <option value="ARCHIVADO">ARCHIVADO</option>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        Despacho Actual
                    </FormLabel>
                    <Input
                        placeholder="Nombre del despacho..."
                        value={despachoActual}
                        onChange={(e) => setDespachoActual(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                    />
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
