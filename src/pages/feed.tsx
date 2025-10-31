import React, { useEffect, useState } from 'react';
import { Badge, Box, Button, Container, Flex, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { connectNotifications, type NotificationWS } from '~/services/ws';
import { notificationsApi } from '~/services/api';
import { BackBar } from '~/components/Layout/BackBar';

const FeedPage: React.FC = () => {
  const [items, setItems] = useState<Array<{ id?: string; title: string; text: string; color: 'blue' | 'orange' | 'gray' }>>([]);
  const toast = useToast();

  useEffect(() => {
    void (async () => {
      const res = await notificationsApi.list({ limit: 50 });
      if (res.success && res.data) {
        const mapped = res.data.notifications.map((n) => ({ id: (n as any)._id, title: n.type, text: n.message, color: 'blue' as const }));
        setItems(mapped);
      }
    })();
    const ws = connectNotifications((n: NotificationWS) => {
      const text = n.message ?? n.type;
      const color: 'blue' | 'orange' | 'gray' = n.type.includes('MOVIMIENTO') ? 'orange' : 'blue';
      setItems((prev) => [{ title: n.type, text, color }, ...prev].slice(0, 100));
    });
    return () => ws.close();
  }, []);

  return (
    <Container maxW="container.lg" py={10}>
      <BackBar title="Feed" />
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="lg">Feed</Heading>
        <Button size="sm" onClick={() => { setItems([]); localStorage.setItem('notif_unread', '0'); }}>Limpiar</Button>
      </Flex>
      <VStack align="stretch" spacing={3}>
        {items.map((n, idx) => (
          <Box key={idx} p={3} borderWidth="1px" borderRadius="md">
            <Flex align="center" gap={2} mb={1}>
              <Badge colorScheme={n.color}>{n.title}</Badge>
              <Button size="xs" ml="auto" onClick={async () => {
                try { if ((n as any).id) await notificationsApi.markRead((n as any).id as string); } catch { toast({ title: 'No se pudo marcar como leído', status: 'warning', duration: 1500 }); }
                setItems((arr) => arr.filter((_, i) => i !== idx));
              }}>×</Button>
            </Flex>
            <Text color="gray.600">{n.text}</Text>
          </Box>
        ))}
      </VStack>
    </Container>
  );
};

export default FeedPage;


