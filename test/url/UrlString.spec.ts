import { expect } from "chai";
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
        expect(urlObj.urlString).to.be.eq(TEST_URIS.TEST_REDIR_URI + "/");
    });

    it("constructor throws error if uri is empty or null", () => {
        expect(() => new UrlString(null)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => new UrlString(null)).to.throw(ClientConfigurationError);

        expect(() => new UrlString("")).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => new UrlString("")).to.throw(ClientConfigurationError);
    });

    it("validateAsUri throws error if uri components could not be extracted", () => {
        const urlComponentError = "Error getting url components"
        sinon.stub(UrlString.prototype, "getUrlComponents").throws(urlComponentError);
        let urlObj = new UrlString(TEST_URIS.TEST_REDIR_URI);
        expect(() => urlObj.validateAsUri()).to.throw(`${ClientConfigurationErrorMessage.urlParseError.desc} Given Error: ${urlComponentError}`);
        expect(() => urlObj.validateAsUri()).to.throw(ClientConfigurationError);
    });

    it("validateAsUri throws error if uri is not secure", () => {
        const insecureUrlString = "http://login.microsoft.com/common";
        let urlObj = new UrlString(insecureUrlString);
        expect(() => urlObj.validateAsUri()).to.throw(`${ClientConfigurationErrorMessage.authorityUriInsecure.desc} Given URI: ${insecureUrlString}`);
        expect(() => urlObj.validateAsUri()).to.throw(ClientConfigurationError);
    });

    it("validateAsUri validates any valid URI", () => {
        const insecureUrlString = "https://example.com/";
        let urlObj = new UrlString(insecureUrlString);
        expect(() => urlObj.validateAsUri()).to.not.throw;
    });

    it("urlRemoveQueryStringParameter removes required path components",() => {
        let urlObj1 = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS1);
        expect(urlObj1.urlString).to.contain("param1=value1");
        urlObj1.urlRemoveQueryStringParameter("param1");
        expect(urlObj1.urlString).to.not.contain("param1=value1");

        let urlObj2 = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS2);
        expect(urlObj2.urlString).to.contain("param1=value1");
        expect(urlObj2.urlString).to.contain("param2=value2");
        urlObj2.urlRemoveQueryStringParameter("param2");
        expect(urlObj2.urlString).to.contain("param1=value1");
        expect(urlObj2.urlString).to.not.contain("param2=value2");
        urlObj2.urlRemoveQueryStringParameter("param1");
        expect(urlObj2.urlString).to.not.contain("param1=value1");
        expect(urlObj2.urlString).to.not.contain("param2=value2");
    });

    it("appendQueryString appends the provided query string", () => {
        const baseUrl = "https://localhost/";
        const queryString = "param1=value1&param2=value2";
        expect(UrlString.appendQueryString(baseUrl, queryString)).to.equal(`${baseUrl}?${queryString}`);
        expect(UrlString.appendQueryString(`${baseUrl}?param3=value3`, queryString)).to.equal(`${baseUrl}?param3=value3&${queryString}`);
        expect(UrlString.appendQueryString(baseUrl, "")).to.equal(baseUrl);
    });

    it("removes hash from url provided", () => {
        const baseUrl = "https://localhost/";
        const fullUrl = baseUrl + "#thisIsATestHash";
        expect(UrlString.removeHashFromUrl(fullUrl)).to.eq(baseUrl);
    });

    it("removes empty query string from url provided", () => {
        const baseUrl = "https://localhost/";
        const testUrl = baseUrl + "?";
        const testUrl2 = baseUrl + "?/";
        expect(UrlString.removeHashFromUrl(testUrl)).to.eq(baseUrl);
        expect(UrlString.removeHashFromUrl(testUrl2)).to.eq(baseUrl);
    });

    it("replaceTenantPath correctly replaces common with tenant id", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT);
        const sampleTenantId = "sample-tenant-id";
        expect(urlObj.urlString).to.contain("common");
        expect(urlObj.urlString).to.not.contain(sampleTenantId);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId);
        expect(newUrlObj.urlString).to.not.contain("common");
        expect(newUrlObj.urlString).to.contain(sampleTenantId);
    });

    it("replaceTenantPath correctly replaces organizations with tenant id", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_ORGS);
        const sampleTenantId = "sample-tenant-id";
        expect(urlObj.urlString).to.contain("organizations");
        expect(urlObj.urlString).to.not.contain(sampleTenantId);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId);
        expect(newUrlObj.urlString).to.not.contain("organizations");
        expect(newUrlObj.urlString).to.contain(sampleTenantId);
    });

    it("replaceTenantPath returns the same url if path does not contain common or organizations", () => {
        let urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_TENANT_ID);
        const sampleTenantId2 = "sample-tenant-id-2";
        expect(urlObj.urlString).to.contain("sample-tenantid");
        expect(urlObj.urlString).to.not.contain(sampleTenantId2);
        const newUrlObj = urlObj.replaceTenantPath(sampleTenantId2);
        expect(newUrlObj.urlString).to.contain("sample-tenantid");
        expect(newUrlObj.urlString).to.not.contain(sampleTenantId2);
    });

    it("getHash returns the anchor part of the URL correctly, or nothing if there is no anchor", () => {
        const urlWithHash = TEST_URIS.TEST_AUTH_ENDPT + TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH;
        const urlWithHashAndSlash = TEST_URIS.TEST_AUTH_ENDPT + "#/" + TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1);
        const urlWithoutHash = TEST_URIS.TEST_AUTH_ENDPT;
        
        const urlObjWithHash = new UrlString(urlWithHash);
        const urlObjWithHashAndSlash = new UrlString(urlWithHashAndSlash);
        const urlObjWithoutHash = new UrlString(urlWithoutHash);

        expect(urlObjWithHash.getHash()).to.be.eq(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1));
        expect(urlObjWithHashAndSlash.getHash()).to.be.eq(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH.substring(1));
        expect(urlObjWithoutHash.getHash()).to.be.empty;
    });

    it("getDeserializedHash returns the hash as a deserialized object", () => {
        const serializedHash = "#param1=value1&param2=value2&param3=value3";
        const deserializedHash = {
            "param1": "value1",
            "param2": "value2",
            "param3": "value3",
        };

        expect(UrlString.getDeserializedHash(serializedHash)).to.be.deep.eq(deserializedHash);
    });

    it("getUrlComponents returns all path components", () => {
        const urlObj = new UrlString(TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS2);
        expect(urlObj.getUrlComponents()).to.be.deep.eq({
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
        expect(urlObj.urlString).to.be.eq(TEST_URIS.TEST_AUTH_ENDPT + "/");
    });

    it("hashContainsKnownProperties returns true if correct hash is given", () => {
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH)).to.be.true;
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_ACCESS_TOKEN_HASH)).to.be.true;
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_SUCCESS_CODE_HASH)).to.be.true;
        expect(UrlString.hashContainsKnownProperties(TEST_HASHES.TEST_ERROR_HASH)).to.be.true;
    });

    it("hashContainsKnownProperties returns false if incorrect hash is given", () => {
        const exampleUnknownHash = "#param1=value1&param2=value2&param3=value3";
        expect(UrlString.hashContainsKnownProperties(exampleUnknownHash)).to.be.false;
    });

    describe("getDomainFromUrl tests", () => {
        it("tests domain is returned when provided url includes protocol", () => {
            expect(UrlString.getDomainFromUrl("https://domain.com")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("https://domain.com/")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("http://domain.com")).to.eq("domain.com");
        });

        it("tests domain is returned when only domain is provided", () => {
            expect(UrlString.getDomainFromUrl("domain.com/")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com")).to.eq("domain.com");
        });

        it("tests domain is returned when provided url is not homepage", () => {
            expect(UrlString.getDomainFromUrl("domain.com/page")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/index.html")).to.eq("domain.com");
        });

        it("tests domain is returned when provided url includes hash", () => {
            expect(UrlString.getDomainFromUrl("domain.com#customHash")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/#customHash")).to.eq("domain.com");
        });

        it("tests domain is returned when provided url includes query string", () => {
            expect(UrlString.getDomainFromUrl("domain.com?queryString=1")).to.eq("domain.com");
            expect(UrlString.getDomainFromUrl("domain.com/?queryString=1")).to.eq("domain.com");
        });
    });

    describe("getAbsoluteUrl tests", () => {
        it("Returns url provided if it's already absolute", () => {
            const absoluteUrl = "https://localhost:30662"
            expect(UrlString.getAbsoluteUrl(absoluteUrl, absoluteUrl + "/testPath")).to.eq(absoluteUrl);
        });

        it("Returns absolute url if relativeUrl provided", () => {
            const basePath = "https://localhost:30662"
            const absoluteUrl = "https://localhost:30662/testPath";
            expect(UrlString.getAbsoluteUrl("/testPath", basePath)).to.eq(absoluteUrl);
            expect(UrlString.getAbsoluteUrl("/testPath", basePath + "/")).to.eq(absoluteUrl);
        });

        it("Replaces path if relativeUrl provided and baseUrl contains different path", () => {
            const basePath = "https://localhost:30662/differentPath"
            const expectedUrl = "https://localhost:30662/testPath";
            expect(UrlString.getAbsoluteUrl("/testPath", basePath)).to.eq(expectedUrl);
        });
    });

    describe("canonicalizeUri tests", () => {
        it("returns empty string if passed", () => {
            const url = "";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).to.equal(url);
        });

        it ("handles ?", () => {
            let url = "https://contoso.com/?";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).to.equal("https://contoso.com/");
        });

        it ("handles ?/", () => {
            let url = "https://contoso.com/?/";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(canonicalUrl).to.equal("https://contoso.com/");
        });

        it("maintains original casing of original url", () => {
            let url = "https://contoso.com/PATH";

            const canonicalUrl = UrlString.canonicalizeUri(url);

            expect(url).to.equal("https://contoso.com/PATH");
            expect(canonicalUrl).to.equal("https://contoso.com/path/");
        })
    });
});
