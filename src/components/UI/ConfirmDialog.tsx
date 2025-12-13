import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Text,
    VStack,
    Icon,
    useColorModeValue,
    Box,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

export type ConfirmType = 'warning' | 'success' | 'info' | 'error';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning',
    isLoading = false,
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: FaCheckCircle, color: 'green.500' };
            case 'info':
                return { icon: FaInfoCircle, color: 'blue.500' };
            case 'error':
                return { icon: FaTimesCircle, color: 'red.500' };
            case 'warning':
            default:
                return { icon: FaExclamationTriangle, color: 'orange.500' };
        }
    };

    const { icon: IconComponent, color } = getIconAndColor();

    const getConfirmButtonColor = () => {
        switch (type) {
            case 'success':
                return 'green';
            case 'info':
                return 'blue';
            case 'error':
                return 'red';
            case 'warning':
            default:
                return 'orange';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <ModalContent bg={bgColor} borderRadius="2xl" boxShadow="2xl" mx={4}>
                <ModalHeader pb={2}>
                    <VStack spacing={3}>
                        <Box
                            p={3}
                            borderRadius="full"
                            bg={`${color}.50`}
                            color={color}
                            fontSize="2xl"
                        >
                            <Icon as={IconComponent} />
                        </Box>
                        <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                            {title}
                        </Text>
                    </VStack>
                </ModalHeader>

                <ModalBody pt={0} pb={6}>
                    <Text textAlign="center" color="gray.600" lineHeight="1.6">
                        {message}
                    </Text>
                </ModalBody>

                <ModalFooter pt={0} gap={3} justifyContent="center">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        size="md"
                        borderRadius="lg"
                        borderColor={borderColor}
                        _hover={{ bg: 'gray.50' }}
                        isDisabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        colorScheme={getConfirmButtonColor()}
                        onClick={onConfirm}
                        size="md"
                        borderRadius="lg"
                        isLoading={isLoading}
                        loadingText="Procesando..."
                    >
                        {confirmText}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};




