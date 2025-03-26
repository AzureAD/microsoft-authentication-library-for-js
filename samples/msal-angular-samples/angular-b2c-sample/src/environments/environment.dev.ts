export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: '9067c884-9fa6-414f-9aa4-a565b1cb46be',
        }
    },
    apiConfig: {
        scopes: ['https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read'],
        uri: 'https://fabrikamb2chello.azurewebsites.net/hello'
    },
    b2cPolicies: {
        names: {
            signUpSignIn: "b2c_1_susi",
            resetPassword: "b2c_1_reset",
            editProfile: "b2c_1_edit_profile"
        },
        authorities: {
            signUpSignIn: {
                authority: 'https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi'
            },
            resetPassword: {
                authority: 'https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_reset'
            },
            editProfile: {
                authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_edit_profile"
            }
        },
        authorityDomain: "fabrikamb2c.b2clogin.com"
    }
};
