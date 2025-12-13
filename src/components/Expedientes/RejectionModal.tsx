import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    useColorModeValue,
} from '@chakra-ui/react';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    const bg = useColorModeValue('white', 'gray.800');
    const text = useColorModeValue('gray.600', 'gray.300');

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay backdropFilter="blur(2px)" />
            <ModalContent bg={bg}>
                <ModalHeader>Rechazar Expediente</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text color={text}>
                        ¿Estás seguro de rechazar este expediente? Volverá al despacho de origen y se notificará al emisor.
                    </Text>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button colorScheme="red" onClick={onConfirm} isLoading={isLoading}>
                        Rechazar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
