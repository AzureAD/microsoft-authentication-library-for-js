import { Logger } from "@azure/msal-browser";
import { FetchHttpClient } from "../../../../src/core/network_client/http_client/FetchHttpClient.js";
import {
    HttpMethod,
    HttpRequestMessage,
} from "../../../../src/core/network_client/http_client/HttpMessage.js";
import {
    HttpError,
    NoNetworkConnectivity,
} from "../../../../src/core/error/HttpError.js";

describe("FetchHttpClient", () => {
    let fetchHttpClient: FetchHttpClient;
    let mockLogger: Logger;

    beforeEach(() => {
        global.fetch = jest.fn(); // Mock the fetch API
        mockLogger = {
            trace: jest.fn(),
            error: jest.fn(),
        } as unknown as Logger;
        fetchHttpClient = new FetchHttpClient(
            mockLogger,
            "https://api.example.com",
        );
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    it("should send a GET request and return a valid response", async () => {
        const mockResponse = { data: "test" };
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => mockResponse,
            headers: new Headers({ "content-type": "application/json" }),
        });

        const request = new HttpRequestMessage(
            HttpMethod.GET,
            "endpoint",
            {},
            "",
        );

        const response = await fetchHttpClient.sendAsync(request);

        expect(fetch).toHaveBeenCalledTimes(1);
        const expectedUrl = new URL("endpoint", "https://api.example.com");
        expect(fetch).toHaveBeenCalledWith(expectedUrl, {
            method: HttpMethod.GET,
            headers: new Headers(),
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(JSON.stringify(mockResponse));
        expect(mockLogger.trace).toHaveBeenCalled();
    });

    it("should send a POST request with a body", async () => {
        const mockResponse = { success: true };
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 201,
            json: async () => mockResponse,
            headers: new Headers(),
        });

        const request = new HttpRequestMessage(
            HttpMethod.POST,
            "endpoint",
            {
                "Content-Type": "application/json",
            },
            "",
        );
        request.body = JSON.stringify({ name: "test" });

        const response = await fetchHttpClient.sendAsync(request);

        expect(fetch).toHaveBeenCalledTimes(1);
        const expectedUrl = new URL("endpoint", "https://api.example.com");
        expect(fetch).toHaveBeenCalledWith(expectedUrl, {
            method: HttpMethod.POST,
            headers: expect.any(Headers),
            body: JSON.stringify({ name: "test" }),
        });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(JSON.stringify(mockResponse));
    });

    it("should handle network connectivity issues", async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
        Object.defineProperty(window.navigator, "onLine", {
            value: false,
            writable: true,
        });

        const request = new HttpRequestMessage(
            HttpMethod.GET,
            "endpoint",
            {},
            "",
        );

        await expect(fetchHttpClient.sendAsync(request)).rejects.toThrow(
            NoNetworkConnectivity,
        );

        expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle fetch failures gracefully", async () => {
        const error = new Error("Fetch Error");
        (fetch as jest.Mock).mockRejectedValueOnce(error);

        const request = new HttpRequestMessage(
            HttpMethod.GET,
            "endpoint",
            {},
            "",
        );

        await expect(fetchHttpClient.sendAsync(request)).rejects.toThrow(
            HttpError,
        );

        expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should append headers correctly", async () => {
        const mockResponse = { data: "test" };
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => mockResponse,
            headers: new Headers({ "content-type": "application/json" }),
        });

        const request = new HttpRequestMessage(
            HttpMethod.GET,
            "endpoint",
            {
                Authorization: "Bearer token",
            },
            "",
        );

        const response = await fetchHttpClient.sendAsync(request);

        expect(fetch).toHaveBeenCalledTimes(1);
        const expectedUrl = new URL("endpoint", "https://api.example.com");
        const expectedHeaders = new Headers({ Authorization: "Bearer token" });
        expect(fetch).toHaveBeenCalledWith(expectedUrl, {
            method: HttpMethod.GET,
            headers: expectedHeaders,
        });
    });

    it("should generate a valid request URL with base URL", () => {
        const url = fetchHttpClient["generateRequestUrl"]("path/to/resource");
        expect(url.toString()).toBe("https://api.example.com/path/to/resource");
    });

    it("should generate a valid request URL without a base URL", () => {
        const noBaseClient = new FetchHttpClient(mockLogger);
        const url = noBaseClient["generateRequestUrl"](
            "https://example.com/resource",
        );
        expect(url.toString()).toBe("https://example.com/resource");
    });

    it("should parse response headers correctly", async () => {
        const mockHeaders = new Headers({ "x-custom-header": "value" });
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({}),
            headers: mockHeaders,
        });

        const request = new HttpRequestMessage(
            HttpMethod.GET,
            "endpoint",
            {},
            "",
        );
        const response = await fetchHttpClient.sendAsync(request);

        expect(response.headers).toEqual({
            "x-custom-header": "value",
        });
    });
});
