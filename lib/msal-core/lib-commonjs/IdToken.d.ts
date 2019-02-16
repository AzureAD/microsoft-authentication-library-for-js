/**
 * @hidden
 */
export declare class IdToken {
    issuer: string;
    objectId: string;
    subject: string;
    tenantId: string;
    version: string;
    preferredName: string;
    name: string;
    homeObjectId: string;
    nonce: string;
    expiration: string;
    rawIdToken: string;
    decodedIdToken: Object;
    sid: string;
    constructor(rawIdToken: string);
}
