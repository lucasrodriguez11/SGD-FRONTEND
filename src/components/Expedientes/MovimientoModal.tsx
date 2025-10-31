import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { authUser, type AuthUser, type Expediente, type CreateMovimientoDto, despachosApi, type Despacho } from '~/services/api';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMovimientoDto) => Promise<void>;
  expedientes: Expediente[];
  initialExpedienteId?: string;
}

export const MovimientoModal: React.FC<MovimientoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expedientes,
  initialExpedienteId
}) => {
  const [expedienteId, setExpedienteId] = useState(initialExpedienteId ?? '');
  const [despachoNuevo, setDespachoNuevo] = useState('');
  const [fojasAgregadas, setFojasAgregadas] = useState(0);
  const [estado] = useState<'RECEPCIONADO' | 'ENVIADO' | 'ARCHIVADO'>('ENVIADO');
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  // Always exclude my own despacho; no toggle needed per requirements

  const user = authUser.get<AuthUser>() ?? undefined;
  const selectedExpediente = useMemo(() => expedientes.find((e) => e._id === expedienteId), [expedienteId, expedientes]);
  const [miDespachoNombre, setMiDespachoNombre] = useState<string>('');

  useEffect(() => { setExpedienteId(initialExpedienteId ?? ''); }, [initialExpedienteId]);

  // Resolve my despacho nombre for filtering expedientes
  useEffect(() => {
    const loadMyDespacho = async () => {
      try {
        if (!user?.despachoId) return;
        const res = await despachosApi.getById(user.despachoId);
        if (res.success && res.data) setMiDespachoNombre(res.data.despacho.nombre);
      } catch {
        // ignore
      }
    };
    if (isOpen) void loadMyDespacho();
  }, [isOpen, user?.despachoId]);

  const expedientesFiltrados = useMemo(() => {
    const estadosPermitidos = new Set(['RECEPCIONADO', 'ARCHIVADO']);
    return expedientes.filter((e) =>
      (!miDespachoNombre || e.despachoActual === miDespachoNombre) && estadosPermitidos.has(e.estado)
    );
  }, [expedientes, miDespachoNombre]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await despachosApi.getActivos();
        if (res.success && res.data) setDespachos(res.data.despachos);
      } catch {
        // ignore
      }
    };
    if (isOpen) void load();
  }, [isOpen]);

  const handleSubmit = () => {
    void onSubmit({ expedienteId, despachoNuevo, fojasAgregadas, estado });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent maxW={{ base: '95%', md: '640px' }} mx={{ base: 2, md: 0 }}>
        <ModalHeader>Enviar Expediente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="expedienteId" isRequired>
            <FormLabel>Expediente</FormLabel>
            <Select
              placeholder="Selecciona un expediente"
              value={expedienteId}
              onChange={(e) => setExpedienteId(e.target.value)}
            >
              {expedientesFiltrados.map((expediente) => (
                <option key={expediente._id} value={expediente._id}>
                  {expediente.numeroExpediente} - {expediente.iniciador}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl id="despachoNuevo" mt={4} isRequired>
            <FormLabel m={0}>Despacho destino</FormLabel>
            <Select
              placeholder="Selecciona un despacho"
              value={despachoNuevo}
              onChange={(e) => setDespachoNuevo(e.target.value)}
            >
              {despachos
                .filter((d) => {
                  const excludeOwn = user?.despachoId ? d._id !== user.despachoId : true;
                  const excludeCurrentExp = selectedExpediente ? d.nombre !== selectedExpediente.despachoActual : true;
                  return excludeOwn && excludeCurrentExp;
                })
                .map((d) => (
                  <option key={d._id} value={d.nombre}>{d.tipo} - {d.nombre}</option>
                ))}
            </Select>
          </FormControl>

          <FormControl id="fojasAgregadas" mt={4}>
            <FormLabel>Fojas a agregar</FormLabel>
            <Input
              type="number"
              value={fojasAgregadas}
              onChange={(e) => setFojasAgregadas(Number(e.target.value))}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit} isDisabled={!expedienteId || !despachoNuevo}>
            Enviar
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
