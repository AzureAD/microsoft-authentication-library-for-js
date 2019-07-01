import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";
import { QPDict } from "../AuthenticationParameters";
import { Utils } from "../Utils";
import { scrubTenantFromUri } from "./TelemetryUtils";

export const HTTP_PATH_KEY = `${EVENT_NAME_PREFIX}http_path`;
export const USER_AGENT_KEY = `${EVENT_NAME_PREFIX}user_agent`;
export const QUERY_PARAMETERS_KEY = `${EVENT_NAME_PREFIX}query_parameters`;
export const API_VERSION_KEY = `${EVENT_NAME_PREFIX}api_version`;
export const RESPONSE_CODE_KEY = `${EVENT_NAME_PREFIX}response_code`;
export const O_AUTH_ERROR_CODE_KEY = `${EVENT_NAME_PREFIX}oauth_error_code`;
export const HTTP_METHOD_KEY = `${EVENT_NAME_PREFIX}http_method`;
export const REQUEST_ID_HEADER_KEY = `${EVENT_NAME_PREFIX}request_id_header`;
export const SPE_INFO_KEY = `${EVENT_NAME_PREFIX}spe_info`;
export const SERVER_ERROR_CODE_KEY = `${EVENT_NAME_PREFIX}server_error_code`;
export const SERVER_SUB_ERROR_CODE_KEY = `${EVENT_NAME_PREFIX}server_sub_error_code`;

export default class HttpEvent extends TelemetryEvent {

    constructor(correlationId: string) {
        super(`${EVENT_NAME_PREFIX}http_event`, correlationId);
    }


    // Believe this should be whole url, not just a path
    public set httpPath(httpPath: string) {
        this.event[HTTP_PATH_KEY] = scrubTenantFromUri(httpPath).toLowerCase();
    }

    public set userAgent(userAgent: string) {
        this.event[USER_AGENT_KEY] = userAgent;
    }

    public set queryParams(queryParams: QPDict) {
        this.event[QUERY_PARAMETERS_KEY] = Utils.generateQueryParametersString(queryParams);
    }

    public set apiVersion(apiVersion: string) {
        this.event[API_VERSION_KEY] = apiVersion.toLowerCase();
    }

    public set httpResponseStatus(statusCode: number) {
        this.event[RESPONSE_CODE_KEY] = statusCode;
    }

    public set oAuthErrorCode(errorCode: string) {
        this.event[O_AUTH_ERROR_CODE_KEY] = errorCode;
    }

    public set httpMethod(httpMethod: string) {
        this.event[HTTP_METHOD_KEY] = httpMethod;
    }

    public set requestIdHeader(requestIdHeader: string) {
        this.event[REQUEST_ID_HEADER_KEY] = requestIdHeader;
    }

    ///  Indicates whether the request was executed on a ring serving SPE traffic.
    ///  An empty string indicates this occurred on an outer ring, and the string "I"
    ///  indicates the request occurred on the inner ring
    public set speInfo(speInfo: string) {
        this.event[SPE_INFO_KEY] = speInfo;
    }

    public set serverErrorCode(errorCode: string) {
        this.event[SERVER_ERROR_CODE_KEY] = errorCode;
    }

    public set serverSubErrorCode(subErrorCode: string) {
        this.event[SERVER_SUB_ERROR_CODE_KEY] = subErrorCode;
    }
}
