/**
 * Query parameters for the lab API
 * See: https://msidlab.com/swagger/v1/swagger.json
 */
export type LabApiQueryParams = {
    userType?: string,
    azureEnvironment?: string,
    federationProvider?: string,
    b2cProvider?: string,
    homeDomain?: string,
    appType?: string,
    signInAudience?: string,
    publicClient?: string,
    appPlatform?: string,
};
