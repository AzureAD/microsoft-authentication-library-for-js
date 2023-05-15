import UiEvent, { EVENT_KEYS } from "../../src/telemetry/UiEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';

describe("UiEvent", () => {
    it("constructs and carries exepcted values", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const event = new UiEvent(correlationId).get();
        expect(event["msal.event_name"]).toBe("msal.ui_event");
        expect(event["msal.elapsed_time"]).toBe(-1);
    });

    it("sets values", () =>{
        const correlationId = CryptoUtils.createNewGuid();
        const uiEvent = new UiEvent(correlationId);

        const fakeUserCancelled = true;
        const fakeAccessDenied = true;

        uiEvent.accessDenied = fakeAccessDenied;
        uiEvent.userCancelled = true;

        expect(uiEvent.telemetryCorrelationId).toBe(correlationId);
        const event = uiEvent.get();

        expect(event[EVENT_KEYS.ACCESS_DENIED]).toBe(fakeAccessDenied);
        expect(event[EVENT_KEYS.USER_CANCELLED]).toBe(fakeUserCancelled);
    });
});
