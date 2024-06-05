/**
 * @jest-environment jsdom
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

const app = require('./server.js');

jest.dontMock('fs');

const html = fs.readFileSync(path.resolve(__dirname, './public/index.html'), 'utf8');

describe('Sanitize configuration object', () => {
    beforeAll(() => {
        global.msalConfig = require('./public/authConfig.js').msalConfig;
    });

    it('should define the config object', () => {
        expect(msalConfig).toBeDefined();
    });

    it('should not contain credentials', () => {
        const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(regexGuid.test(msalConfig.auth.clientId)).toBe(false);
    });

    it('should contain authority URI', () => {
        const regexUri = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        expect(regexUri.test(msalConfig.auth.authority)).toBe(true);
    });
});

describe('Ensure pages served', () => {

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
    });

    it('should serve index page', async () => {
        const res = await request(app)
            .get('/');

        const data = await fs.promises.readFile(path.join(__dirname, './public/index.html'), 'utf8');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual(data);
    });

    it('should serve signout page', async () => {
        const res = await request(app)
            .get('/signout');

        const data = await fs.promises.readFile(path.join(__dirname, './public/signout.html'), 'utf8');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual(data);
    });
});