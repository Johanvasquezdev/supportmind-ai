const brevo = require('@getbrevo/brevo');
const apiInstance = new brevo.TransactionalEmailsApi();
console.log('Authentications:', apiInstance.authentications);
if (apiInstance.authentications) {
  console.log('Keys in Authentications:', Object.keys(apiInstance.authentications));
}
