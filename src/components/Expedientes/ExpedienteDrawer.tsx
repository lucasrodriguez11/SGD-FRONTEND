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
  useColorModeValue,
  Button,
  Flex,
} from '@chakra-ui/react';
import { type Expediente, type Movimiento } from '~/services/api';
import { User, FileText, Bookmark, Building, Calendar, Clock, ArrowRight, Download } from 'lucide-react';

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

  // Dark mode colors
  const bgCard = useColorModeValue('white', 'gray.800');
  const bgCardHeader = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const textLabel = useColorModeValue('gray.500', 'gray.400');
  const textValue = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const timelineColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

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
    <Box p={3} _hover={{ bg: hoverBg }} transition="all 0.2s" borderBottom="1px" borderColor={borderColor}>
      <HStack spacing={4}>
        {icon && <Box color="blue.500">{icon}</Box>}
        <Box flex={1}>
          <Text fontSize="sm" color={textLabel}>{label}</Text>
          <Text fontSize="md" fontWeight="medium" color={textValue}>{value}</Text>
        </Box>
      </HStack>
    </Box>
  );

  const renderMovimientoItem = (item: Movimiento, isLast: boolean) => {
    const titulo = item.estado === 'ENVIADO' ? 'Despachado' : item.estado === 'RECEPCIONADO' ? 'Aceptado' : 'Archivado';
    const color = item.estado === 'ENVIADO' ? 'blue.400' : item.estado === 'RECEPCIONADO' ? 'green.400' : 'gray.500';
    const icon = item.estado === 'ENVIADO' ? <ArrowRight size={14} /> : item.estado === 'RECEPCIONADO' ? <Download size={14} /> : <Bookmark size={14} />;

    return (
      <Flex position="relative" pb={isLast ? 0 : 8}>
        {/* Timeline Line */}
        {!isLast && (
          <Box
            position="absolute"
            left="15px"
            top="30px"
            bottom="0"
            width="2px"
            bg={timelineColor}
            zIndex={0}
          />
        )}

        {/* Timeline Dot */}
        <Flex
          align="center"
          justify="center"
          w="32px"
          h="32px"
          borderRadius="full"
          bg={useColorModeValue('white', 'gray.800')}
          border="2px solid"
          borderColor={color}
          zIndex={1}
          mr={4}
          flexShrink={0}
        >
          <Box w="10px" h="10px" borderRadius="full" bg={color} />
        </Flex>

        {/* Content */}
        <Box flex={1} bg={hoverBg} p={3} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" mb={1}>
            <Text fontWeight="bold" color={textValue} fontSize="sm">{titulo}</Text>
            <Text fontSize="xs" color={textLabel}>{formatFecha(item.fechaMovimiento)}</Text>
          </HStack>

          {item.estado === 'ENVIADO' && (
            <VStack align="start" spacing={1} mt={1}>
              <HStack fontSize="sm" color={textSecondary}>
                <Text fontWeight="medium">{item.despachoAnterior}</Text>
                <ArrowRight size={14} />
                <Text fontWeight="bold" color="blue.500">{item.despachoNuevo}</Text>
              </HStack>
              {item.fojasAgregadas > 0 && (
                <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                  + {item.fojasAgregadas} fojas
                </Badge>
              )}
            </VStack>
          )}

          {item.estado === 'RECEPCIONADO' && (
            <VStack align="start" spacing={1} mt={1}>
              <Text fontSize="sm" color={textSecondary}>
                Recibido por: <Text as="span" fontWeight="medium">{item.usuarioResponsableNombre || item.usuarioResponsable || '—'}</Text>
              </Text>
              <HStack fontSize="xs" color="gray.500">
                <Text>{item.despachoAnterior}</Text>
                <ArrowRight size={12} />
                <Text>{item.despachoNuevo}</Text>
              </HStack>
            </VStack>
          )}

          {item.estado === 'ARCHIVADO' && (
            <Text fontSize="sm" color={textSecondary}>
              Archivado en {item.despachoNuevo || item.despachoAnterior}
            </Text>
          )}

          {item.observaciones && (
            <Text fontSize="xs" color="gray.500" mt={2} fontStyle="italic">
              "{item.observaciones}"
            </Text>
          )}
        </Box>
      </Flex>
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
            <Box bg={bgCard} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
              <HStack spacing={4} p={4} bg={bgCardHeader}>
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
              <HStack justify="space-between" mb={4} align="center">
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  px={2}
                  py={1}
                  borderBottom="2px"
                  borderColor="blue.500"
                  display="inline-block"
                  color={textValue}
                >
                  Historial de Movimientos
                </Text>
                <Button
                  leftIcon={<Download size={16} />}
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={async () => {
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    const margin = 15;
                    let yPos = margin;

                    // --- HEADER ---
                    doc.setFillColor(41, 128, 185); // Blue header
                    doc.rect(0, 0, pageWidth, 25, 'F');

                    doc.setFontSize(18);
                    doc.setTextColor(255, 255, 255);
                    doc.text('REPORTE DE EXPEDIENTE', pageWidth / 2, 16, { align: 'center' });
                    yPos = 35;

                    // --- INFO EXPEDIENTE ---
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);

                    const leftColX = margin;
                    const rightColX = pageWidth / 2 + 10;

                    // Row 1
                    doc.setFont('helvetica', 'bold');
                    doc.text('Expediente:', leftColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(expediente.numeroExpediente, leftColX + 25, yPos);

                    doc.setFont('helvetica', 'bold');
                    doc.text('Estado:', rightColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(expediente.estado, rightColX + 20, yPos);
                    yPos += 8;

                    // Row 2
                    doc.setFont('helvetica', 'bold');
                    doc.text('Iniciador:', leftColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(expediente.iniciador, leftColX + 25, yPos);

                    doc.setFont('helvetica', 'bold');
                    doc.text('Prioridad:', rightColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(expediente.prioridad, rightColX + 20, yPos);
                    yPos += 8;

                    // Row 3
                    doc.setFont('helvetica', 'bold');
                    doc.text('Tema:', leftColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(expediente.tema, leftColX + 25, yPos);

                    doc.setFont('helvetica', 'bold');
                    doc.text('Fojas:', rightColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(expediente.fojas), rightColX + 20, yPos);
                    yPos += 8;

                    // Row 4
                    doc.setFont('helvetica', 'bold');
                    doc.text('Fecha:', leftColX, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(formatFecha(expediente.fechaIngreso), leftColX + 25, yPos);
                    yPos += 8;

                    // Extracto (Full width)
                    if (expediente.extracto) {
                      doc.setFont('helvetica', 'bold');
                      doc.text('Extracto:', leftColX, yPos);
                      yPos += 6;
                      doc.setFont('helvetica', 'normal');
                      const splitExtracto = doc.splitTextToSize(expediente.extracto || '', pageWidth - (margin * 2));
                      doc.text(splitExtracto, leftColX, yPos);
                      yPos += (splitExtracto.length * 5) + 5;
                    } else {
                      yPos += 5;
                    }

                    // --- HISTORIAL TABLE HEADER ---
                    yPos += 5;
                    doc.setFillColor(240, 240, 240);
                    doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text('FECHA', margin + 2, yPos + 5);
                    doc.text('MOVIMIENTO', margin + 40, yPos + 5);
                    doc.text('DETALLE', margin + 90, yPos + 5);
                    yPos += 12;

                    // --- HISTORIAL ROWS ---
                    if (movimientos && movimientos.length > 0) {
                      const sortedMovimientos = movimientos
                        .slice()
                        .sort((a, b) => new Date(a.fechaMovimiento).getTime() - new Date(b.fechaMovimiento).getTime());

                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(9);

                      sortedMovimientos.forEach((mov, idx) => {
                        // Check page break
                        if (yPos > pageHeight - 20) {
                          doc.addPage();
                          yPos = margin;
                          // Redraw header on new page
                          doc.setFillColor(240, 240, 240);
                          doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
                          doc.setFont('helvetica', 'bold');
                          doc.text('FECHA', margin + 2, yPos + 5);
                          doc.text('MOVIMIENTO', margin + 40, yPos + 5);
                          doc.text('DETALLE', margin + 90, yPos + 5);
                          doc.setFont('helvetica', 'normal');
                          yPos += 12;
                        }

                        const fecha = formatFecha(mov.fechaMovimiento);
                        const tipo = mov.estado === 'ENVIADO' ? 'DESPACHADO' : mov.estado === 'RECEPCIONADO' ? 'RECEPCIONADO' : 'ARCHIVADO';

                        // Build detail text
                        let detalle = '';
                        if (mov.estado === 'ENVIADO') {
                          detalle = `De: ${mov.despachoAnterior}\nA: ${mov.despachoNuevo}`;
                          if (mov.fojasAgregadas > 0) detalle += `\n(+${mov.fojasAgregadas} fojas)`;
                        } else if (mov.estado === 'RECEPCIONADO') {
                          const responsable = mov.usuarioResponsableNombre || mov.usuarioResponsable || '---';
                          detalle = `En: ${mov.despachoNuevo}\nPor: ${responsable}`;
                        } else if (mov.estado === 'ARCHIVADO') {
                          detalle = `Archivado en: ${mov.despachoNuevo || mov.despachoAnterior}`;
                        }
                        if (mov.observaciones) {
                          detalle += `\nObs: ${mov.observaciones}`;
                        }

                        // Draw row
                        doc.text(fecha, margin + 2, yPos);
                        doc.text(tipo, margin + 40, yPos);

                        const splitDetalle = doc.splitTextToSize(detalle, pageWidth - margin - 90 - margin);
                        doc.text(splitDetalle, margin + 90, yPos);

                        // Calculate height for next row with more padding
                        const rowHeight = Math.max(10, splitDetalle.length * 5) + 8; // Increased padding

                        // Draw line separator
                        doc.setDrawColor(230, 230, 230);
                        doc.line(margin, yPos + rowHeight - 4, pageWidth - margin, yPos + rowHeight - 4); // Adjusted line position

                        yPos += rowHeight;
                      });
                    } else {
                      doc.text('Sin movimientos registrados', margin, yPos);
                    }

                    // --- FOOTER ---
                    const totalPages = doc.internal.pages.length - 1;
                    for (let i = 1; i <= totalPages; i++) {
                      doc.setPage(i);
                      doc.setFontSize(8);
                      doc.setTextColor(150, 150, 150);
                      doc.text(
                        `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-AR')}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                      );
                    }

                    doc.save(`Expediente_${expediente.numeroExpediente}_${new Date().toISOString().split('T')[0]}.pdf`);
                  }}
                >
                  Exportar PDF
                </Button>
              </HStack>
              <Box maxH="40vh" overflowY="auto" px={1}>
                <Box position="relative" pl={4}>
                  <Box position="absolute" left={1} top={0} bottom={0} w="1px" bg={timelineColor} />
                  {movimientos && movimientos.length > 0 ? (
                    movimientos
                      .slice()
                      .sort((a, b) => new Date(a.fechaMovimiento).getTime() - new Date(b.fechaMovimiento).getTime())
                      .map((m, idx, arr) => (
                        <Box key={m._id ?? idx}>{renderMovimientoItem(m, idx === arr.length - 1)}</Box>
                      ))
                  ) : (
                    <Text color={textLabel}>Sin movimientos</Text>
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
