export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: "e3b9ad76-9763-4827-b088-80c7a7888f79",
        }
    },
    apiConfig: {
        scopes: ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"],
        uri: "https://msidlabb2c.onmicrosoft.com/msidlabb2capi"
    },
    b2cPolicies: {
        names: {
            signUpSignIn: "B2C_1_SISOPolicy",
            resetPassword: "B2C_1_PasswordResetPolicy",
            editProfile: "B2C_1_ProfileEditPolicy"
        },
        authorities: {
            signUpSignIn: {
                authority: "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy"
            },
            resetPassword: {
                authority: "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/B2C_1_PasswordResetPolicy"
            },
            editProfile: {
                authority: "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/B2C_1_ProfileEditPolicy"
            }
        },
        authorityDomain: "msidlabb2c.b2clogin.com"
    }
};
