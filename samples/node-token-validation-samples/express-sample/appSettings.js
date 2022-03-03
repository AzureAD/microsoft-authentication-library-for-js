const appSettings = {
  appCredentials: {
      clientId: "client-id",
      tenantId: "tenant-id",
      clientSecret: "client-secret"
  },
  authRoutes: {
      redirect: "/redirect",
      error: "/error", // the wrapper will redirect to this route in case of any error.
      unauthorized: "/unauthorized" // the wrapper will redirect to this route in case of unauthorized access attempt.
  },
  protectedResources: {
    graphAPI: {
        endpoint: "https://graph.microsoft.com/v1.0/me",
        scopes: ["user.read"]
    },
    custom: {
      scopes: ["custom-scope"]
    }
  }
}

module.exports = appSettings;