import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { PublicClientApplication } from "@azure/msal-browser";
import { BrowserRouter } from "react-router-dom";
import App from './App';


describe('Sanitize configuration object', () => {
    beforeAll(() => {
        global.msalConfig = require('./authConfig.js').msalConfig;
    });

    it('should define the config object', () => {
        expect(msalConfig).toBeDefined();
    });

    it('should not contain credentials', () => {
        const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(regexGuid.test(msalConfig.auth.clientId)).toBe(false);
    });

    it('should contain authority uri', () => {
        const regexUri = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        expect(regexUri.test(msalConfig.auth.authority)).toBe(true);
    });

    it('should not contain tenant id', () => {
        const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(regexGuid.test(msalConfig.auth.authority.split('.com/')[1])).toBe(false);
    });

    it('should define a redirect uri', () => {
        expect(msalConfig.auth.redirectUri).toBeDefined();
    });
});

describe('Ensure that the app starts', () => {
    let pca;
    let handleRedirectSpy;

    beforeEach(() => {
        global.crypto = require('crypto');
        global.msalConfig = require('./authConfig.js').msalConfig;
        pca = new PublicClientApplication(msalConfig);
        handleRedirectSpy = jest.spyOn(pca, 'handleRedirectPromise');
    });

    it('should instantiate msal', () => {
        expect(pca).toBeDefined();
        expect(pca).toBeInstanceOf(PublicClientApplication);
    });

    it('should render the app without crashing', async () => {
        render(
            <BrowserRouter>
                <App instance={pca} />
            </BrowserRouter>
        );
        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(
            await screen.findByText('Welcome to the Microsoft Authentication Library For React Tutorial')
        ).toBeInTheDocument();
    })
});
