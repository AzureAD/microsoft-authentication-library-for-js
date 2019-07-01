import { v4 as uuid } from "uuid";
import { expect } from "chai";
import HttpEvent, {
    HTTP_METHOD_KEY,
    HTTP_PATH_KEY,
    USER_AGENT_KEY,
    QUERY_PARAMETERS_KEY,
    API_VERSION_KEY,
    O_AUTH_ERROR_CODE_KEY,
    REQUEST_ID_HEADER_KEY,
    SPE_INFO_KEY,
    SERVER_ERROR_CODE_KEY,
    SERVER_SUB_ERROR_CODE_KEY,
    RESPONSE_CODE_KEY
} from "../../src/telemetry/HttpEvent";

describe("HttpEvent", () => {
    it("constructs and carries exepcted values", () => {
        const correlationId = uuid();

        const event = new HttpEvent(correlationId).get();

        expect(event["msal.event_name"]).to.eq("msal.http_event");
        expect(event["msal.elapsed_time"]).to.eq(-1);
    });

    it("sets simply set values", () => {
        const correlationId = uuid();

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

        expect(event[USER_AGENT_KEY]).to.eq(fakeUserAgent);
        expect(event[API_VERSION_KEY]).to.eq(fakeApiVersion);
        expect(event[RESPONSE_CODE_KEY]).to.eq(fakeHttpResponseStatus);
        expect(event[O_AUTH_ERROR_CODE_KEY]).to.eq(fakeOAuthErrorCode);
        expect(event[HTTP_METHOD_KEY]).to.eq(fakeHttpMethod);
        expect(event[REQUEST_ID_HEADER_KEY]).to.eq(fakeRequestIdHeader);
        expect(event[SPE_INFO_KEY]).to.eq(fakeSpeInfo);
        expect(event[SERVER_ERROR_CODE_KEY]).to.eq(fakeServerErrorCode);
        expect(event[SERVER_SUB_ERROR_CODE_KEY]).to.eq(fakeSubErrorCode);
    });

    it("sets values that are changed", () => {
        const correlationId = uuid();

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

        expect(event[HTTP_PATH_KEY]).to.eq(expectedFakePath);
        expect(event[QUERY_PARAMETERS_KEY]).to.eq(expectedFakeQueryParams);

    });
});