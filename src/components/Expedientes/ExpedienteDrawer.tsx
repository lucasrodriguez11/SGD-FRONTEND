import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  useDisclosure
} from '@chakra-ui/react';
import { Timeline } from 'primereact/timeline';
import { type Expediente, type Movimiento } from 'src/types';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { User, FileText, Bookmark, Building, Calendar, Clock } from 'lucide-react'; // Importing icons

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expediente: Expediente | null;
  movimientos: Movimiento[];
}

export const ExpedienteDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  expediente,
  movimientos
}) => {
  const { isOpen: isExpanded, onToggle } = useDisclosure();

  if (!expediente) return null;

  const formatFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const InfoField = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
    <Box p={3} _hover={{ bg: 'gray.50' }} transition="all 0.2s" borderBottom="1px" borderColor="gray.100">
      <HStack spacing={4}>
        {icon && <Box color="blue.500">{icon}</Box>}
        <Box flex={1}>
          <Text fontSize="sm" color="gray.500">{label}</Text>
          <Text fontSize="md" fontWeight="medium">{value}</Text>
        </Box>
      </HStack>
    </Box>
  );

  const customizedMarker = (item: Movimiento) => (
    <span
      className={`p-timeline-event-icon ${item.estado === 'RECEPCIONADO' ? 'text-green-500' : 'text-blue-500'}`}
    >
      <i className={`pi ${item.estado === 'RECEPCIONADO' ? 'pi-check' : 'pi-send'}`} />
    </span>
  );

  const customizedContent = (item: Movimiento) => (
    <Box 
      p={4} 
      bg="white" 
      borderRadius="lg" 
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
      _hover={{ boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <Text fontSize="sm" color="gray.600" mb={2}>
        {formatFecha(item.fechaMovimiento)}
      </Text>
      <Text fontWeight="medium">
        De: {item.despachoAnterior} → A: {item.despachoNuevo}
      </Text>
      {item.fojasAgregadas > 0 && (
        <Text fontSize="sm" color="gray.600" mt={1}>
          Fojas agregadas: {item.fojasAgregadas}
        </Text>
      )}
      <Badge 
        size="sm" 
        colorScheme={item.estado === 'RECEPCIONADO' ? 'green' : 'blue'}
        mt={2}
      >
        {item.estado}
      </Badge>
    </Box>
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <Box 
          as={DrawerHeader} 
          bgGradient="linear(to-r, blue.600, blue.800)" 
          color="white"
          py={6}
          borderBottomWidth="1px"
        >
          <Text fontSize="2xl">Expediente {expediente.numeroExpediente}</Text>
        </Box>

        <DrawerBody>
          <VStack spacing={4} align="stretch" pt={4}>
            <Box bg="white" borderRadius="xl" borderWidth="1px" overflow="hidden">
              <HStack spacing={4} p={4} bg="gray.50">
                <Badge 
                  colorScheme={
                    expediente.prioridad === 'Alta' ? 'red' :
                    expediente.prioridad === 'Normal' ? 'yellow' : 'green'
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  Prioridad: {expediente.prioridad}
                </Badge>
                <Badge 
                  colorScheme={expediente.estado === 'RECEPCIONADO' ? 'green' : 'blue'}
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {expediente.estado}
                </Badge>
              </HStack>

              <Box>
                <InfoField label="Iniciador" value={expediente.iniciador} icon={<User className="w-5 h-5 text-blue-500" />} />
                <InfoField label="Tema" value={expediente.tema} icon={<FileText className="w-5 h-5 text-blue-500" />} />
                {expediente.extracto && (
                  <InfoField label="Extracto" value={expediente.extracto} icon={<Bookmark className="w-5 h-5 text-blue-500" />} />
                )}
                    <InfoField label="Fojas" value={expediente.fojas} icon={<Clock className="w-5 h-5 text-blue-500" />} />
                    <InfoField label="Despacho Actual" value={expediente.despachoActual} icon={<Building className="w-5 h-5 text-blue-500" />} />
                    <InfoField label="Fecha de Ingreso" value={formatFecha(expediente.fechaIngreso)} icon={<Calendar className="w-5 h-5 text-blue-500" />} />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Text 
                fontSize="lg" 
                fontWeight="bold" 
                mb={4}
                px={2}
                py={1}
                borderBottom="2px"
                borderColor="blue.500"
                display="inline-block"
              >
                Historial de Movimientos
              </Text>
              <Timeline 
                value={movimientos} 
                align="left" 
                className="p-4"
                marker={customizedMarker} 
                content={customizedContent}
              />
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
