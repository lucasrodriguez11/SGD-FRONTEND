import React, { useEffect, useState } from 'react';
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
  useToast,
  Switch,
  HStack
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { despachosApi, temasApi, type Despacho, type Tema } from '~/services/api';


// Tipos para el formulario
interface ExpedienteForm {
  numeroExpediente: string;
  iniciador: string;
  tema: string;
  prioridad: 'Alta' | 'Normal' | 'Baja';
  extracto?: string;
  fojas: number;
  despachoActual: string;
  fechaVencimiento?: string;
}

// Eliminado: los temas se cargan dinámicamente

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
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ExpedienteForm>({
    defaultValues: expedienteInicial
  });
  const toast = useToast();

  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [enableVenc, setEnableVenc] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await despachosApi.getActivos();
        if (res.success && res.data) setDespachos(res.data.despachos);
      } catch {
        // ignore
      }
      try {
        const t = await temasApi.list();
        if (t.success && t.data) setTemas(t.data.temas);
      } catch { }
    };
    if (isOpen) void load();
  }, [isOpen]);

  const onSubmitForm = async (data: ExpedienteForm) => {
    try {
      await onSubmit(data);
      onClose();
    } catch {
      toast({
        title: 'Error al guardar',
        status: 'error',
        duration: 3000
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent maxW={{ base: '95%', md: '720px' }} mx={{ base: 2, md: 0 }}>
        <ModalHeader>
          {expedienteInicial ? 'Editar Expediente' : 'Registrar Expediente'}
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
                <Select {...register('tema', { required: true })} placeholder="Selecciona un tema">
                  {temas.map((t) => (
                    <option key={t._id} value={t.nombre}>{t.nombre}</option>
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
                  {...register('fojas', { required: true, min: 0, valueAsNumber: true })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Despacho Actual</FormLabel>
                <Select {...register('despachoActual', { required: true })} placeholder="Selecciona un despacho">
                  {despachos.map((d) => (
                    <option key={d._id} value={d.nombre}>{d.tipo} - {d.nombre}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <HStack justify="space-between" mb={1}>
                  <FormLabel m={0}>Vencimiento</FormLabel>
                  <HStack spacing={2}>
                    <Switch size="sm" isChecked={enableVenc} onChange={(e) => setEnableVenc(e.target.checked)} />
                    <FormLabel m={0} fontSize="sm">Activar</FormLabel>
                  </HStack>
                </HStack>
                {enableVenc && (
                  <Input type="date" {...register('fechaVencimiento')} />
                )}
              </FormControl>

              <Button
                colorScheme="blue"
                type="submit"
                w="full"
                isLoading={isSubmitting}
                mt={4}
              >
                {expedienteInicial ? 'Actualizar' : 'Registrar'}
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};