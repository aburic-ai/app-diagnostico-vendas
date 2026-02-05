/**
 * Google Apps Script — Aba "compradores"
 *
 * Recebe dados do webhook Hotmart (via Edge Function) e atualiza a planilha.
 * Cada comprador tem uma linha; cada produto tem sua coluna com o valor pago.
 *
 * SETUP:
 * 1. Abrir a planilha no Google Sheets
 * 2. Extensões → Apps Script
 * 3. Colar este código inteiro (substituir qualquer código existente)
 * 4. Clicar em "Implantar" → "Nova implantação"
 * 5. Tipo: "App da Web"
 * 6. Executar como: "Eu" (sua conta)
 * 7. Quem tem acesso: "Qualquer pessoa"
 * 8. Copiar a URL gerada
 * 9. Adicionar como secret no Supabase:
 *    npx supabase secrets set GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/XXXX/exec" --project-ref yvjzkhxczbxidtdmkafx
 * 10. Redeployar hotmart-webhook:
 *    npx supabase functions deploy hotmart-webhook --project-ref yvjzkhxczbxidtdmkafx
 */

// ========================
// CONFIGURAÇÃO
// ========================

var SHEET_NAME = 'compradores';

// Colunas (1-indexed):
// A=1: Nome | B=2: Documento | C=3: Email | D=4: Telefone
// E=5: Imersão | F=6: Gravação | G=7: Diagnóstico
// H=8: Ticket | I=9: Status
var COL_NOME = 1;
var COL_DOCUMENTO = 2;
var COL_EMAIL = 3;
var COL_TELEFONE = 4;
var COL_IMERSAO = 5;
var COL_GRAVACAO = 6;
var COL_DIAGNOSTICO = 7;
var COL_TICKET = 8;
var COL_STATUS = 9;

// Mapeamento: product_slug → coluna na planilha
var PRODUCT_COLUMNS = {
  'imersao-diagnostico-vendas': COL_IMERSAO,
  'aulas-editadas': COL_GRAVACAO,
  'diagnostico-pdf': COL_DIAGNOSTICO,
};

var HEADERS = [
  'Nome', 'Documento', 'Email', 'Telefone',
  'Imersão', 'Gravação', 'Diagnóstico',
  'Ticket', 'Status'
];

// ========================
// ENTRY POINT
// ========================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = getOrCreateSheet();
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'purchase') {
      return handlePurchase(sheet, data);
    } else if (data.action === 'refund') {
      return handleRefund(sheet, data);
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + data.action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ========================
// HANDLERS
// ========================

function handlePurchase(sheet, data) {
  var email = (data.email || '').toLowerCase().trim();
  if (!email) {
    return jsonResponse({ success: false, error: 'Email missing' });
  }

  var row = findRowByEmail(sheet, email);
  var productCol = PRODUCT_COLUMNS[data.product_slug] || null;

  if (row > 0) {
    // Comprador já existe — atualizar dados básicos + produto
    sheet.getRange(row, COL_NOME).setValue(data.name || '');
    sheet.getRange(row, COL_DOCUMENTO).setValue(data.document || '');
    sheet.getRange(row, COL_TELEFONE).setValue(data.phone || '');

    if (productCol) {
      sheet.getRange(row, productCol).setValue(data.price || 0);
    }

    updateTicketAndStatus(sheet, row);
  } else {
    // Novo comprador — adicionar linha
    var newRow = sheet.getLastRow() + 1;

    sheet.getRange(newRow, COL_NOME).setValue(data.name || '');
    sheet.getRange(newRow, COL_DOCUMENTO).setValue(data.document || '');
    sheet.getRange(newRow, COL_EMAIL).setValue(email);
    sheet.getRange(newRow, COL_TELEFONE).setValue(data.phone || '');

    if (productCol) {
      sheet.getRange(newRow, productCol).setValue(data.price || 0);
    }

    // Ticket = soma dos produtos (fórmula)
    // Locale BR usa ponto-e-vírgula como separador de argumentos
    sheet.getRange(newRow, COL_TICKET).setFormula(
      '=IF(SUM(E' + newRow + ':G' + newRow + ')=0;"";SUM(E' + newRow + ':G' + newRow + '))'
    );

    sheet.getRange(newRow, COL_STATUS).setValue('Aprovado');
  }

  return jsonResponse({ success: true, action: 'purchase', email: email });
}

function handleRefund(sheet, data) {
  var email = (data.email || '').toLowerCase().trim();
  if (!email) {
    return jsonResponse({ success: false, error: 'Email missing' });
  }

  var row = findRowByEmail(sheet, email);
  if (row <= 0) {
    return jsonResponse({ success: false, error: 'Buyer not found: ' + email });
  }

  var productCol = PRODUCT_COLUMNS[data.product_slug] || null;

  // Limpar valor do produto reembolsado
  if (productCol) {
    sheet.getRange(row, productCol).setValue('');
  }

  updateTicketAndStatus(sheet, row);

  return jsonResponse({ success: true, action: 'refund', email: email });
}

// ========================
// HELPERS
// ========================

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Criar headers
    for (var i = 0; i < HEADERS.length; i++) {
      sheet.getRange(1, i + 1).setValue(HEADERS[i]);
    }
    // Formatar headers (negrito, fundo cinza)
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e0e0e0');
    // Congelar primeira linha
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function findRowByEmail(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1; // Só tem header

  var emails = sheet.getRange(2, COL_EMAIL, lastRow - 1, 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    if ((emails[i][0] || '').toString().toLowerCase().trim() === email) {
      return i + 2; // +2: 1-indexed + header row
    }
  }

  return -1;
}

function updateTicketAndStatus(sheet, row) {
  // Verificar se algum produto tem valor
  var imersao = sheet.getRange(row, COL_IMERSAO).getValue() || 0;
  var gravacao = sheet.getRange(row, COL_GRAVACAO).getValue() || 0;
  var diagnostico = sheet.getRange(row, COL_DIAGNOSTICO).getValue() || 0;

  var total = (parseFloat(imersao) || 0) + (parseFloat(gravacao) || 0) + (parseFloat(diagnostico) || 0);

  // Status baseado em se tem algum produto ativo
  if (total > 0) {
    sheet.getRange(row, COL_STATUS).setValue('Aprovado');
  } else {
    sheet.getRange(row, COL_STATUS).setValue('Reembolsado');
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
