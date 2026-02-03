# 🧪 GUIA DE TESTE COM USUÁRIOS REAIS

**Data:** 2026-02-03
**Objetivo:** Testar fluxo completo do app com 3 usuários
**Tempo estimado:** ~30 minutos por usuário

---

## 📋 ANTES DE COMEÇAR

### 1. Preparação do Ambiente (15 min)

**1.1. Verificar Admin está funcional**
```
URL: https://app-diagnostico-vendas.vercel.app/admin
Login: seu-email-admin@gmail.com
```

**Checklist Admin:**
- [ ] Consegue fazer login
- [ ] Status do evento está em "offline"
- [ ] Abas estão configuradas corretamente
- [ ] Assistente IA está ativado

**1.2. Configurar Abas no Admin**

No Admin, vá até "LIBERAÇÃO DE ABAS":

**Preparação:**
- Toggle: ✅ Ligado
- Liberar: `2026-02-01` `00:00`
- Bloquear: `2026-02-28` `09:30`

**Ao Vivo:**
- Toggle: ❌ Desligado (vamos ligar durante o teste)
- Liberar: `2026-02-28` `09:30`
- Bloquear: `2026-03-01` `18:00`

**Pós-Evento:**
- Toggle: ❌ Desligado
- Liberar: `2026-03-01` `18:00`
- Bloquear: (vazio)

**Salvar Configurações**

**1.3. Criar Oferta de Teste Hotmart (se ainda não existir)**

- Produto: Imersão Diagnóstico de Vendas
- Preço: **R$ 1,00** (teste)
- Thank You Page: `https://app-diagnostico-vendas.vercel.app/obrigado?transaction={transaction_id}`

**Copiar link de compra e ter pronto**

---

## 👥 PERFIL DOS TESTADORES

**Testador 1:** Vai fazer compra completa (fluxo ideal)
**Testador 2:** Vai testar sem compra (acesso negado)
**Testador 3:** Vai fazer compra + testar recursos avançados

---

## 🧪 TESTE 1: FLUXO COMPLETO (Testador 1)

### Fase 1: Compra e Thank You Page (10 min)

**1. Envie o link de compra**
```
Link: [Link da oferta R$ 1 do Hotmart]
Instruções: "Faça a compra usando cartão de teste"
```

**2. Aguarde processamento**
- Hotmart processa pagamento (~10-30 segundos)
- Webhook envia dados para app
- Compra é registrada

**3. Testador chega na Thank You Page**

**✅ VALIDAR:**
- [ ] URL é: `/obrigado?transaction=HP...`
- [ ] Mostra: "COMPRA IDENTIFICADA!" (verde)
- [ ] Exibe: Formulário "Protocolo de Iniciação" (8 perguntas)
- [ ] **NÃO** mostra: "Acesso Negado" ou botão "Skip"

**Se der erro "Acesso Negado":**
```bash
# Verificar no banco se compra foi registrada
# Supabase Dashboard → SQL Editor:
SELECT * FROM purchases WHERE transaction_id = 'HP...';

# Se não houver resultado, webhook não processou
# Aguardar mais 30s e recarregar página

# Se ainda não funcionar, liberar manualmente:
UPDATE purchases SET manual_approval = true WHERE email = 'email-testador@gmail.com';
```

---

### Fase 2: Pesquisa IMPACT (5 min)

**4. Testador preenche as 8 questões**

**Orientação ao testador:**
```
"Responda as 8 perguntas de calibragem sobre seu negócio.
Pode responder de forma realista ou fictícia, como preferir."
```

**Perguntas (para referência):**
1. Inspiração - Identidade (1-10)
2. Motivação - Sequência (1-10)
3. Preparação - Prova (1-10)
4. Apresentação - Complexidade (1-10)
5. Conversão - Urgência (1-10)
6. Transformação - Comando (1-10)
7. (Opcional) Informações adicionais
8. (Opcional) Interesse em mentoria

**✅ VALIDAR:**
- [ ] Consegue selecionar valores de 1-10
- [ ] Consegue avançar entre perguntas
- [ ] Botão "Próxima" / "Concluir" funcionam
- [ ] Não há erros no console (F12)

---

### Fase 3: Criação de Senha e WhatsApp (5 min)

**5. Após concluir pesquisa**

**✅ VALIDAR:**
- [ ] Mostra tela: "Crie sua senha de acesso"
- [ ] Campo de senha + confirmação
- [ ] Botão "Criar Senha e Continuar"

