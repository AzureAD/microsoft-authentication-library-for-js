import { ICrypto } from "./ICrypto";

/**
 * See eSTS docs for more info.
 * - A kid element, with the value containing an RFC 7638-compliant JWK thumbprint that is base64 encoded.
 * -  xms_ksl element, representing the storage location of the key's secret component on the client device. One of two values:
 *      - sw: software storage
 *      - uhw: hardware storage
 */
type ReqCnf = {
    kid: string;
    xms_ksl: KeyLocation;
};

enum KeyLocation {
    SW = "sw",
    UHW = "uhw"
}

export class PopTokenGenerator {

    private cryptoUtils: ICrypto;

    constructor(cryptoUtils: ICrypto) {
        this.cryptoUtils = cryptoUtils;
    }

    async generateCnf(): Promise<string> {
        const reqCnf: ReqCnf = {
            kid: await this.cryptoUtils.generatePoPThumbprint(),
            xms_ksl: KeyLocation.SW
        };

        return this.cryptoUtils.base64Encode(JSON.stringify(reqCnf));
    }
}
