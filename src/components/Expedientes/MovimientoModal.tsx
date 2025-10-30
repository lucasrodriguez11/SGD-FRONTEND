import React, { useState } from 'react';
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

export const MovimientoModal = ({ isOpen, onClose, onSubmit, expedientes }) => {
  const [expedienteId, setExpedienteId] = useState('');
  const [despachoNuevo, setDespachoNuevo] = useState('');
  const [fojasAgregadas, setFojasAgregadas] = useState(0);
  const [estado, setEstado] = useState('RECEPCIONADO');

  const handleSubmit = () => {
    onSubmit({ expedienteId, despachoNuevo, fojasAgregadas, estado });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Registrar Movimiento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="expedienteId" isRequired>
            <FormLabel>Expediente</FormLabel>
            <Select
              placeholder="Selecciona un expediente"
              value={expedienteId}
              onChange={(e) => setExpedienteId(e.target.value)}
            >
              {expedientes.map((expediente) => (
                <option key={expediente._id} value={expediente._id}>
                  {expediente.numeroExpediente} - {expediente.iniciador}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl id="despachoNuevo" mt={4} isRequired>
            <FormLabel>Despacho Nuevo</FormLabel>
            <Input
              value={despachoNuevo}
              onChange={(e) => setDespachoNuevo(e.target.value)}
            />
          </FormControl>

          <FormControl id="fojasAgregadas" mt={4}>
            <FormLabel>Fojas Agregadas</FormLabel>
            <Input
              type="number"
              value={fojasAgregadas}
              onChange={(e) => setFojasAgregadas(Number(e.target.value))}
            />
          </FormControl>

          <FormControl id="estado" mt={4} isRequired>
            <FormLabel>Estado</FormLabel>
            <Select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="RECEPCIONADO">RECEPCIONADO</option>
              <option value="ENVIADO">ENVIADO</option>
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Registrar
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
