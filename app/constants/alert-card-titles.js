module.exports = {
  confirmation: {
    recipient: 'New alert recipient',
    globalAlerts: 'New scheme alerts',
    schemeAlerts: (schemeName) => `${schemeName} scheme alerts`
  },
  recipientPages: {
    update: 'Update alert recipient',
    create: 'Add new alert recipient'
  },
  navigation: {
    manageByScheme: 'Manage by scheme',
    manageByRecipient: 'Manage by recipient',
    updateRecipient: 'Update recipient alerts',
    addRecipient: 'Add new recipient',
    removeRecipient: 'Remove recipient'
  }
}
