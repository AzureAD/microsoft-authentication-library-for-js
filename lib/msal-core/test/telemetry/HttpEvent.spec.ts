import { expect } from "chai";
import HttpEvent, { EVENT_KEYS } from "../../src/telemetry/HttpEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';
import sinon from "sinon";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

describe("HttpEvent", () => {
    before(function() {
        // Ensure TrustedHostList is set
        sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
    });

    after(function() {
        sinon.restore();
    });

    it("constructs and carries exepcted values", () => {
        const correlationId = CryptoUtils.createNewGuid();

        const event = new HttpEvent(correlationId).get();

        expect(event["msal.event_name"]).to.eq("msal.http_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets simply set values", () => {
        const correlationId = CryptoUtils.createNewGuid();

        const httpEvent = new HttpEvent(correlationId);

        const fakeUserAgent = "chrome-mobile";
        const fakeApiVersion = "1.3.5";
        const fakeHttpResponseStatus = 200;
        const fakeOAuthErrorCode = "ERROR";
        const fakeHttpMethod = "GET";
        const fakeRequestIdHeader = "notSureWhatThisIs";
        const fakeSpeInfo = "I";
        const fakeServerErrorCode = "AAD4234234";
        const fakeSubErrorCode = "SomeSubError";

        httpEvent.userAgent = fakeUserAgent;
        httpEvent.apiVersion = fakeApiVersion;
        httpEvent.httpResponseStatus = fakeHttpResponseStatus;
        httpEvent.oAuthErrorCode = fakeOAuthErrorCode;
        httpEvent.httpMethod = fakeHttpMethod;
        httpEvent.requestIdHeader = fakeRequestIdHeader;
        httpEvent.speInfo = fakeSpeInfo;
        httpEvent.serverErrorCode = fakeServerErrorCode;
        httpEvent.serverSubErrorCode = fakeSubErrorCode;

        const event = httpEvent.get();

        expect(event[EVENT_KEYS.USER_AGENT]).to.eq(fakeUserAgent);
        expect(event[EVENT_KEYS.API_VERSION]).to.eq(fakeApiVersion);
        expect(event[EVENT_KEYS.RESPONSE_CODE]).to.eq(fakeHttpResponseStatus);
        expect(event[EVENT_KEYS.O_AUTH_ERROR_CODE]).to.eq(fakeOAuthErrorCode);
        expect(event[EVENT_KEYS.HTTP_METHOD]).to.eq(fakeHttpMethod);
        expect(event[EVENT_KEYS.REQUEST_ID_HEADER]).to.eq(fakeRequestIdHeader);
        expect(event[EVENT_KEYS.SPE_INFO]).to.eq(fakeSpeInfo);
        expect(event[EVENT_KEYS.SERVER_ERROR_CODE]).to.eq(fakeServerErrorCode);
        expect(event[EVENT_KEYS.SERVER_SUB_ERROR_CODE]).to.eq(fakeSubErrorCode);
    });

    it("sets values that are changed", () => {
        const correlationId = CryptoUtils.createNewGuid();

        const httpEvent = new HttpEvent(correlationId);

        const fakePath = "https://login.microsoftonline.com/Abc-123/I-am-a-tenant/orange";
        const expectedFakePath = "https://login.microsoftonline.com/abc-123/<tenant>/orange";
        const fakeQueryParams =  {
            someParam1: "pizza",
            someParam2: "burger"
        };
        const expectedFakeQueryParams = "someParam1=pizza&someParam2=burger";

        httpEvent.httpPath = fakePath;
        httpEvent.queryParams = fakeQueryParams;

        const event = httpEvent.get();

        expect(event[EVENT_KEYS.HTTP_PATH]).to.eq(expectedFakePath);
        expect(event[EVENT_KEYS.QUERY_PARAMETERS]).to.eq(expectedFakeQueryParams);

    });
});