**6. Testador cria senha**

**Instruções:**
```
"Crie uma senha que você vai lembrar.
Ex: teste123"
```

**✅ VALIDAR:**
- [ ] Senha é criada com sucesso
- [ ] Mostra tela de confirmação WhatsApp
- [ ] Exibe número de telefone para confirmar
- [ ] Botão "Confirmar e Acessar"

**7. Confirma WhatsApp e acessa app**

**✅ VALIDAR:**
- [ ] Redireciona para: `/pre-evento`
- [ ] Usuário está logado automaticamente

---

### Fase 4: Aba Preparação (5 min)

**8. Testador explora Aba Preparação**

**Orientação:**
```
"Explore a aba Preparação livremente.
Clique nos cards, faça check-ins, veja seu XP aumentar."
```

**✅ VALIDAR:**
- [ ] XP badge mostra **100 XP** (ganhou na compra)
- [ ] Mostra 4 cards: Protocolo, Dossiê, Bônus, Avatar
- [ ] Card "Protocolo" está com check verde (completado)
- [ ] Outros cards permitem check-in (ganham XP)
- [ ] Vídeos carregam corretamente (se houver)
- [ ] Sidebar mostra nome + email corretos

**Testes específicos:**

**8.1. Check-in em card**
- Clicar "Fazer Check-in" em qualquer card
- XP deve aumentar (+20 XP por check-in)
- Card deve mostrar check verde

**8.2. Abrir ProfileModal**
- Clicar no avatar (canto superior direito)
- Modal abre com dados do usuário
- Testar editar nome → Salvar
- Nome atualiza na sidebar

**8.3. Drawer de Avisos**
- Clicar no ícone de notificações (sino)
- Drawer abre lateral direita
- Se houver avisos, mostrar lista
- Testar "Marcar todos como lido"

---

### Fase 5: Aba Ao Vivo (5 min)

**9. Admin libera Aba Ao Vivo**

**No Admin (você):**
1. Ir em "LIBERAÇÃO DE ABAS"
2. Ao Vivo → Ligar toggle (círculo azul)
3. Clicar "SALVAR CONFIGURAÇÕES DE ABAS"

**10. Testador tenta acessar Ao Vivo**

**Orientação:**
```
"Clique na aba 'Ao Vivo' no menu lateral"
```

**✅ VALIDAR:**
- [ ] Aba está acessível (não mostra "Aba Bloqueada")
- [ ] Status do evento: "offline"
- [ ] Mostra **countdown** para início do evento
- [ ] Data do evento: 28/02/2026 às 09:30

**11. Admin inicia transmissão**

**No Admin (você):**
1. Clicar "INICIAR TRANSMISSÃO" (gradiente vermelho)
2. Status muda para "live"
3. Day 1 selecionado, Módulo 0

**12. Testador vê evento ao vivo**

**✅ VALIDAR:**
- [ ] Countdown desaparece
- [ ] Mostra: "DIA 1 - MÓDULO 0"
- [ ] Player de vídeo aparece (ou embed YouTube)
- [ ] Checklist IMPACT visível (6 dimensões)
- [ ] Chat IA visível (se ativado)

**13. Testar interações ao vivo**

**13.1. Check-in no módulo**
- Clicar "Fazer Check-in" na faixa superior
- XP aumenta (+20 XP)
- Módulo marcado como assistido

**13.2. Checklist IMPACT**
- Clicar em uma dimensão (ex: "Inspiração")
- Slider aparece (1-10)
- Ajustar valor
- Valor salva automaticamente

**13.3. Admin muda módulo**
- Admin avança para Módulo 1
- Testador vê mudança em tempo real (Realtime Supabase)
- Player atualiza (se URL diferente)

**13.4. Chat IA (se ativado)**
- Clicar no FAB roxo (canto inferior direito)
- Interface do chat abre
- Digitar mensagem: "Como calcular meu score?"
- IA responde (OpenAI)

---

### Fase 6: Aba Pós-Evento (5 min)

**14. Admin libera Aba Pós-Evento**

**No Admin (você):**
1. "LIBERAÇÃO DE ABAS" → Pós-Evento → Ligar toggle
2. Salvar

**15. Testador acessa Pós-Evento**

**✅ VALIDAR:**
- [ ] Aba acessível
- [ ] Mostra **radar com 6 dimensões** (score visualizado)
- [ ] Exibe **gargalo identificado** (dimensão com menor valor)
- [ ] Card "Relatório Final" visível
- [ ] Botão "Baixar Relatório" funciona

