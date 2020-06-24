import ApiEvent, {
    API_EVENT_IDENTIFIER,
    API_CODE,
    EVENT_KEYS
} from "../../src/telemetry/ApiEvent";
import { Logger } from "../../src";
import { expect } from "chai";
import { TELEMETRY_BLOB_EVENT_NAMES } from "../../src/telemetry/TelemetryConstants";
import { hashPersonalIdentifier } from "../../src/telemetry/TelemetryUtils";
import { CryptoUtils } from '../../src/utils/CryptoUtils';
import sinon from "sinon";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

describe("ApiEvent", () => {
    before(function() {
        // Ensure TrustedHostList is set
        sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
    });

    after(function() {
        sinon.restore();
    });
    
    it("constructs and carries exepcted values", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const logger = new Logger(() => { });

        const event = new ApiEvent(correlationId, logger.isPiiLoggingEnabled()).get();

        expect(event["msal.event_name"]).to.eq("msal.api_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets simple values on event", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const logger = new Logger(() => { });

        const apiEvent = new ApiEvent(correlationId, logger.isPiiLoggingEnabled());

        const fakeErrorCode = "PIZZA";
        const fakeWasSuccessful = true;
        const fakeAuthorityType = "B2C";
        const fakePromptType = "SELECT_ACCOUNT";

        apiEvent.apiEventIdentifier = API_EVENT_IDENTIFIER.AcquireTokenPopup;
        apiEvent.apiCode = API_CODE.AcquireTokenPopup;
        apiEvent.apiErrorCode = fakeErrorCode;
        apiEvent.wasSuccessful = fakeWasSuccessful;
        apiEvent.authorityType = fakeAuthorityType;
        apiEvent.promptType = fakePromptType;

        const event = apiEvent.get();

        expect(event[TELEMETRY_BLOB_EVENT_NAMES.ApiTelemIdConstStrKey]).to.eq(API_EVENT_IDENTIFIER.AcquireTokenPopup);
        expect(event[TELEMETRY_BLOB_EVENT_NAMES.ApiIdConstStrKey]).to.eq(API_CODE.AcquireTokenPopup);
        expect(event[EVENT_KEYS.API_ERROR_CODE]).to.eq(fakeErrorCode);
        expect(event[EVENT_KEYS.WAS_SUCESSFUL]).to.eq(fakeWasSuccessful);
        expect(event[EVENT_KEYS.AUTHORITY_TYPE]).to.eq(fakeAuthorityType.toLowerCase());
        expect(event[EVENT_KEYS.PROMPT]).to.eq(fakePromptType.toLowerCase());
    });

    it("sets values on event that are scrubbed or altered", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const logger = new Logger(() => { });

        const apiEvent = new ApiEvent(correlationId, logger.isPiiLoggingEnabled());

        const fakeAuthority = "https://login.microsoftonline.com/Abc-123/I-am-a-tenant/orange";
        const expectedFakeAuthority = "https://login.microsoftonline.com/abc-123/<tenant>/orange";

        apiEvent.authority = fakeAuthority;

        const event = apiEvent.get();

        expect(event[EVENT_KEYS.AUTHORITY]).to.eq(expectedFakeAuthority);
    });

    it("doesn't set private alues on event if pii is not enabled", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const logger = new Logger(() => { }, {
            piiLoggingEnabled: false //defaults to false
        });

        const apiEvent = new ApiEvent(correlationId, logger.isPiiLoggingEnabled());

        const fakeTenantId = CryptoUtils.createNewGuid();
        const fakeAccountId = CryptoUtils.createNewGuid();
        const fakeLoginHint = "fakeHint";

        apiEvent.tenantId = fakeTenantId;
        apiEvent.accountId = fakeAccountId;
        apiEvent.loginHint = fakeLoginHint;

        const event = apiEvent.get();

        expect(event[EVENT_KEYS.TENANT_ID]).to.eq(null);
        expect(event[EVENT_KEYS.USER_ID]).to.eq(null);
        expect(event[EVENT_KEYS.LOGIN_HINT]).to.eq(null);
    });

    it("sets and hashes private values on event if pii is enabled", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const logger = new Logger(() => { }, {
            piiLoggingEnabled: true
        });

        const apiEvent = new ApiEvent(correlationId, logger.isPiiLoggingEnabled());

        const fakeTenantId = CryptoUtils.createNewGuid();
        const fakeExpectedTenantId = hashPersonalIdentifier(fakeTenantId);
        const fakeAccountId = CryptoUtils.createNewGuid();
        const fakeExpectedAccountId = hashPersonalIdentifier(fakeAccountId);
        const fakeLoginHint = "fakeHint";
        const fakeExpectedHint = hashPersonalIdentifier(fakeLoginHint);

        apiEvent.tenantId = fakeTenantId;
        apiEvent.accountId = fakeAccountId;
        apiEvent.loginHint = fakeLoginHint;

        const event = apiEvent.get();

        expect(event[EVENT_KEYS.TENANT_ID]).to.eq(fakeExpectedTenantId);
        expect(event[EVENT_KEYS.USER_ID]).to.eq(fakeExpectedAccountId);
        expect(event[EVENT_KEYS.LOGIN_HINT]).to.eq(fakeExpectedHint);
    });

});
