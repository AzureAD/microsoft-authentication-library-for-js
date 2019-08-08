import TelemetryEvent from "./TelemetryEvent";
import { scrubTenantFromUri, prependEventNamePrefix } from "./TelemetryUtils";
import { ServerRequestParameters } from "../ServerRequestParameters";

export const EVENT_KEYS = {
    HTTP_PATH: prependEventNamePrefix("http_path"),
    USER_AGENT: prependEventNamePrefix("user_agent"),
    QUERY_PARAMETERS: prependEventNamePrefix("query_parameters"),
    API_VERSION: prependEventNamePrefix("api_version"),
    RESPONSE_CODE: prependEventNamePrefix("response_code"),
    O_AUTH_ERROR_CODE: prependEventNamePrefix("oauth_error_code"),
    HTTP_METHOD: prependEventNamePrefix("http_method"),
    REQUEST_ID_HEADER: prependEventNamePrefix("request_id_header"),
    SPE_INFO: prependEventNamePrefix("spe_info"),
    SERVER_ERROR_CODE: prependEventNamePrefix("server_error_code"),
    SERVER_SUB_ERROR_CODE: prependEventNamePrefix("server_sub_error_code")
};

export default class HttpEvent extends TelemetryEvent {

    constructor(correlationId: string) {
        super(prependEventNamePrefix("http_event"), correlationId);
    }


    // Believe this should be whole url, not just a path
    public set httpPath(httpPath: string) {
        this.event[EVENT_KEYS.HTTP_PATH] = scrubTenantFromUri(httpPath).toLowerCase();
    }

    public set userAgent(userAgent: string) {
        this.event[EVENT_KEYS.USER_AGENT] = userAgent;
    }

    public set queryParams(queryParams: any) {
        this.event[EVENT_KEYS.QUERY_PARAMETERS] = ServerRequestParameters.generateQueryParametersString(queryParams);
    }

    public set apiVersion(apiVersion: string) {
        this.event[EVENT_KEYS.API_VERSION] = apiVersion.toLowerCase();
    }

    public set httpResponseStatus(statusCode: number) {
        this.event[EVENT_KEYS.RESPONSE_CODE] = statusCode;
    }

    public set oAuthErrorCode(errorCode: string) {
        this.event[EVENT_KEYS.O_AUTH_ERROR_CODE] = errorCode;
    }

    public set httpMethod(httpMethod: string) {
        this.event[EVENT_KEYS.HTTP_METHOD] = httpMethod;
    }

    public set requestIdHeader(requestIdHeader: string) {
        this.event[EVENT_KEYS.REQUEST_ID_HEADER] = requestIdHeader;
    }

    ///  Indicates whether the request was executed on a ring serving SPE traffic.
    ///  An empty string indicates this occurred on an outer ring, and the string "I"
    ///  indicates the request occurred on the inner ring
    public set speInfo(speInfo: string) {
        this.event[EVENT_KEYS.SPE_INFO] = speInfo;
    }

    public set serverErrorCode(errorCode: string) {
        this.event[EVENT_KEYS.SERVER_ERROR_CODE] = errorCode;
    }

    public set serverSubErrorCode(subErrorCode: string) {
        this.event[EVENT_KEYS.SERVER_SUB_ERROR_CODE] = subErrorCode;
    }
}
