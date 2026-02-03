#!/bin/bash

# Script de Teste - Edge Function: generate-audio
# Usage: ./test-generate-audio.sh <email ou transaction_id>

SUPABASE_URL="https://yvjzkhxczbxidtdmkafx.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4"

EMAIL="${1:-teste@exemplo.com}"

echo "========================================"
echo "🧪 Testando Edge Function: generate-audio"
echo "========================================"
echo ""
echo "📧 Email: $EMAIL"
echo "🌐 Endpoint: $SUPABASE_URL/functions/v1/generate-audio"
echo ""

# Fazer requisição
curl -X POST "$SUPABASE_URL/functions/v1/generate-audio" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"ghl_contact_id\": \"test-contact-123\"
  }" \
  -w "\n\n⏱️  Status: %{http_code}\n⏱️  Tempo: %{time_total}s\n" \
  -v

echo ""
echo "========================================"
echo "✅ Teste concluído!"
echo "========================================"
