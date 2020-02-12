import { expect } from "chai";
import { describe, it } from "mocha";
import { WindowUtils } from "../../src/utils/WindowUtils";
import { FramePrefix } from "../../src/utils/Constants";
import { TEST_CONFIG } from "../TestConstants";
import { ClientAuthError } from "../../src/error/ClientAuthError";

describe("WindowUtils", () => {
    describe("monitorWindowForHash", () => {
        it("times out", done => {
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

    describe("generateFrameName", () => {
        it("test idToken frame name created", () => {
            const scopes = ["s1", "s2", "s3"];
            const authority = TEST_CONFIG.validAuthority;

            const idTokenFrameName = WindowUtils.generateFrameName(FramePrefix.ID_TOKEN_FRAME, scopes, authority);
            const tokenFrameName = WindowUtils.generateFrameName(FramePrefix.TOKEN_FRAME, scopes, authority);

            expect(idTokenFrameName).to.equal(`${FramePrefix.ID_TOKEN_FRAME}|s1 s2 s3|${TEST_CONFIG.validAuthority}`);
            expect(tokenFrameName).to.equal(`${FramePrefix.TOKEN_FRAME}|s1 s2 s3|${TEST_CONFIG.validAuthority}`);
        });
    });
});
