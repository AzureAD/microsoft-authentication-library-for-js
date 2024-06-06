import { Configuration } from "@azure/msal-node";

export const authConfig: Configuration = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "Enter_the_Cloud_Instance_Id_Here/Enter_the_Tenant_Info_Here",
    },
};