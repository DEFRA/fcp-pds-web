const TABLES = require('./tables')

const PRIMARY_KEYS = {
  [TABLES.category]: 'categoryId',
  [TABLES.debtData]: 'debtDataId',
  [TABLES.invoiceLine]: 'invoiceLineId',
  [TABLES.manualLedgerPaymentRequest]: 'manualLedgerPaymentRequestId',
  [TABLES.paymentRequest]: 'paymentRequestId',
  [TABLES.qualityCheck]: 'qualityCheckId'
}

const COLUMNS = {
  [TABLES.category]: [
    'categoryId',
    'name'
  ],
  [TABLES.debtData]: [
    'debtDataId',
    'paymentRequestId',
    'schemeId',
    'frn',
    'reference',
    'netValue',
    'debtType',
    'recoveryDate',
    'attachedDate',
    'createdDate',
    'createdBy',
    'createdById',
    'migrated',
    'migrationId'
  ],
  [TABLES.invoiceLine]: [
    'invoiceLineId',
    'paymentRequestId',
    'schemeCode',
    'accountCode',
    'fundCode',
    'description',
    'value',
    'marketingYear',
    'agreementNumber',
    'deliveryBody',
    'stateAid',
    'convergence'
  ],
  [TABLES.manualLedgerPaymentRequest]: [
    'manualLedgerPaymentRequestId',
    'paymentRequestId',
    'ledgerPaymentRequestId',
    'createdBy',
    'createdDate',
    'active',
    'original',
    'createdById'
  ],
  [TABLES.paymentRequest]: [
    'paymentRequestId',
    'schemeId',
    'sourceSystem',
    'deliveryBody',
    'invoiceNumber',
    'frn',
    'sbi',
    'ledger',
    'marketingYear',
    'agreementNumber',
    'contractNumber',
    'paymentRequestNumber',
    'currency',
    'schedule',
    'dueDate',
    'originalSettlementDate',
    'originalInvoiceNumber',
    'invoiceCorrectionReference',
    'value',
    'received',
    'released',
    'referenceId',
    'correlationId',
    'netValue',
    'categoryId',
    'claimDate',
    'exchangeRate',
    'eventDate',
    'vendor',
    'trader',
    'fesCode',
    'annualValue',
    'remittanceDescription',
    'providesAccountingValues'
  ],
  [TABLES.qualityCheck]: [
    'qualityCheckId',
    'paymentRequestId',
    'checkedDate',
    'checkedBy',
    'status',
    'checkedById'
  ],
  [TABLES.scheme]: [
    'schemeId',
    'name'
  ]
}

const pickColumns = (record, table) => {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([column]) => COLUMNS[table].includes(column))
      .filter(([column]) => column !== PRIMARY_KEYS[table])
  )
}

module.exports = {
  PRIMARY_KEYS,
  COLUMNS,
  pickColumns
}
