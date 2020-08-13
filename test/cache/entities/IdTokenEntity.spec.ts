import { expect } from "chai";
import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { mockIdTokenEntity, mockAccessTokenEntity_1 } from "./cacheConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src";
import { CacheType } from "../../../src/utils/Constants";

describe("IdTokenEntity.ts Unit Tests", () => {
    it("Verify an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        expect(idT instanceof IdTokenEntity);
    });

    it("Create an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-idtoken-mock_client_id-microsoft-"
        );
    });

    it("Throws error if IdTokenEntity is not assigned a type", () => {
        const idT = new IdTokenEntity();
        expect(() => idT.generateType()).to.throw(ClientAuthError);
        expect(() => idT.generateType()).to.throw(ClientAuthErrorMessage.unexpectedCredentialType.desc);
    });

    it("Generate IdTokenEntity type", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateType()).to.eql(CacheType.ID_TOKEN);
    });

    it("verify if an object is an id token entity", () => {
        expect(IdTokenEntity.isIdTokenEntity(mockIdTokenEntity)).to.eql(true);
    });

    it("verify if an object is not an id token entity", () => {
        expect(IdTokenEntity.isIdTokenEntity(mockAccessTokenEntity_1)).to.eql(false);
    });
});
