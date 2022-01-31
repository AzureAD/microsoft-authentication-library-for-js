"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppTypes = exports.UserTypes = exports.HomeDomains = exports.FederationProviders = exports.B2cProviders = exports.AzureEnvironments = exports.ParamKeys = exports.LAB_SCOPE = exports.LAB_API_ENDPOINT = exports.ENV_VARIABLES = void 0;
exports.ENV_VARIABLES = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    SECRET: "AZURE_CLIENT_SECRET"
};
exports.LAB_API_ENDPOINT = "https://msidlab.com/api";
exports.LAB_SCOPE = "https://msidlab.com/.default";
exports.ParamKeys = {
    AZURE_ENVIRONMENT: "azureenvironment",
    USER_TYPE: "usertype",
    FEDERATION_PROVIDER: "federationprovider",
    B2C_PROVIDER: "b2cprovider",
    HOME_DOMAIN: "homedomain",
    APP_TYPE: "apptype",
    SIGN_IN_AUDIENCE: "signInAudience",
    PUBLIC_CLIENT: "publicClient",
};
// Lab API Query Param Values
exports.AzureEnvironments = {
    B2C_CLOUD: "azureb2ccloud",
    CHINA_CLOUD: "azurechinacloud",
    CLOUD: "azurecloud",
    GERMANY_CLOUD: "azuregermanycloud",
    PPE: "azureppe",
    US_GOV: "azureusgovernment",
    US_GOV_JEDI_PROD: "usgovernmentjediprod",
    US_GOV_MIGRATED: "azureusgovernmentmigrated"
};
exports.B2cProviders = {
    NONE: "none",
    AMAZON: "amazon",
    FACEBOOK: "facebook",
    GOOGLE: "google",
    LOCAL: "local",
    MICROSOFT: "microsoft",
    TWITTER: "twitter"
};
exports.FederationProviders = {
    NONE: "none",
    ADFSV2: "adfsv2",
    ADFSV3: "adfsv3",
    ADFSV4: "adfsv4",
    ADFS2019: "adfsv2019",
    B2C: "b2c",
    PING: "ping",
    SHIBBOLETH: "shibboleth"
};
exports.HomeDomains = {
    NONE: "none",
    LAB2: "msidlab2.com",
    LAB3: "msidlab3.com",
    LAB4: "msidlab4.com",
    LAB8: "msidlab8.com"
};
exports.UserTypes = {
    CLOUD: "cloud",
    FEDERATED: "federated",
    ONPREM: "onprem",
    GUEST: "guest",
    MSA: "msa",
    B2C: "b2c"
};
exports.AppTypes = {
    CLOUD: "cloud",
    ONPREM: "onprem"
};
//# sourceMappingURL=Constants.js.map