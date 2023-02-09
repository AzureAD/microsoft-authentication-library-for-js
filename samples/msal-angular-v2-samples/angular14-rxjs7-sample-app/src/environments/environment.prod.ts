export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: "ENTER_CLIENT_ID_HERE",
      authority: "https://login.microsoftonline.com/ENTER_TENANT_ID_HERE",
    }
  },
  protectedResources: {
    graphApi: {
      endpoint: "https://graph.microsoft.com/v1.0/me",
    }
  }
};
