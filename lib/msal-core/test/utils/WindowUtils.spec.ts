import { expect } from "chai";
import { describe, it } from "mocha";
import { WindowUtils } from "../../src/utils/WindowUtils";
import { ClientAuthError } from "../../src/error/ClientAuthError";

describe("WindowUtils", () => {
    describe("monitorWindowForHash", () => {
        it("times out (popup)", done => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorWindowForHash(iframe.contentWindow, 500)
                .catch((err: ClientAuthError) => {
                    done();
                });
        });

        it("times out (iframe)", done => {
            const iframe = {
                contentWindow: {
                    // @ts-ignore
                    location: null // example of scenario that would never otherwise resolve
                }
            };

            // @ts-ignore
            WindowUtils.monitorWindowForHash(iframe.contentWindow, 500, "http://login.microsoftonline.com", true)
                .catch((err: ClientAuthError) => {
                    done();
                });
        });

        it("returns hash", done => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorWindowForHash(iframe.contentWindow, 1000)
                .then((hash: string) => {
                    expect(hash).to.equal("#access_token=hello");
                    done();
                });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#/access_token=hello",
                    hash: "#access_token=hello"
                };
            }, 500);
        });

        it("closed", done => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    },
                    closed: false
                }
            };

            // @ts-ignore
            WindowUtils.monitorWindowForHash(iframe.contentWindow, 1000)
                .catch((error: ClientAuthError) => {
                    expect(error.errorCode).to.equal('user_cancelled');
                    done();
                });

            setTimeout(() => {
                iframe.contentWindow.closed = true;
            }, 500);
        });
    });
});
