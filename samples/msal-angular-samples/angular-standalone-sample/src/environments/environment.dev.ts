export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '0845a021-afdf-4126-abdd-099c5e6948e1',
      authority: 'https://login.microsoftonline.com/common',
    },
  },
  apiConfig: {
    scopes: ['user.read'],
    uri: 'https://graph.microsoft.com/v1.0/me',
  },
};
