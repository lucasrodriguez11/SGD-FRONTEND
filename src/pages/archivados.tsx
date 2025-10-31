import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Heading, Table, Tbody, Td, Th, Thead, Tr, useDisclosure, useToast, Flex, Text, Badge, Grid, GridItem, Input, useColorModeValue } from '@chakra-ui/react';
import { BackBar } from '~/components/Layout/BackBar';
import { authUser, expedientesApi, type Expediente } from '~/services/api';
import { MovimientoModal } from '~/components/Expedientes/MovimientoModal';

const ArchivadosPage: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<Expediente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const u = authUser.get<{ despachoId?: string }>();
  const despachoId = u?.despachoId ?? '';

  const fetchArchivados = useCallback(async () => {
    if (!despachoId) return;
    setLoading(true);
    try {
      const res = await expedientesApi.getByDespacho(despachoId, { estado: 'ARCHIVADO', limit: 50, page: 1 });
      if (res.success && res.data) setRows(res.data.expedientes);
    } finally {
      setLoading(false);
    }
  }, [despachoId]);

  useEffect(() => { void fetchArchivados(); }, [fetchArchivados]);

  const cardBg = useColorModeValue('white', 'gray.900');
  const border = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <BackBar title="Archivados" />
      <Heading mb={6}>Expedientes archivados</Heading>

      <Grid templateColumns={{ base: '1fr', lg: '320px 1fr' }} gap={6}>
        <GridItem>
          <Box p={4} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={border}>
            <Heading size="sm" mb={3}>Filtros</Heading>
            <Input placeholder="Buscar por N° o iniciador" value={search} onChange={(e) => setSearch(e.target.value)} mb={3} />
            <Button onClick={() => void fetchArchivados()} colorScheme="blue" w="full">Actualizar</Button>
          </Box>
        </GridItem>

        <GridItem minW={0}>
          <Box p={0} borderWidth="1px" borderRadius="lg" bg={cardBg} borderColor={border} overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>N° Expediente</Th>
                  <Th>Iniciador</Th>
                  <Th>Despacho</Th>
                  <Th textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && (
                  <Tr><Td colSpan={4}><Flex justify="center" py={6}><Text>Cargando...</Text></Flex></Td></Tr>
                )}
                {!loading && rows
                  .filter(r => r.numeroExpediente.includes(search) || r.iniciador.toLowerCase().includes(search.toLowerCase()))
                  .map((r) => (
                    <Tr key={r._id}>
                      <Td>
                        <Flex direction="column">
                          <Text fontWeight="medium">{r.numeroExpediente}</Text>
                          <Badge mt={1} colorScheme="gray">ARCHIVADO</Badge>
                        </Flex>
                      </Td>
                      <Td>{r.iniciador}</Td>
                      <Td>{r.despachoActual}</Td>
                      <Td textAlign="right">
                        <Button size="sm" colorScheme="blue" onClick={() => { setSelectedExp(r._id); onOpen(); }}>Desarchivar y Enviar</Button>
                      </Td>
                    </Tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <Tr><Td colSpan={4}><Flex justify="center" py={6}><Text color="gray.500">Sin archivados</Text></Flex></Td></Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </GridItem>
      </Grid>

      <MovimientoModal isOpen={isOpen} onClose={() => { onClose(); setSelectedExp(null); }} onSubmit={async () => { onClose(); setSelectedExp(null); await fetchArchivados(); }} expedientes={rows} initialExpedienteId={selectedExp ?? undefined} />
    </Container>
  );
};

export default ArchivadosPage;


