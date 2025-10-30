import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';


// Tipos para el formulario
interface ExpedienteForm {
  numeroExpediente: string;
  iniciador: string;
  tema: string;
  prioridad: 'Alta' | 'Normal' | 'Baja';
  extracto?: string;
  fojas: number;
  despachoActual: string;
}

// Lista de temas disponibles
const TEMAS = [
  'BARRIDO', 'DESMALEZAMIENTO', 'INSPECCION', 'PODA', 
  'CORTE AL RAS', 'LIMPIEZA', 'REPARACION', 'PLANITES/ARBOL',
  'COLABORACION - DONACION', 'EVENTOS', 'RRHH'
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpedienteForm) => Promise<void>;
  expedienteInicial?: ExpedienteForm;
}

export const ExpedienteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  expedienteInicial
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExpedienteForm>({
    defaultValues: expedienteInicial
  });
  const toast = useToast();

  const onSubmitForm = async (data: ExpedienteForm) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      toast({
        title: 'Error al guardar',
        status: 'error',
        duration: 3000
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {expedienteInicial ? 'Editar Expediente' : 'Nuevo Expediente'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmitForm)}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Número de Expediente</FormLabel>
                <Input
                  {...register('numeroExpediente', { required: true })}
                  placeholder="Ej: EXP-2024-001"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Iniciador</FormLabel>
                <Input
                  {...register('iniciador', { required: true })}
                  placeholder="Nombre del iniciador"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tema</FormLabel>
                <Select {...register('tema', { required: true })}>
                  {TEMAS.map(tema => (
                    <option key={tema} value={tema}>{tema}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Prioridad</FormLabel>
                <Select {...register('prioridad', { required: true })}>
                  <option value="Baja">Baja</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Extracto</FormLabel>
                <Textarea
                  {...register('extracto')}
                  placeholder="Descripción breve..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fojas</FormLabel>
                <Input
                  type="number"
                  {...register('fojas', { required: true, min: 0 })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Despacho Actual</FormLabel>
                <Input
                  {...register('despachoActual', { required: true })}
                  placeholder="Área o despacho actual"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                type="submit"
                w="full"
                isLoading={isSubmitting}
                mt={4}
              >
                {expedienteInicial ? 'Actualizar' : 'Crear'}
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};