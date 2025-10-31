import React from 'react';
import {
  Box,
  SimpleGrid,
  FormControl,
  Input,
  Select,
  Button,
  useColorModeValue,
  Icon,
  HStack,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { Filter, Flag, AlertCircle } from 'lucide-react';

interface FiltrosExpedienteProps {
  onFilter: (filters: FilterParams) => void;
  onClear: () => void;
}

interface FilterParams {
  numeroExpediente?: string;
  iniciador?: string;
  tema?: string;
  prioridad?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

// Temas sincronizados con el backend
const TEMAS = [
  'PODA',
  'LIMPIEZA',
  'BACHEO',
  'ZANJA',
  'OTROS'
];

export const FiltrosExpediente: React.FC<FiltrosExpedienteProps> = ({
  onFilter,
  onClear
}) => {
  const [filters, setFilters] = React.useState<FilterParams>({});
  const [activeFilters, setActiveFilters] = React.useState<number>(0);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleFilterChange = (field: keyof FilterParams, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      setActiveFilters(Object.values(newFilters).filter(Boolean).length);
      return newFilters;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({});
    setActiveFilters(0);
    onClear();
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="md"
      shadow="sm"
      border="1px"
      borderColor={borderColor}
      mt="16"
      mx="4"
      p={4}
      position="sticky"
      top="20"
      zIndex="10"
    >
      {/* Header con badge de filtros activos */}
      <HStack mb={4} justify="space-between">
        <HStack spacing={2}>
          <Icon as={Filter} boxSize={5} color="blue.500" />
          {activeFilters > 0 && (
            <Badge colorScheme="blue" borderRadius="full">
              {activeFilters}
            </Badge>
          )}
        </HStack>
        <Tooltip label="Limpiar filtros">
          <Button size="sm" onClick={handleClear} variant="outline" colorScheme="red">
            Limpiar Filtros
          </Button>
        </Tooltip>
      </HStack>

      <form onSubmit={handleSubmit}>
        <SimpleGrid columns={1} spacing={3}>
          <Tooltip label="Número de Expediente">
            <FormControl>
              <Input
                value={filters.numeroExpediente ?? ''}
                onChange={(e) => handleFilterChange('numeroExpediente', e.target.value)}
                placeholder="Nro. Expediente"
                size="md"
              />
            </FormControl>
          </Tooltip>

          <Tooltip label="Iniciador">
            <FormControl>
              <Input
                value={filters.iniciador ?? ''}
                onChange={(e) => handleFilterChange('iniciador', e.target.value)}
                placeholder="Iniciador"
                size="md"
              />
            </FormControl>
          </Tooltip>

          <Tooltip label="Tema">
            <FormControl>
              <Select
                placeholder="Tema"
                value={filters.tema ?? ''}
                onChange={(e) => handleFilterChange('tema', e.target.value)}
                size="md"
              >
                {TEMAS.map(tema => (
                  <option key={tema} value={tema}>{tema}</option>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

          <Tooltip label="Prioridad">
            <FormControl>
              <Select
                placeholder="Prioridad"
                value={filters.prioridad ?? ''}
                onChange={(e) => handleFilterChange('prioridad', e.target.value)}
                size="md"
                icon={<Flag size={14} />}
              >
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baja">Baja</option>
              </Select>
            </FormControl>
          </Tooltip>

          <Tooltip label="Estado">
            <FormControl>
              <Select
                placeholder="Estado"
                value={filters.estado ?? ''}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                size="md"
                icon={<AlertCircle size={14} />}
              >
                <option value="RECEPCIONADO">Recepcionado</option>
                <option value="ENVIADO">Enviado</option>
              </Select>
            </FormControl>
          </Tooltip>

          <SimpleGrid columns={2} spacing={3}>
            <Tooltip label="Fecha Desde">
              <FormControl>
                <Input
                  type="date"
                  value={filters.fechaDesde ?? ''}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                  size="md"
                />
              </FormControl>
            </Tooltip>

            <Tooltip label="Fecha Hasta">
              <FormControl>
                <Input
                  type="date"
                  value={filters.fechaHasta ?? ''}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                  size="md"
                />
              </FormControl>
            </Tooltip>
          </SimpleGrid>
        </SimpleGrid>

        <Button
          colorScheme="blue"
          type="submit"
          size="md"
          leftIcon={<Filter size={16} />}
          mt={4}
          w="full"
        >
          Buscar
        </Button>
      </form>
    </Box>
  );
};

export default FiltrosExpediente;
