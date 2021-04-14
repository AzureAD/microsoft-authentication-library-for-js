/**
 * Enter here the user flows and custom policies for your B2C application
 * To learn more about user flows, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview
 * To learn more about custom policies, visit: https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview
 */
 export const b2cPolicies = {
    names: {
        siso: "B2C_1_SISOPolicy",
        signUp: "B2C_1_SignUpPolicy",
        signIn: "B2C_1_SignInPolicy",
        editProfile: "B2C_1_ProfileEditPolicy"
    },
    authorities: {
       siso: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/",
       signUp: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SignUpPolicy/",
       signIn: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SignInPolicy/",
       editProfile: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_ProfileEditPolicy/"
    },
    authorityDomain: "msidlabb2c.b2clogin.com"
};
