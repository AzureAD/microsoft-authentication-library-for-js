import UiEvent, { EVENT_KEYS } from "../../src/telemetry/UiEvent";
import { expect } from "chai";

describe("UiEvent", () => {
    it("constructs and carries exepcted values", () => {
        const event = new UiEvent("event-id", "correlation-id").get();
        expect(event["msal.event_name"]).to.eq("msal.ui_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets values", () =>{
        const uiEvent = new UiEvent("event-id", "correlation-id");

        const fakeUserCancelled = true;
        const fakeAccessDenied = true;

        uiEvent.accessDenied = fakeAccessDenied;
        uiEvent.userCancelled = true;

        expect(uiEvent.telemetryCorrelationId).to.eq("correlation-id");
        const event = uiEvent.get();

        expect(event[EVENT_KEYS.ACCESS_DENIED]).to.eq(fakeAccessDenied);
        expect(event[EVENT_KEYS.USER_CANCELLED]).to.eq(fakeUserCancelled);
    });
});
