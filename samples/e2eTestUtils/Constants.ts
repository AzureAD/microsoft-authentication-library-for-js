export const ENV_VARIABLES = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    SECRET: "AZURE_CLIENT_SECRET"
};

export const LAB_API_ENDPOINT = "https://msidlab.com/api";
export const LAB_SCOPE = "https://msidlab.com/.default";

export const ParamKeys = {
    AZURE_ENVIRONMENT: "azureenvironment",
    USER_TYPE: "usertype",
    FEDERATION_PROVIDER: "federationprovider",
    B2C_PROVIDER: "b2cprovider",
    HOME_DOMAIN: "homedomain",
    APP_TYPE: "apptype"
};

// Lab API Query Param Values
export const AzureEnvironments = {
    B2C_CLOUD: "azureb2ccloud", 
    CHINA_CLOUD: "azurechinacloud", 
    CLOUD: "azurecloud", 
    GERMANY_CLOUD: "azuregermanycloud", 
    PPE: "azureppe", 
    US_GOV: "azureusgovernment", 
    US_GOV_JEDI_PROD: "usgovernmentjediprod", 
    US_GOV_MIGRATED: "azureusgovernmentmigrated"
};

export const B2cProviders = {
    NONE: "none", 
    AMAZON: "amazon", 
    FACEBOOK: "facebook", 
    GOOGLE: "google", 
    LOCAL: "local", 
    MICROSOFT: "microsoft", 
    TWITTER: "twitter"
};

export const FederationProviders = {
    NONE: "none", 
    ADFSV2: "adfsv2", 
    ADFSV3: "adfsv3", 
    ADFSV4: "adfsv4", 
    ADFS2019: "adfsv2019", 
    B2C: "b2c", 
    PING: "ping", 
    SHIBBOLETH: "shibboleth"
};

export const HomeDomains = {
    NONE: "none", 
    LAB2: "msidlab2.com", 
    LAB3: "msidlab3.com", 
    LAB4: "msidlab4.com",
    LAB8: "msidlab8.com"
};

export const UserTypes = {
    CLOUD: "cloud", 
    FEDERATED: "federated", 
    ONPREM: "onprem", 
    GUEST: "guest", 
    MSA: "msa", 
    B2C: "b2c"
};

export const AppTypes = {
    CLOUD: "cloud",
    ONPREM: "onprem"
};

