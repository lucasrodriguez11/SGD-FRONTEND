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
} from '@chakra-ui/react';
import { type Expediente, type Movimiento } from '~/services/api';
import { User, FileText, Bookmark, Building, Calendar, Clock, ArrowRight } from 'lucide-react';

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
  if (!expediente) return null;

  const formatFecha = (fecha: Date | string) => {
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

  const renderMovimientoItem = (item: Movimiento) => {
    const titulo = item.estado === 'ENVIADO' ? 'Despachado' : item.estado === 'RECEPCIONADO' ? 'Aceptado' : 'Archivado';
    const color = item.estado === 'ENVIADO' ? 'blue.400' : item.estado === 'RECEPCIONADO' ? 'green.400' : 'gray.500';
    return (
      <HStack align="flex-start" spacing={4} mb={4}>
        <Box position="relative">
          <Box w={2} h={2} bg={color} borderRadius="full" mt={2} />
        </Box>
        <Box flex={1}>
          <HStack justify="space-between">
            <Text fontWeight="bold">{titulo}</Text>
            <Text fontSize="xs" color="gray.500">{formatFecha(item.fechaMovimiento)}</Text>
          </HStack>
          {item.estado === 'ENVIADO' && (
            <HStack fontSize="sm" color="gray.600" mt={1}>
              <Text>Dirección de</Text>
              <Text fontWeight="semibold">{item.despachoNuevo}</Text>
              <ArrowRight size={14} />
            </HStack>
          )}
          {item.estado === 'RECEPCIONADO' && (
            <Text fontSize="sm" color="gray.600" mt={1}>Recibido por {item.usuarioResponsable ?? '—'}</Text>
          )}
          {item.estado === 'ARCHIVADO' && (
            <Text fontSize="sm" color="gray.600" mt={1}>Archivado en {item.despachoNuevo}</Text>
          )}
          {item.fojasAgregadas > 0 && (
            <Text fontSize="sm" color="gray.600">Fojas agregadas: {item.fojasAgregadas}</Text>
          )}
        </Box>
      </HStack>
    );
  };

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
              <Box maxH="40vh" overflowY="auto" px={1}>
                <Box position="relative" pl={4}>
                  <Box position="absolute" left={1} top={0} bottom={0} w="1px" bg="gray.200" />
                  {movimientos && movimientos.length > 0 ? (
                    movimientos
                      .slice()
                      .sort((a, b) => new Date(a.fechaMovimiento).getTime() - new Date(b.fechaMovimiento).getTime())
                      .map((m, idx) => (
                        <Box key={idx}>{renderMovimientoItem(m)}</Box>
                      ))
                  ) : (
                    <Text color="gray.500">Sin movimientos</Text>
                  )}
                </Box>
              </Box>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
