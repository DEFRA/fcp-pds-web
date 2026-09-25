const adminPermissions = {
  applicationAdmin: 'Web.Pds.Admin'
}

const mgmtPermissions = {
  reportViewer: 'Management.Pay.Report',
  eventViewer: 'Management.Pay.Event',
  holdViewer: 'Management.Pay.Hold',
  injectionViewer: 'Management.Pay.Injection',
  closureViewer: 'Management.Pay.Closure',
  alertViewer: 'Management.Pay.Alert',
  statementViewer: 'Management.Doc.Statement',
  metricsViewer: 'Management.Pds.Metrics',
  resetViewer: 'Management.Pay.Reset',
  sequenceViewer: 'Management.Pay.Sequence',
  batchViewer: 'Management.Pay.Batch'
}

const rePermissions = {
  debtDataViewer: 'Request.Editor.Debt',
  ledgerViewer: 'Request.Editor.Ledger'
}

module.exports = {
  ...adminPermissions,
  ...mgmtPermissions,
  ...rePermissions
}
