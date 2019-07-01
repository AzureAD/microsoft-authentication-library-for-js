import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX } from "./TelemetryConstants";
import { QPDict } from "../AuthenticationParameters";
import { Utils } from "../Utils";

const HTTP_PATH = `${EVENT_NAME_PREFIX}http_path`;
const USER_AGENT = `${EVENT_NAME_PREFIX}user_agent`;
const QUERY_PARAMETERS = `${EVENT_NAME_PREFIX}query_parameters`;
const API_VERSION = `${EVENT_NAME_PREFIX}api_version`;
const RESPONSE_CODE = `${EVENT_NAME_PREFIX}response_code`;
const O_AUTH_ERROR_CODE = `${EVENT_NAME_PREFIX}oauth_error_code`;
const HTTP_METHOD = `${EVENT_NAME_PREFIX}http_method`;
const REQUEST_ID_HEADER = `${EVENT_NAME_PREFIX}request_id_header`;
const SPE_INFO = `${EVENT_NAME_PREFIX}spe_info`;
const SERVER_ERROR_CODE = `${EVENT_NAME_PREFIX}server_error_code`;
const SERVER_SUB_ERROR_CODE = `${EVENT_NAME_PREFIX}server_sub_error_code`;

export default class HttpEvent extends TelemetryEvent {

    constructor(correlationId: string) {
        super(`${EVENT_NAME_PREFIX}http_event`, correlationId);
    }

    public set userAgent(userAgent: string) {
        this.event[USER_AGENT] = userAgent;
    }

    public set queryParams(queryParams: QPDict) {
        this.event[QUERY_PARAMETERS] = Utils.generateQueryParametersString(queryParams);
    }

    public set apiVersion(apiVersion: string) {
        this.event[API_VERSION] = apiVersion.toLowerCase();
    }

    public set httpResponseStatus(statusCode: number) {
        this.event[RESPONSE_CODE] = statusCode;
    }

    public set httpMethod(httpMethod: string) {
        this.event[HTTP_METHOD] = httpMethod;
    }

    public set requestIdHeader(requestIdHeader: string) {
        this.event[REQUEST_ID_HEADER] = requestIdHeader;
    }

    ///  Indicates whether the request was executed on a ring serving SPE traffic.
    ///  An empty string indicates this occurred on an outer ring, and the string "I"
    ///  indicates the request occurred on the inner ring
    public set speInfo(speInfo: string) {
        this.event[SPE_INFO] = speInfo;
    }

    public set serverErrorCode(errorCode: string) {
        this.event[SERVER_ERROR_CODE] = errorCode;
    }

    public set serverSubErrorCode(subErrorCode: string) {
        this.event[SERVER_SUB_ERROR_CODE] = subErrorCode;
    }
}
