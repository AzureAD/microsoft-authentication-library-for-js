import { TEST_URIS, TEST_HASHES } from "../test_kit/StringConstants";
import { UrlString } from "../../src/url/UrlString";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { IUri } from "../../src/url/IUri";
import sinon from "sinon";

describe("UrlString.ts Class Unit Tests", () => {

    afterEach(() => {
        sinon.restore();
    });
    
    it("Creates a valid UrlString object", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_REDIR_URI.toUpperCase());
        expect(urlObj.urlString).toBe(TEST_URIS.TEST_REDIR_URI + "/");
    });

    it("constructor throws error if uri is empty or null", () => {
        // @ts-ignore
        expect(() => new UrlString(null)).toThrowError(ClientConfigurationErrorMessage.urlEmptyError.desc);
        // @ts-ignore
        expect(() => new UrlString(null)).toThrowError(ClientConfigurationError);

        expect(() => new UrlString("")).toThrowError(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => new UrlString("")).toThrowError(ClientConfigurationError);
    });

    it("validateAsUri throws error if uri components could not be extracted", () => {
        const urlComponentError = "Error getting url components"
        sinon.stub(UrlString.prototype, "getUrlComponents").throws(urlComponentError);
        let urlObj = new UrlString(TEST_URIS.TEST_REDIR_URI);
        expect(() => urlObj.validateAsUri()).toThrowError(
            `${ClientConfigurationErrorMessage.urlParseError.desc} Given Error: ${urlComponentError}`
        );
        expect(() => urlObj.validateAsUri()).toThrowError(ClientConfigurationError);
    });

    it("validateAsUri throws error if uri is not secure", () => {
        const insecureUrlString = "http://login.microsoft.com/common";
        let urlObj = new UrlString(insecureUrlString);
        expect(() => urlObj.validateAsUri()).toThrowError(
            `${ClientConfigurationErrorMessage.authorityUriInsecure.desc} Given URI: ${insecureUrlString}`
        );
        expect(() => urlObj.validateAsUri()).toThrowError(ClientConfigurationError);
    });

    it("validateAsUri validates any valid URI", () => {
        const insecureUrlString = "https://example.com/";
        let urlObj = new UrlString(insecureUrlString);
        expect(() => urlObj.validateAsUri()).not.toThrow();
    });

    it("appendQueryString appends the provided query string", () => {
        const baseUrl = "https://localhost/";
        const queryString = "param1=value1&param2=value2";
        expect(UrlString.appendQueryString(baseUrl, queryString)).toEqual(`${baseUrl}?${queryString}`);
        expect(UrlString.appendQueryString(`${baseUrl}?param3=value3`, queryString)).toEqual(`${baseUrl}?param3=value3&${queryString}`);
        expect(UrlString.appendQueryString(baseUrl, "")).toEqual(baseUrl);
    });

    it("removes hash from url provided", () => {
        const baseUrl = "https://localhost/";
        const fullUrl = baseUrl + "#thisIsATestHash";
        expect(UrlString.removeHashFromUrl(fullUrl)).toBe(baseUrl);
    });

    it("removes empty query string from url provided", () => {
        const baseUrl = "https://localhost/";
        const testUrl = baseUrl + "?";
        const testUrl2 = baseUrl + "?/";
        expect(UrlString.removeHashFromUrl(testUrl)).toBe(baseUrl);
        expect(UrlString.removeHashFromUrl(testUrl2)).toBe(baseUrl);
    });

    it("replaceTenantPath correctly replaces common with tenant id", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT);
        const sampleTenantId = "sample-tenant-id";
        expect(urlObj.urlString).toContain("common");
        expect(urlObj.urlString).not.toContain(sampleTenantId);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId);
        expect(newUrlObj.urlString).not.toContain("common");
        expect(newUrlObj.urlString).toContain(sampleTenantId);
    });

    it("replaceTenantPath correctly replaces organizations with tenant id", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_ORGS);
        const sampleTenantId = "sample-tenant-id";
        expect(urlObj.urlString).toContain("organizations");
        expect(urlObj.urlString).not.toContain(sampleTenantId);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId);
        expect(newUrlObj.urlString).not.toContain("organizations");
        expect(newUrlObj.urlString).toContain(sampleTenantId);
    });

    it("replaceTenantPath returns the same url if path does not contain common or organizations", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_TENANT_ID);
        const sampleTenantId2 = "sample-tenant-id-2";
        expect(urlObj.urlString).toContain("sample-tenantid");
        expect(urlObj.urlString).not.toContain(sampleTenantId2);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId2);
        expect(newUrlObj.urlString).toContain("sample-tenantid");
        expect(newUrlObj.urlString).not.toContain(sampleTenantId2);
    });

    it("getHash returns the anchor part of the URL correctly, or nothing if there is no anchor", () => {
        const urlWithHash = TEST_URIS.TEST_AUTH_ENDPT + TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH;
        const urlWithHashAndSlash = TEST_URIS.TEST_AUTH_ENDPT + "#/" + TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1);
        const urlWithoutHash = TEST_URIS.TEST_AUTH_ENDPT;
        
        const urlObjWithHash = new UrlString(urlWithHash);
        const urlObjWithHashAndSlash = new UrlString(urlWithHashAndSlash);
        const urlObjWithoutHash = new UrlString(urlWithoutHash);

        expect(urlObjWithHash.getHash()).toBe(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1));
        expect(urlObjWithHashAndSlash.getHash()).toBe(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1));
        expect(urlObjWithoutHash.getHash()).toHaveLength(0);
    });

    it("getDeserializedHash returns the hash as a deserialized object", () => {
        const serializedHash = "#param1=value1&param2=value2&param3=value3";
        const deserializedHash = {
            "param1": "value1",
            "param2": "value2",
            "param3": "value3",
        };

        expect(UrlString.getDeserializedHash(serializedHash)).toEqual(deserializedHash);
    });

    it("getDeserializedHash returns empty object if key/value is undefined", () => {
        let serializedHash = "#=value1";
        const deserializedHash = {};
        expect(UrlString.getDeserializedHash(serializedHash)).toEqual(deserializedHash);

        serializedHash = "#key1="
        expect(UrlString.getDeserializedHash(serializedHash)).toEqual(deserializedHash);
    });

    it("getUrlComponents returns all path components", () => {
        const urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS2);
        expect(urlObj.getUrlComponents()).toEqual({
            Protocol: "https:",
            HostNameAndPort: "login.microsoftonline.com",
            AbsolutePath: "/common/oauth2/v2.0/authorize",
            PathSegments: ["common", "oauth2", "v2.0", "authorize"],
            QueryString: "param1=value1&param2=value2"
        } as IUri);
    });

    it("constructAuthorityUriFromObject creates a new UrlString object", () => {
        const urlComponents = {
            Protocol: "https:",
            HostNameAndPort: "login.microsoftonline.com",
            AbsolutePath: "/common/oauth2/v2.0/authorize",
            PathSegments: ["common", "oauth2", "v2.0", "authorize"]
        } as IUri;
        const urlObj = UrlString.constructAuthorityUriFromObject(urlComponents);
        expect(urlObj.urlString).toBe(TEST_URIS.TEST_AUTH_ENDPT + "/");
    });

    it("hashContainsKnownProperties returns true if correct hash is given", () => {
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH)).toBe(true);
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_ACCESS_TOKEN_HASH)).toBe(true);
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_CODE_HASH)).toBe(true);
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_ERROR_HASH)).toBe(true);
    });

    it("hashContainsKnownProperties returns false if incorrect hash is given", () => {
        const exampleUnknownHash = "#param1=value1&param2=value2&param3=value3";
        expect(UrlString.hashContainsKnownProperties(exampleUnknownHash)).toBe(false);
    });

    it("hashContainsKnownProperties returns false if hash does not contain key/value pairs", () => {
        const exampleUnknownHash = "#testPage";
        expect(UrlString.hashContainsKnownProperties(exampleUnknownHash)).toBe(false);
    });

    describe("getDomainFromUrl tests", () => {
        it("tests domain is returned when provided url includes protocol", () => {
            expect(UrlString.getDomainFromUrl("https://domain.com")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("https://domain.com/")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("http://domain.com")).toBe("domain.com");
        });

        it("tests domain is returned when only domain is provided", () => {
            expect(UrlString.getDomainFromUrl("domain.com/")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com")).toBe("domain.com");
        });

        it("tests domain is returned when provided url is not homepage", () => {
            expect(UrlString.getDomainFromUrl("domain.com/page")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/index.html")).toBe("domain.com");
        });

        it("tests domain is returned when provided url includes hash", () => {
            expect(UrlString.getDomainFromUrl("domain.com#customHash")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/#customHash")).toBe("domain.com");
        });

        it("tests domain is returned when provided url includes query string", () => {
            expect(UrlString.getDomainFromUrl("domain.com?queryString=1")).toBe("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/?queryString=1")).toBe("domain.com");
        });
    });

    describe("getAbsoluteUrl tests", () => {
        it("Returns url provided if it's already absolute", () => {
            const absoluteUrl = "https://localhost:30662"
            expect(UrlString.getAbsoluteUrl(absoluteUrl, absoluteUrl + "/testPath")).toBe(absoluteUrl);
        });

        it("Returns absolute url if relativeUrl provided", () => {
            const basePath = "https://localhost:30662"
            const absoluteUrl = "https://localhost:30662/testPath";
            expect(UrlString.getAbsoluteUrl("/testPath", basePath)).toBe(absoluteUrl);
            expect(UrlString.getAbsoluteUrl("/testPath", basePath + "/")).toBe(absoluteUrl);
        });

        it("Replaces path if relativeUrl provided and baseUrl contains different path", () => {
            const basePath = "https://localhost:30662/differentPath"
            const expectedUrl = "https://localhost:30662/testPath";
            expect(UrlString.getAbsoluteUrl("/testPath", basePath)).toBe(expectedUrl);
        });
    });

    describe("canonicalizeUri tests", () => {
        it("returns empty string if passed", () => {
            const url = "";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).toEqual(url);
        });

        it ("handles ?", () => {
            let url = "https://contoso.com/?";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).toEqual("https://contoso.com/");
        });

        it ("handles ?/", () => {
            let url = "https://contoso.com/?/";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).toEqual("https://contoso.com/");
        });

        it("maintains original casing of original url", () => {
            let url = "https://contoso.com/PATH";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(url).toEqual("https://contoso.com/PATH");
            expect(canonicalUrl).toEqual("https://contoso.com/path/");
        })
    });
});
