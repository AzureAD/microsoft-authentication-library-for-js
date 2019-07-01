import TelemetryEvent from "./TelemetryEvent";
import { EVENT_NAME_PREFIX, TELEMETRY_BLOB_EVENT_NAMES } from "./TelemetryConstants";
import { scrubTenantFromUri, hashPersonalIdentifier } from "./TelemetryUtils";
import { Logger } from "../Logger";

// export these to test... could namespace them, or find another way?
export const AUTHORITY_KEY = EVENT_NAME_PREFIX + "authority";
export const AUTHORITY_TYPE_KEY = EVENT_NAME_PREFIX + "authority_type";
export const PROMPT_KEY = EVENT_NAME_PREFIX + "ui_behavior";
export const TENANT_ID_KEY = EVENT_NAME_PREFIX + "tenant_id";
export const USER_ID_KEY = EVENT_NAME_PREFIX + "user_id";
export const WAS_SUCESSFUL_KEY = EVENT_NAME_PREFIX + "was_successful";
export const API_ERROR_CODE_KEY = EVENT_NAME_PREFIX + "api_error_code";
export const LOGIN_HINT_KEY = EVENT_NAME_PREFIX + "login_hint";

export const API_CODE = {
    AcquireTokenRedirect: 2001,
    AcquireTokenSilent: 2002,
    AcquireTokenPopup: 2003,
    LoginRedirect: 2004,
    LoginPopup: 2005
};

export const API_EVENT_IDENTIFIER = {
    AcquireTokenRedirect: "AcquireTokenRedirect",
    AcquireTokenSilent: "AcquireTokenSilent",
    AcquireTokenPopup: "AcquireTokenPopup",
    LoginRedirect: "LoginRedirect",
    LoginPopup: "LoginPopup"
};


export default class ApiEvent extends TelemetryEvent {

    private logger: Logger;

    constructor(correlationId: string, logger: Logger) {
        super(`${EVENT_NAME_PREFIX}api_event`, correlationId);
        this.logger = logger;
    }

    public set apiEventIdentifier(apiEventIdentifier: string) {
        this.event[TELEMETRY_BLOB_EVENT_NAMES.ApiTelemIdConstStrKey] = apiEventIdentifier;
    }

    public set apiCode(apiCode: number) {
        this.event[TELEMETRY_BLOB_EVENT_NAMES.ApiIdConstStrKey] = apiCode;
    }

    public set authority(uri: string) {
        this.event[AUTHORITY_KEY] = scrubTenantFromUri(uri).toLowerCase();
    }

    public set apiErrorCode(errorCode: string) {
        this.event[API_ERROR_CODE_KEY] = errorCode;
    }

    public set tenantId(tenantId: string) {
        this.event[TENANT_ID_KEY] = this.logger.piiLoggingIsEnabled() && tenantId ?
            hashPersonalIdentifier(tenantId)
            : null;
    }

    public set accountId(accountId: string) {
        this.event[USER_ID_KEY] = this.logger.piiLoggingIsEnabled() && accountId ?
            hashPersonalIdentifier(accountId)
            : null;
    }

    public set wasSuccessful(wasSuccessful: boolean) {
        this.event[WAS_SUCESSFUL_KEY] = wasSuccessful;
    }

    public get wasSuccessful() {
        return this.event[WAS_SUCESSFUL_KEY] === true;
    }

    public set loginHint(loginHint: string) {
        this.event[LOGIN_HINT_KEY] = this.logger.piiLoggingIsEnabled() && loginHint ?
            hashPersonalIdentifier(loginHint)
            : null;
    }

    public set authorityType(authorityType: string) {
        this.event[AUTHORITY_TYPE_KEY] = authorityType.toLowerCase();
    }

    public set promptType(promptType: string) {
        this.event[PROMPT_KEY] = promptType.toLowerCase();
    }

}
