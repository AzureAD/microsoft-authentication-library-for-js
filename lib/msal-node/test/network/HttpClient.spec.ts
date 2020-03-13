import { HttpClient } from '../../src/network/HttpClient';
import axios, { AxiosResponse } from 'axios';
import { mocked } from "ts-jest/dist/util/testing"; //<-- This allows to mock results

jest.mock('axios');

describe('HttpClient', () => {

    // instantiate httpClient
    const httpClient = new HttpClient();

    // Mock successful response
    const axiosResponse: AxiosResponse = {
        data: {
            title: 'mock axios response',
            body: 'Well .. this is mock data',
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };

    // Mock error response
    const axiosErrorResponse = {
        message: 'axios request failed',
        response: {
            data: {
                errorCode: 'invalid_client',
                errorSummary: "Invalid value for 'client_id' parameter.",
            },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: {},
        },
    };

    test('sendGetRequestAsync', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        // Call
        const result = await httpClient.sendGetRequestAsync('url');

        //Assert
        expect(result).toStrictEqual({
            data: {
                title: 'mock axios response',
                body: 'Well .. this is mock data',
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        });

    });

    test('sendPostRequestAsync resolves', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        // Call
        const result = await httpClient.sendPostRequestAsync('url');

        //Assert
        expect(result).toStrictEqual({
            data: {
                title: 'mock axios response',
                body: 'Well .. this is mock data',
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        });
    });

    test('sendPostRequestAsync rejects ', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockRejectedValue(axiosErrorResponse);

        // Call
        try {
            await httpClient.sendPostRequestAsync('url', {
                body: 'randomData',
                headers: new Map<string, string>().set('key', 'value'),
            });
        } catch (e) {
            //Assert
            expect(e).toStrictEqual({
                message: 'axios request failed',
                response: {
                    data: {
                        errorCode: 'invalid_client',
                        errorSummary:
                            "Invalid value for 'client_id' parameter.",
                    },
                    status: 400,
                    statusText: 'Bad Request',
                    headers: {},
                    config: {},
                },
            });
        }
    });
});
