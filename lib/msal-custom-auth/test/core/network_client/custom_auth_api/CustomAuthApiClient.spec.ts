import { Logger, ServerTelemetryManager } from "@azure/msal-browser";
import { IHttpClient } from "../../../../src/core/network_client/http_client/IHttpClient.js";
import { CustomAuthApiClient } from "../../../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js";
import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "../../../../src/core/network_client/custom_auth_api/request/SignInRequest.js";
import {
    HttpResponseMessage,
    HttpStatusCode,
} from "../../../../src/core/network_client/http_client/HttpMessage.js";
import { CustomAuthApiEndpoint } from "../../../../src/core/network_client/custom_auth_api/CustomAuthApiEndpoint.js";
import { CustomAuthApiError } from "../../../../src/core/error/CustomAuthApiError.js";

describe("CustomAuthApiClient", () => {
    let httpClient: jest.Mocked<IHttpClient>;
    let logger: jest.Mocked<Logger>;
    let client: CustomAuthApiClient;
    let telemetryManager: jest.Mocked<ServerTelemetryManager>;

    beforeEach(() => {
        httpClient = {
            sendAsync: jest.fn(),
        } as unknown as jest.Mocked<IHttpClient>;

        telemetryManager = {
            generateCurrentRequestHeaderValue: jest.fn(),
            generateLastRequestHeaderValue: jest.fn(),
        } as unknown as jest.Mocked<ServerTelemetryManager>;

        client = new CustomAuthApiClient(httpClient);
    });

    it("should throw an error if httpClient is null or undefined", () => {
        expect(() => new CustomAuthApiClient(null as any)).toThrow();
    });

    it("should call performSignInInitiateRequest and return the correct response", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.OK,
            JSON.stringify({
                correlation_id: "test-correlation-id",
                continuation_token: "test-continuation-token",
                challenge_type: "oob",
            }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInInitiateRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                challengeType: "test-challenge",
                username: "test-user",
            },
        );

        const response = await client.performSignInInitiateRequest(request);

        const capturedRequest = httpClient.sendAsync.mock.calls[0][0];

        expect(capturedRequest.correlationId).toStrictEqual(
            "test-correlation-id",
        );
        expect(capturedRequest.method).toStrictEqual("POST");
        expect(capturedRequest.url).toStrictEqual(
            CustomAuthApiEndpoint.SIGN_IN_INITIATE_ENDPOINT,
        );
        expect(capturedRequest.body).toStrictEqual(
            new URLSearchParams({
                client_id: "test-client-id",
                challenge_type: "test-challenge",
                username: "test-user",
            }).toString(),
        );
        expect(Object.keys(capturedRequest.headers).length).toStrictEqual(8);

        expect(response.correlation_id).toStrictEqual("test-correlation-id");
        expect(response.continuation_token).toStrictEqual(
            "test-continuation-token",
        );
        expect(response.challenge_type).toStrictEqual("oob");
    });

    it("should throw CustomAuthApiError for non-200 status codes in performSignInInitiateRequest", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.BAD_REQUEST,
            JSON.stringify({ error: "Invalid request" }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInInitiateRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                challengeType: "test-challenge",
                username: "test-user",
            },
        );

        await expect(
            client.performSignInInitiateRequest(request),
        ).rejects.toThrow(CustomAuthApiError);
    });

    it("should call performSignInChallengeRequest and handle success response", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.OK,
            JSON.stringify({
                correlation_id: "test-correlation-id",
                continuation_token: "test-continuation-token",
                challenge_type: "password",
            }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInChallengeRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                continuationToken: "test-continuation-token",
                challengeType: "password",
            },
        );

        const response = await client.performSignInChallengeRequest(request);

        expect(response.correlation_id).toStrictEqual("test-correlation-id");
        expect(response.continuation_token).toStrictEqual(
            "test-continuation-token",
        );
        expect(response.challenge_type).toStrictEqual("password");
    });

    it("should call performSignInPasswordTokenRequest with correct parameters", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.OK,
            JSON.stringify({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInPasswordTokenRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                continuationToken: "test-continuation-token",
                grantType: "password",
                password: "test-password",
                scopes: ["scope1", "scope2"],
            },
        );

        const response =
            await client.performSignInPasswordTokenRequest(request);

        expect(response.access_token).toBe("test-access-token");
        expect(response.refresh_token).toBe("test-refresh-token");
        expect(response.id_token).toBe("test-id-token");
        expect(response.expires_in).toBe(3600);
        expect(response.token_type).toBe("Bearer");
        expect(response.correlation_id).toBe("test-correlation-id");
    });

    it("should call performSignInOobTokenRequest with correct parameters", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.OK,
            JSON.stringify({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInOobTokenRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                continuationToken: "test-continuation-token",
                grantType: "oob",
                oob: "test-code",
                scopes: ["scope1", "scope2"],
            },
        );

        const response = await client.performSignInOobTokenRequest(request);

        expect(response.access_token).toBe("test-access-token");
        expect(response.refresh_token).toBe("test-refresh-token");
        expect(response.id_token).toBe("test-id-token");
        expect(response.expires_in).toBe(3600);
        expect(response.token_type).toBe("Bearer");
        expect(response.correlation_id).toBe("test-correlation-id");
    });

    it("should call performSignInContinuationTokenRequest with correct parameters", async () => {
        const mockedHttpResponse = new HttpResponseMessage(
            HttpStatusCode.OK,
            JSON.stringify({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            }),
            {},
        );

        httpClient.sendAsync.mockResolvedValue(mockedHttpResponse);

        const request = new SignInContinuationTokenRequest(
            "test-correlation-id",
            telemetryManager,
            {
                clientId: "test-client-id",
                continuationToken: "test-continuation-token",
                grantType: "oob",
                username: "test-user",
                scopes: ["scope1", "scope2"],
            },
        );

        const response =
            await client.performSignInContinuationTokenRequest(request);

        expect(response.access_token).toBe("test-access-token");
        expect(response.refresh_token).toBe("test-refresh-token");
        expect(response.id_token).toBe("test-id-token");
        expect(response.expires_in).toBe(3600);
        expect(response.token_type).toBe("Bearer");
        expect(response.correlation_id).toBe("test-correlation-id");
    });
});
