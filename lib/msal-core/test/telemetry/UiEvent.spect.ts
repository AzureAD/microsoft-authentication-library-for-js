import UiEvent, {
    USER_CANCELLED_KEY,
    ACCESS_DENIED_KEY
} from "../../src/telemetry/UiEvent";
import { v4 as uuid } from "uuid";
import { expect } from "chai";

describe("UiEvent", () => {
    it("constructs and carries exepcted values", () => {
        const correlationId = uuid();
        const event = new UiEvent(correlationId).get();
        expect(event["msal.event_name"]).to.eq("msal.ui_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets values", () =>{
        const correlationId = uuid();
        const uiEvent = new UiEvent(correlationId);

        const fakeUserCancelled = true;
        const fakeAccessDenied = true;

        uiEvent.accessDenied = fakeAccessDenied;
        uiEvent.userCancelled = true;

        expect(uiEvent.telemetryCorrelationId).to.eq(correlationId);
        const event = uiEvent.get();

        expect(event[ACCESS_DENIED_KEY]).to.eq(fakeAccessDenied);
        expect(event[USER_CANCELLED_KEY]).to.eq(fakeUserCancelled);
    });
});
