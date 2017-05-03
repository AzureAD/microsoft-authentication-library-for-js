"use strict";

namespace Msal {

    /**
    * @hidden
    */
    export class IdToken {

        rawIdToken: string;
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

        constructor(rawIdToken: string) {
            if (Utils.isEmpty(rawIdToken)) {
                throw new Error("null or empty raw idtoken");
            }
            try {
                this.rawIdToken = rawIdToken;
                const decodedIdToken = Utils.extractIdToken(rawIdToken);
                if (decodedIdToken) {
                    if (decodedIdToken.hasOwnProperty("iss")) {
                        this.issuer = decodedIdToken.iss;
                    }

                    if (decodedIdToken.hasOwnProperty("oid")) {
                        this.objectId = decodedIdToken.oid;
                    }

                    if (decodedIdToken.hasOwnProperty("sub")) {
                        this.subject = decodedIdToken.sub;
                    }

                    if (decodedIdToken.hasOwnProperty("tid")) {
                        this.tenantId = decodedIdToken.tid;
                    }

                    if (decodedIdToken.hasOwnProperty("ver")) {
                        this.version = decodedIdToken.ver;
                    }

                    if (decodedIdToken.hasOwnProperty("preferred_username")) {
                        this.preferredName = decodedIdToken.preferred_username;
                    }

                    if (decodedIdToken.hasOwnProperty("name")) {
                        this.name = decodedIdToken.name;
                    }

                    if (decodedIdToken.hasOwnProperty("nonce")) {
                        this.nonce = decodedIdToken.nonce;
                    }

                    if (decodedIdToken.hasOwnProperty("exp")) {
                        this.expiration = decodedIdToken.exp;
                    }
                }
            } catch (e) {
                throw new Error("Failed to parse the returned id token");
            }
        }

    }
}
