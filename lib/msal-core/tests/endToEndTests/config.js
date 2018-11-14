module.exports = {
    appUrl: 'https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA',
    authorityInstance: 'https://login.microsoftonline.com/common',
    tenant: 'msidlab4.onmicrosoft.com',
    urlNavigate: this.instance + this.tenant + '/oauth2/authorize',
    assignedUser: 'IDLAB@msidlab4.onmicrosoft.com',
    MSAUser: 'MSIDLAB4@outlook.com',
    clientID: '0a7ee018-cfe8-4442-a66d-dcc5a47657d9',
    AppIdExternalApi: 'c22b3114-88ce-48fc-b728-3591a2e420a6',
    graphScope: ["user.read"],
    externalAPIScope: ['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user'],
    password: process.env.loginPassword,
    MSAPassword: process.env.MSA_MSIDLAB4_Password
}