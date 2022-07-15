import { HttpClient } from '../../src/network/HttpClient';
import { HttpStatusCode } from '../../src/utils/Constants';
import { ClientAuthError, ClientAuthErrorMessage } from '@azure/msal-common';
import axios, { AxiosResponse } from 'axios';
import { mocked } from 'jest-mock';
import 'regenerator-runtime';

jest.mock('axios');

describe('HttpClient', () => {
    // instantiate httpClient
    const httpClient = new HttpClient();

    // Mock successful response
    const axiosResponse: AxiosResponse = {
        data: {
            title: 'mock axios response',
            body: 'mock data',
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };

    // Mock request timeout response
    const axiosRequestTimeoutResponse: AxiosResponse = {
        ...axiosResponse,
        status: HttpStatusCode.RequestTimeout
    };

    // Mock service unavailable response
    const axiosServiceUnavailableResponse: AxiosResponse = {
        ...axiosResponse,
        status: HttpStatusCode.ServiceUnavailable
    };

    // Mock 404 response
    const axiosErrorResponse: AxiosResponse = {
        ...axiosResponse,
        status: 404
    };

    // test GET
    describe("sendGetRequestAsync", () => {
        afterEach(() => {
            mocked(axios).mockReset();
        });

        it('returns a successful response', async () => {
            //Mocking axios function rather than a method
            mocked(axios).mockResolvedValue(axiosResponse);
    
            const result = await httpClient.sendGetRequestAsync('url');
            expect(result.body).toMatchObject(axiosResponse.data);
            expect(result.headers).toMatchObject(axiosResponse.headers);
            expect(result.status).toEqual(axiosResponse.status);
        });

        it('returns any other response', async () => {
            //Mocking axios function rather than a method
            mocked(axios).mockResolvedValue(axiosErrorResponse);
    
            const result = await httpClient.sendGetRequestAsync('url');
            expect(result.body).toMatchObject(axiosErrorResponse.data);
            expect(result.headers).toMatchObject(axiosErrorResponse.headers);
            expect(result.status).toEqual(axiosErrorResponse.status);
        });
    
        it('returns network error if response times out', (done) => {
            mocked(axios).mockResolvedValue(axiosRequestTimeoutResponse);
    
            httpClient.sendGetRequestAsync('url')
                .catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorMessage.networkError.code);
                    expect(e.errorMessage.includes(HttpStatusCode.RequestTimeout)).toBe(true);
                    expect(e.errorMessage.includes("url")).toBe(true);
                    done();
                });
        });
    
        it('returns network error if service unavailable', (done) => {
            mocked(axios).mockResolvedValue(axiosServiceUnavailableResponse);
    
            httpClient.sendGetRequestAsync('url')
                .catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorMessage.networkError.code);
                    expect(e.errorMessage.includes(HttpStatusCode.ServiceUnavailable)).toBe(true);
                    expect(e.errorMessage.includes("url")).toBe(true);
                    done();
                });
        });
    
        it('returns network error if error thrown when going to network', (done) => {
            mocked(axios).mockRejectedValue(new Error('error message'));
    
            httpClient.sendGetRequestAsync('url')
                .catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorMessage.networkError.code);
                    expect(e.errorMessage.includes('error message')).toBe(true);
                    expect(e.errorMessage.includes("url")).toBe(true);
                    done();
                });
        });
    
        it('returns network error no response from network', (done) => {
            mocked(axios);
    
            httpClient.sendGetRequestAsync('url')
                .catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorMessage.networkError.code);
                    expect(e.errorMessage.includes("No server response for get request")).toBe(true);
                    expect(e.errorMessage.includes("url")).toBe(true);
                    done();
                });
        });
    });

    // test POST success
    it('sendPostRequestAsync resolves', async () => {
        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        const result = await httpClient.sendPostRequestAsync('url');
        expect(result.body).toMatchObject(axiosResponse.data);
        expect(result.headers).toMatchObject(axiosResponse.headers);
        expect(result.status).toEqual(axiosResponse.status);
    });
});
