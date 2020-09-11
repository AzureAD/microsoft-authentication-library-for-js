import { Authority, WindowUtils } from "../src";
import { ITenantDiscoveryResponse } from "../src/authority/ITenantDiscoveryResponse";
import { TrustedAuthority } from "../src/authority/TrustedAuthority";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { TimeUtils } from "../src/utils/TimeUtils";
import { TEST_TOKEN_LIFETIMES, VALID_OPENID_CONFIGURATION_RESPONSE } from "./TestConstants";
import sinon from "sinon";

export type kv = {
    [key: string]: string;
};


export const setAuthInstanceStubs = function () {
    sinon.restore();
    sinon.stub(Authority.prototype, "resolveEndpointsAsync").callsFake(function () : Promise<ITenantDiscoveryResponse> {
        return new Promise((resolve, reject) => {
            return resolve(VALID_OPENID_CONFIGURATION_RESPONSE);
        });
    });
    sinon.stub(Authority.prototype, "AuthorizationEndpoint").value(VALID_OPENID_CONFIGURATION_RESPONSE.AuthorizationEndpoint);
    sinon.stub(Authority.prototype, "EndSessionEndpoint").value(VALID_OPENID_CONFIGURATION_RESPONSE.EndSessionEndpoint);
    sinon.stub(Authority.prototype, "SelfSignedJwtAudience").value(VALID_OPENID_CONFIGURATION_RESPONSE.Issuer);
    sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
    sinon.stub(WindowUtils, "isInIframe").returns(false);
    sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
};

export const setUtilUnifiedCacheQPStubs = function (params: kv) {
    sinon.stub(ServerRequestParameters.prototype, <any>"constructUnifiedCacheQueryParameter").returns(params);
    sinon.stub(ServerRequestParameters.prototype, <any>"addSSOParameter").returns(params);
};
