/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import { ThrottlingUtils, RequestThumbprint } from "../../src/network/ThrottlingUtils";
import { NetworkManager } from "../../src/network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../../src/server/ServerAuthorizationTokenResponse";
import { MockStorageClass }  from "../client/ClientTestUtils";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";

describe("NetworkManager", () => {
    describe("sendPostRequest", () => {
        afterEach(() => {
            sinon.restore();
        });
        
        it("returns a response", async () => {
            const networkInterface = {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return { test: "test" };
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return { test: "test" };
                }
            }
            const cache = new MockStorageClass();
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = {
                clientId: "",
                authority: "",
                scopes: new Array<string>()
            };
            const options: NetworkRequestOptions = {
                headers: new Map<string, string>(),
                body: ""
            }
            const networkStub = sinon.stub(networkInterface, "sendPostRequestAsync").returns(Promise.resolve("test"));
            const preProcessStub = sinon.stub(ThrottlingUtils, "preProcess");
            const postProcessStub = sinon.stub(ThrottlingUtils, "postProcess");

            const res = await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(thumbprint, "tokenEndpoint", options);
            console.log("RES ", res);

            sinon.assert.callCount(networkStub, 1);
            sinon.assert.callCount(preProcessStub, 1);
            sinon.assert.callCount(postProcessStub, 1);
            expect(res).to.deep.eq("test");
        });
    });
});