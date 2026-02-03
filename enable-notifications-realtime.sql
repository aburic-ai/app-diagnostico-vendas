-- Habilitar Realtime na tabela notifications
-- Isso permite que novos avisos apareçam instantaneamente sem refresh

-- 1. Habilitar replicação para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Verificar que está habilitado (deve retornar 1 row)
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

-- Pronto! Agora as notificações aparecem em tempo real ✨
