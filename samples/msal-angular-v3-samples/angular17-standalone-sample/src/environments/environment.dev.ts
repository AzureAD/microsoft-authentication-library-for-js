export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: 'b5c2e510-4a17-4feb-b219-e55aa5b74144',
            authority: 'https://login.microsoftonline.com/common'
        }
    },
    apiConfig: {
        scopes: ['user.read'],
        uri: 'https://graph.microsoft.com/v1.0/me'
    }
};
