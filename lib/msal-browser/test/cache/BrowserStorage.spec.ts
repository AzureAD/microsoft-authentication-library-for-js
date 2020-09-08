
import { expect } from "chai";
import sinon from "sinon";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { CacheOptions } from "../../src/config/Configuration";
import { BrowserConfigurationAuthErrorMessage, BrowserConfigurationAuthError } from "../../src/error/BrowserConfigurationAuthError";
import { BrowserConstants } from "../../src/utils/BrowserConstants";
import { BrowserStorage } from "../../src/cache/BrowserStorage";

describe("BrowserStorage tests", () => {

    let cacheConfig: CacheOptions;
    let windowRef: Window & typeof globalThis;
    beforeEach(() => {
        cacheConfig = {
            cacheLocation: BrowserConstants.CACHE_LOCATION_SESSION,
            storeAuthStateInCookie: false
        };
        windowRef = window;
    });

    afterEach(() => {
        sinon.restore();
        window = windowRef;
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("BrowserStorage Constructor", () => {

        it("Throws an error if window object is null", () => {
            window = null;
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserAuthErrorMessage.notInBrowserEnvironment.desc);
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserAuthError);
        });

        it("Throws an error if cache location string does not match localStorage or sessionStorage", () => {
            cacheConfig.cacheLocation = "notALocation";
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthError);
        });

        it("Throws an error if storage is not supported", () => {
            sinon.stub(window, "sessionStorage").value(null);
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthError);
            sinon.stub(window, "localStorage").value(null);
            cacheConfig.cacheLocation = BrowserConstants.CACHE_LOCATION_LOCAL;
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(cacheConfig.cacheLocation)).to.throw(BrowserConfigurationAuthError);
        });
    });
});
