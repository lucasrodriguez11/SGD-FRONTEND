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
    Textarea,
    Stack,
} from '@chakra-ui/react';
import { type CreateDespachoDto, type Despacho } from '~/services/api';

interface DespachoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateDespachoDto | Partial<CreateDespachoDto>) => Promise<void>;
    initial?: Despacho | null;
}

const TIPO_OPTIONS: Despacho['tipo'][] = [
    'DIRECCION',
    'SUBDIRECCIÓN',
    'AREA',
    'DEPARTAMENTO',
    'SECRETARIA',
];

const ESTADO_OPTIONS: Despacho['estado'][] = ['ACTIVO', 'INACTIVO'];

export const DespachoModal: React.FC<DespachoModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initial,
}) => {
    const isEdit = useMemo(() => Boolean(initial?._id), [initial]);

    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [tipo, setTipo] = useState<Despacho['tipo']>('DIRECCION');
    const [descripcion, setDescripcion] = useState('');
    const [responsable, setResponsable] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [estado, setEstado] = useState<Despacho['estado']>('ACTIVO');

    useEffect(() => {
        if (initial) {
            setNombre(initial.nombre ?? '');
            setCodigo(initial.codigo ?? '');
            setTipo(initial.tipo ?? 'DIRECCION');
            setDescripcion(initial.descripcion ?? '');
            setResponsable(initial.responsable ?? '');
            setEmail(initial.email ?? '');
            setTelefono(initial.telefono ?? '');
            setEstado(initial.estado ?? 'ACTIVO');
        } else {
            setNombre('');
            setCodigo('');
            setTipo('DIRECCION');
            setDescripcion('');
            setResponsable('');
            setEmail('');
            setTelefono('');
            setEstado('ACTIVO');
        }
    }, [initial, isOpen]);

    const handleSubmit = async () => {
        const payload: CreateDespachoDto | Partial<CreateDespachoDto> = {
            nombre,
            codigo,
            tipo,
            descripcion: descripcion || undefined,
            responsable: responsable || undefined,
            email: email || undefined,
            telefono: telefono || undefined,
            ...(isEdit ? { estado } : {}),
        };

        await onSubmit(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent maxW={{ base: '95%', md: '720px' }} mx={{ base: 2, md: 0 }}>
                <ModalHeader>{isEdit ? 'Editar Despacho' : 'Nuevo Despacho'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Stack spacing={4}>
                        <FormControl id="nombre" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                        </FormControl>

                        <FormControl id="codigo" isRequired>
                            <FormLabel>Código</FormLabel>
                            <Input
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                            />
                        </FormControl>

                        <FormControl id="tipo" isRequired>
                            <FormLabel>Tipo</FormLabel>
                            <Select value={tipo} onChange={(e) => setTipo(e.target.value as Despacho['tipo'])}>
                                {TIPO_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl id="descripcion">
                            <FormLabel>Descripción</FormLabel>
                            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                        </FormControl>

                        <FormControl id="responsable">
                            <FormLabel>Responsable</FormLabel>
                            <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} />
                        </FormControl>

                        <FormControl id="email">
                            <FormLabel>Email</FormLabel>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </FormControl>

                        <FormControl id="telefono">
                            <FormLabel>Teléfono</FormLabel>
                            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                        </FormControl>

                        {isEdit && (
                            <FormControl id="estado" isRequired>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value as Despacho['estado'])}
                                >
                                    {ESTADO_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose} variant="ghost" mr={3}>
                        Cancelar
                    </Button>
                    <Button colorScheme="blue" onClick={handleSubmit}>
                        {isEdit ? 'Guardar cambios' : 'Crear'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DespachoModal;