**16. Testar funcionalidades pós-evento**

**16.1. Radar interativo**
- Passar mouse sobre dimensões
- Tooltip mostra valor exato

**16.2. Download do relatório**
- Clicar "Baixar Relatório Final"
- PDF é gerado e baixado
- Contém: Nome, Score, Gargalo, Dimensões

**16.3. NPS (se habilitado)**
- Modal NPS aparece automaticamente
- Testador avalia de 0-10
- Pode adicionar feedback textual
- Enviar → Modal fecha

---

## 🧪 TESTE 2: ACESSO NEGADO (Testador 2)

**Objetivo:** Validar que não-compradores são bloqueados

### Teste de Segurança (5 min)

**1. Testador 2 tenta acessar `/obrigado` SEM comprar**

**URL direta:**
```
https://app-diagnostico-vendas.vercel.app/obrigado
```

**✅ VALIDAR:**
- [ ] Após 10 segundos, mostra: "Acesso Negado"
- [ ] **NÃO** mostra: Pesquisa ou botão "Continuar sem verificação"
- [ ] Exibe: Botão "Falar com Suporte"
- [ ] Explicação clara do motivo

**2. Testador 2 tenta acessar `/pre-evento` SEM login**

**URL direta:**
```
https://app-diagnostico-vendas.vercel.app/pre-evento
```

**✅ VALIDAR:**
- [ ] Redireciona para: `/login` ou mostra modal de login
- [ ] Não permite acesso sem autenticação

**3. Testador 2 tenta fazer login com email random**

**✅ VALIDAR:**
- [ ] Login falha (email não cadastrado)
- [ ] Mensagem de erro clara

---

## 🧪 TESTE 3: RECURSOS AVANÇADOS (Testador 3)

**Objetivo:** Testar features mais complexas

### Teste Avançado (10 min)

**1. Testador 3 faz compra completa (mesmo fluxo Testador 1)**

**2. Testes específicos:**

**2.1. Admin envia Aviso**
- Admin cria aviso: "Teste de notificação em tempo real"
- Testador 3 vê notificação aparecer (sem refresh)
- Badge no sino atualiza contador

**2.2. Oferta IMPACT**
- Admin desbloqueia oferta: "DESBLOQUEAR OFERTA IMPACT"
- Admin torna visível: Toggle "Oferta Visível"
- Testador 3 vê card de oferta aparecer
- Clicar "Ver Oferta" → Modal abre com links

**2.3. Intervalo de Almoço**
- Admin ativa: "INICIAR INTERVALO"
- Status muda para "lunch"
- Testador 3 vê tela: "Intervalo para Almoço" com countdown

**2.4. Atividade Prática**
- Admin muda status para "activity"
- Testador 3 vê: "Atividade Prática em Andamento"
- Instruções aparecem

**2.5. Logout e Login**
- Testador 3 faz logout
- Faz login novamente com email + senha
- Dados persistem (XP, progresso, checks)

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

### Funcionalidades Core

**Autenticação:**
- [ ] Compra processa via webhook Hotmart
- [ ] Thank You Page valida comprador
- [ ] Criação de senha funciona
- [ ] Login/Logout funcionam
- [ ] Não-compradores são bloqueados

**Pesquisa IMPACT:**
- [ ] 8 perguntas carregam corretamente
- [ ] Respostas salvam no banco
- [ ] Score é calculado corretamente
- [ ] Gargalo é identificado

**Sistema XP:**
- [ ] +100 XP na compra
- [ ] +20 XP por check-in
- [ ] Badge atualiza em tempo real
- [ ] Níveis funcionam (Novato → Mestre)

**Controle de Abas:**
- [ ] Preparação liberada desde o início
- [ ] Ao Vivo bloqueada até Admin liberar
- [ ] Pós-Evento bloqueada até Admin liberar
- [ ] Admin bypassa todos os bloqueios

**Realtime (Supabase):**
- [ ] Mudanças de módulo sincronizam
- [ ] Notificações chegam instantaneamente
- [ ] Status do evento atualiza em tempo real
- [ ] Profile updates refletem em todos os lugares

**Admin:**
- [ ] Todos os controles funcionam
- [ ] Mudanças salvam corretamente
- [ ] Iframe mostra visão do participante
- [ ] Avisos são enviados com sucesso

