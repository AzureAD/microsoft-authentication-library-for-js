// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
        authority: "https://login.microsoftonline.com/common"
        // clientId: "3fba556e-5d4a-48e3-8e1a-fd57c12cb82e",
        // authority: "https://login.windows-ppe.net/common/"
        // clientId: "bc77b0a7-16aa-4af4-884b-41b968c9c71a",
        // authority: "https://login.microsoftonline.com/5d97b14d-c396-4aee-b524-c86d33e9b660"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {	
                    return;	
                }	
                switch (level) {	
                    case msal.LogLevel.Error:	
                        console.error(message);	
                        return;	
                    case msal.LogLevel.Info:	
                    console.info(message);	
                        return;	
                    case msal.LogLevel.Verbose:	
                        console.debug(message);	
                        return;	
                    case msal.LogLevel.Warning:	
                        console.warn(message);	
                        return;
                    case msal.LogLevel.Trace:
                        console.trace(message);
                        return;	
                }
            },
            logLevel: msal.LogLevel.Verbose
        }
    }
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft-ppe.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft-ppe.com/v1.0/me/messages"
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["openid", "profile"]
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read", "Mail.Read"],
};

const pubKey = {"p":"zN8SHQ_QsbEMNwrA3ZpKn2ulmKGZfAfrOnouojvUIzuH13y-sWUfiDADgei4MG3j5fJHFPuMdKE5zdYKgsC3eyImeAzNd10ZDRUaMXubg1fyyvlf7hE4cvrwaQ0MftXsvlCLi1nkK_DjnPjAonqvbRMOS6YyUXAZBZyfLaZ76cU","kty":"RSA","q":"yrsb5PwGF5Lvtx1CCSX6j0fhNDjwK7LkKvfE1qhrGgv3Cu9HBUb90qoj0qewA1prPQBN3cjrKv19zIrIV2ac3-p_j6jKotd7o2-t0jXpSW7wlGFpArIf2nxDyJo1KeimDi697hbESb_gPYGeno0TJTdmIyYWB8_JHm06cGkU3P0","d":"U4A5WR4L4cqActlO0PALdBF9_Myc4Zzk401Uo3bufsI3AGw9EFkARIq7U2T4PAnPbhUr-mT3zIYsLD6Ck1-PNE9gJbeQXgBRHJWCZe6s90FoeQZl1k2ADjjwOWjf5MyTxTSmdH7ENIABLzsukz3EQnsEZIGM4bnpaC-5wfZ5THI8FFEIMh-sEro1BbI_roohwKoDiOmzpthrxbqoFXq7YfEOjZ9i_H8mvCunMuQQ0CZLZfGTKoKN5ZcQkQSdy4wAVzln5eXtm-lxWFXrB-EL8qgDUrsx9HAxKxjACKNoTdgttGy3G434OJqh7QB5iGtHaXVb5wEvUeJXXa_N44Sd4Q","e":"AQAB","use":"enc","kid":"40890f08-6b55-450f-9443-a6d5cef8b6d0","qi":"OQ2Ku_syiEvUEvixOyyBSuq5UuoQLwaecExggwUaJZF-zpRv76fsxxaKYZiTZU-80cLMIOfsYbxMU1_p_VI4gKOr8vnY10VSCBSge8UX6InuLzVGdx8UoMb-q0rhmStw2hhfFzLzrZSYvooxMX_PQQTkmyhyVck9Pp-5hVPg3hI","dp":"XMccndqeqQnDvV16UCDicGXAfWmZZ2jypu3UFpY_kKER-I0-knl4GSWdQQSR_SSW03ivphnw1pR45_VplyMNNI8XmsA5gDfB84G99fDDUWzPwAnE3rwfszpfC0Pkh7_7UYiKWVYhFaEmgtzH6AzlSuEZVTrziJvaSQdPss21Sf0","dq":"MqBTMPW218A72LCXww0W6xz6Ij5ty5va2tgQ8cIRLOn8AWELjUfTLv6J_5scm1nDGfKvf0kjYRL4jVHDAgCAAHLg9BEkuVGycHf9IleQMGRh88v3m1K8HaWWj8viptqQTU5i48gPsJMX_oQWBmYYd9zDxtdF_SFoig6g311-dkk","n":"oj3Bj_D64iFCgtRAInqXbiIrTxbMBw6D6QFCam84CjS3U3cvOjqBhaWPciqPZFYAk3T4_7_HDu-v_iNb5R5Nae0PQ3hXt99y3n0ZwVE_LQ4hQuMLWCQ8YaQnLjrBCJR1YWD6d92UGXj6Jm_a80wmrcxZ6z_W-thUacdGN6Y5P5bLTq-dAYf92ZQxTx9-nIV8BA0jnFt0F_tMuBU-sec8Z2vSq8KQjllWgXarB6aKq7g4RsJAgGqC-kVwskE2WrXKiTVgnA-mvBhRwJE2TMYdi0dMT2eCZCA6Hym2rj_7PRT5QCTflYWPh7Ya3blc4ET9xC8akghPMZjVfEfwFb9TsQ"};

// Configure SSH Certificate Request
const sshCertRequest = {
    scopes: ["https://pas.windows.net/CheckMyAccess/Linux/.default"],
    authenticationScheme: msal.AuthenticationScheme.SSH,
    sshJwk: JSON.stringify(pubKey),
    sshKid: "some_key_id"
}
