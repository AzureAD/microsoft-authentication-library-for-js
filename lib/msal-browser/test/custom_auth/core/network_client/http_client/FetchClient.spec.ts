import { Logger } from "@azure/msal-browser";
import { FetchHttpClient } from "../../../../../src/custom_auth/core/network_client/http_client/FetchHttpClient.js";

class MockResponse {
    public readonly status: number;
    public readonly headers: Headers;
    private readonly body: any;

    constructor(body: any, init: ResponseInit = {}) {
        this.status = init.status || 200;
        this.headers = new Headers(init.headers);
        this.body = body;
    }

    async json() {
        return JSON.parse(this.body);
    }
}

describe("FetchHttpClient", () => {
    let httpClient: FetchHttpClient;
    let mockFetch: jest.Mock;
    const mockLogger = {
        clone: jest.fn(),
        info: jest.fn(),
        infoPii: jest.fn(),
        verbose: jest.fn(),
        verbosePii: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
        errorPii: jest.fn(),
        tracePii: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    beforeEach(() => {
        // Create a mock for the global fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        httpClient = new FetchHttpClient(mockLogger);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("sendAsync", () => {
        it("should call fetch with correct parameters", async () => {
            const url = "https://api.example.com";
            const options: RequestInit = {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            };
            const mockResponse = new MockResponse(null, { status: 200 });
            mockFetch.mockResolvedValue(mockResponse);
            const response = await httpClient.sendAsync(url, options);
            expect(mockFetch).toHaveBeenCalledWith(url, options);
            expect(response).toBe(mockResponse);
        });

        it("should propagate fetch errors", async () => {
            const url = "https://api.example.com";
            const error = new Error("Network error");
            mockFetch.mockRejectedValue(error);
            await expect(httpClient.sendAsync(url, {})).rejects.toThrow(
                "Network error"
            );
        });
    });
});
