import ApiEvent, {
    API_EVENT_IDENTIFIER,
    API_CODE,
    EVENT_KEYS
} from "../../src/telemetry/ApiEvent";
import { Logger, LoggerOptions } from "../../src";
import { expect } from "chai";
import { TELEMETRY_BLOB_EVENT_NAMES } from "../../src/telemetry/TelemetryConstants";

const loggerOptions: LoggerOptions = {
    loggerCallback: () => {}
};

describe("ApiEvent", () => {
    it("constructs and carries exepcted values", () => {
        const logger = new Logger(loggerOptions);

        const event = new ApiEvent("event-id", "correlation-id", logger.isPiiLoggingEnabled()).get();

        expect(event["msal.event_name"]).to.eq("msal.api_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets simple values on event", () => {
        const logger = new Logger(loggerOptions);

        const apiEvent = new ApiEvent("event-id", "correlation-id", logger.isPiiLoggingEnabled());

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
});
