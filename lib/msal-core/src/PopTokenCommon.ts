export enum HashAlgorithm {
    sha256 = 'SHA-256'
};

export enum KeyGenAlgorithm {
    rsassa_pkcs1_v15 = "RSASSA-PKCS1-v1_5"
}

export enum KeyUsages {
    sign = "sign",
    verify = "verify"
}

export enum KeyFormat {
    jwk = "jwk"
}

export function getStringFromArrayBuffer(data: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(data));
}

export function getArrayBufferFromString(dataString: string): ArrayBuffer {
    const data = new ArrayBuffer(dataString.length);
    const dataView = new Uint8Array(data);
    for (let i: number = 0; i < dataString.length; i++) {
        dataView[i] = dataString.charCodeAt(i);
    }
    return data;
}

export function getJwkString(key: JsonWebKey): string {
    return JSON.stringify(key, Object.keys(key).sort());
}

export function utf8Encode(input: string): string {
    input = input.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < input.length; n++) {
        var c = input.charCodeAt(n);

        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }

    return utftext;
}

export function isIE11(): boolean {
    return "msCrypto" in window;
}
