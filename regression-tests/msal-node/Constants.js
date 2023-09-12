/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const NetworkUtils = class NetworkUtils {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    static getNetworkResponse(headers, body, statusCode) {
        return {
            headers: headers,
            body: body,
            status: statusCode,
        };
    }
};

const DEFAULT_OPENID_CONFIG_RESPONSE = {
    headers: {},
    status: 200,
    body: {
        token_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        token_endpoint_auth_methods_supported: [
            "client_secret_post",
            "private_key_jwt",
            "client_secret_basic",
        ],
        jwks_uri:
            "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
        response_modes_supported: ["query", "fragment", "form_post"],
        subject_types_supported: ["pairwise"],
        id_token_signing_alg_values_supported: ["RS256"],
        response_types_supported: [
            "code",
            "id_token",
            "code id_token",
            "id_token token",
        ],
        scopes_supported: ["openid", "profile", "email", "offline_access"],
        issuer: "https://login.microsoftonline.com/{tenant}/v2.0",
        request_uri_parameter_supported: false,
        userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
        authorization_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        http_logout_supported: true,
        frontchannel_logout_supported: true,
        end_session_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout",
        claims_supported: [
            "sub",
            "iss",
            "cloud_instance_name",
            "cloud_instance_host_name",
            "cloud_graph_host_name",
            "msgraph_host",
            "aud",
            "exp",
            "iat",
            "auth_time",
            "acr",
            "nonce",
            "preferred_username",
            "name",
            "tid",
            "ver",
            "at_hash",
            "c_hash",
            "email",
        ],
        tenant_region_scope: null,
        cloud_instance_name: "microsoftonline.com",
        cloud_graph_host_name: "graph.windows.net",
        msgraph_host: "graph.microsoft.com",
        rbac_url: "https://pas.windows.net",
    },
};

const CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT = {
    headers: {},
    status: 200,
    body: {
        token_type: "Bearer",
        expires_in: 3599,
        ext_expires_in: 3599,
        refresh_in: 3598 / 2,
        access_token: "thisIs.an.accessT0ken",
    },
};

module.exports = {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    NetworkUtils,
};
