export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: '3fba556e-5d4a-48e3-8e1a-fd57c12cb82e',
            authority: 'https://login.microsoftonline.com/common'
        }
    },
    apiConfig: {
        scopes: ['user.read'],
        uri: 'https://graph.microsoft.com/v1.0/me'
    }
};