---

## 🐛 TROUBLESHOOTING DURANTE TESTES

### Problema: "Acesso Negado" para comprador válido

**Solução rápida:**
```sql
-- Supabase SQL Editor
UPDATE purchases
SET manual_approval = true
WHERE email = 'email-testador@gmail.com';
```

Então: Testador recarrega `/obrigado`

---

### Problema: Webhook Hotmart não processou

**Verificar:**
1. Supabase Edge Function logs:
   ```bash
   supabase functions logs hotmart-webhook --tail
   ```

2. Banco de dados:
   ```sql
   SELECT * FROM purchases
   WHERE email = 'email-testador@gmail.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Se não houver registro:**
- Aguardar até 1 minuto (webhook pode demorar)
- Ou inserir manualmente:
  ```sql
  INSERT INTO purchases (transaction_id, buyer_name, status, product_slug, price, purchased_at)
  VALUES ('HP-TEST-001', 'Testador', 'approved', 'imersao-diagnostico-vendas', 1.00, NOW());
  ```

---

### Problema: XP não aumenta

**Verificar:**
```sql
SELECT email, xp, completed_steps
FROM profiles
WHERE email = 'email-testador@gmail.com';
```

**Se XP = 0:**
- Check-in pode ter falhado (erro no hook)
- Verificar console (F12) para erros
- Tentar check-in novamente

---

### Problema: Realtime não funciona

**Verificar:**
1. Console do navegador (F12) → Logs de subscription
2. Deve mostrar: "Subscription status: SUBSCRIBED"

**Se não estiver subscrito:**
- Recarregar página
- Verificar Supabase Realtime está habilitado (Dashboard → Database → Replication)

---

### Problema: Chat IA não responde

**Verificar:**
1. Admin → "Assistente IA" está ativado
2. Edge Function logs:
   ```bash
   supabase functions logs chat-completion --tail
   ```

**Se erro de quota:**
- OpenAI atingiu limite
- Usar mensagem fallback ou aumentar quota

---

## 📋 ANOTAÇÕES DURANTE TESTE

Use este espaço para anotar problemas encontrados:

**Testador 1:**
- [ ] Problema: ___________________
- [ ] Solução: ___________________

**Testador 2:**
- [ ] Problema: ___________________
- [ ] Solução: ___________________

**Testador 3:**
- [ ] Problema: ___________________
- [ ] Solução: ___________________

---

## 📊 RELATÓRIO PÓS-TESTE

Após os testes, documente:

### O que funcionou perfeitamente ✅
1. _______________________________
2. _______________________________
3. _______________________________

### O que teve problemas ⚠️
1. _______________________________
2. _______________________________
3. _______________________________

### O que quebrou completamente ❌
1. _______________________________
2. _______________________________

### Feedback dos testadores 💬
1. _______________________________
2. _______________________________
3. _______________________________

---

## 🚀 APÓS OS TESTES

### 1. Limpar dados de teste (opcional)

```sql
-- Deletar compras de teste
DELETE FROM purchases WHERE email IN (
  'testador1@gmail.com',
  'testador2@gmail.com',
  'testador3@gmail.com'
);

-- Deletar profiles de teste
DELETE FROM profiles WHERE email IN (
  'testador1@gmail.com',
  'testador2@gmail.com',
  'testador3@gmail.com'
);
```

### 2. Resetar Admin para estado inicial

- Voltar status para "offline"
- Desligar Ao Vivo e Pós-Evento
- Limpar avisos enviados

### 3. Documentar bugs encontrados

Criar issues no GitHub para cada problema:
```
Título: [BUG] Descrição curta
Descrição:
- O que aconteceu
- O que era esperado
- Steps para reproduzir
- Browser/device usado
```

---

## ✅ BOA SORTE COM OS TESTES!

**Lembre-se:**
- Mantenha um testador no Admin (você) e outros nos dispositivos deles
- Teste em diferentes navegadores se possível (Chrome, Firefox, Safari)
- Anote TUDO que der errado, mesmo que pequeno
- Peça feedback honesto dos testadores sobre UX/UI

**Documentação de referência:**
- [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md) - Se algo quebrar
- [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md) - Deploy e configurações
- [03-DOCS-INDEX.md](./03-DOCS-INDEX.md) - Índice completo

---

**Criado por:** Claude Code
**Data:** 2026-02-03
**Tempo estimado total:** ~1h30 para os 3 testadores
