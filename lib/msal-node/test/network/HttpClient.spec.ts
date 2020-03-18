import { HttpClient } from '../../src/network/HttpClient';
import axios, { AxiosResponse } from 'axios';
import { mocked } from "ts-jest"; //<-- This allows to mock results

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

    // test GET
    test('sendGetRequestAsync', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        const result = await httpClient.sendGetRequestAsync('url');
        expect(result).toMatchObject(axiosResponse.data);
    });

    // test POST success
    test('sendPostRequestAsync resolves', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        const result = await httpClient.sendPostRequestAsync('url');
        expect(result).toMatchObject(axiosResponse.data);
    });

    // test POST failure
    test('sendPostRequestAsync rejects ', async () => {

        //Mocking axios function rather than a method
        mocked(axios).mockRejectedValue(axiosErrorResponse);

        try {
            await httpClient.sendPostRequestAsync('url', {
                body: 'randomData',
                headers: new Map<string, string>().set('key', 'value'),
            });
        } catch (e) {
            expect(e).toMatchObject(axiosErrorResponse);
        }
    });
});
