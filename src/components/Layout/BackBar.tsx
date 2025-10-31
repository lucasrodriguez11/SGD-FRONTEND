import React from 'react';
import { Box, Button, Flex, Heading, Icon, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';

interface BackBarProps {
    title: string;
}

export const BackBar: React.FC<BackBarProps> = ({ title }) => {
    const router = useRouter();
    const bg = useColorModeValue('white', 'gray.900');
    const border = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box mb={6} bg={bg} borderWidth="1px" borderColor={border} borderRadius="lg" px={4} py={3} shadow="sm">
            <Flex align="center" gap={3}>
                <Button size="sm" variant="ghost" leftIcon={<Icon as={ArrowLeft} />} onClick={() => router.back()}>
                    Volver
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/')}>Panel</Button>
                <Heading size="md" ml={2}>{title}</Heading>
            </Flex>
        </Box>
    );
};

export default BackBar;





