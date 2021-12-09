import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { mockIdTokenEntity, mockAccessTokenEntity_1 } from "./cacheConstants";
import { CacheType } from "../../../src/utils/Constants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src/error/ClientAuthError";

describe("IdTokenEntity.ts Unit Tests", () => {
    it("Verify an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        expect(idT instanceof IdTokenEntity);
    });

    it("Create an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateCredentialKey()).toEqual("uid.utid-login.microsoftonline.com-idtoken-mock_client_id-microsoft---");
    });

    it("Throws error if IdTokenEntity is not assigned a type", () => {
        const idT = new IdTokenEntity();
        expect(() => idT.generateType()).toThrowError(ClientAuthError);
        expect(() => idT.generateType()).toThrowError(ClientAuthErrorMessage.unexpectedCredentialType.desc);
    });

    it("Generate IdTokenEntity type", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateType()).toEqual(CacheType.ID_TOKEN);
    });

    it("verify if an object is an id token entity", () => {
        expect(IdTokenEntity.isIdTokenEntity(mockIdTokenEntity)).toEqual(true);
    });

    it("verify if an object is not an id token entity", () => {
        expect(IdTokenEntity.isIdTokenEntity(mockAccessTokenEntity_1)).toEqual(false);
    });
});
