import { HttpClient } from '../../src/network/HttpClient';
import axios, { AxiosResponse } from 'axios';
import { mocked } from 'ts-jest/utils';

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

    // test GET
    test('sendGetRequestAsync', async () => {
        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        const result = await httpClient.sendGetRequestAsync('url');
        expect(result.body).toMatchObject(axiosResponse.data);
        expect(result.headers).toMatchObject(axiosResponse.headers);
        expect(result.status).toEqual(axiosResponse.status);
    });

    // test POST success
    test('sendPostRequestAsync resolves', async () => {
        //Mocking axios function rather than a method
        mocked(axios).mockResolvedValue(axiosResponse);

        const result = await httpClient.sendPostRequestAsync('url');
        expect(result.body).toMatchObject(axiosResponse.data);
        expect(result.headers).toMatchObject(axiosResponse.headers);
        expect(result.status).toEqual(axiosResponse.status);
    });
});
