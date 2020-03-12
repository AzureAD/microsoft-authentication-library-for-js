/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class Base64Encode {
    /**
     * 'utf8': Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
     * 'base64': Base64 encoding.
     *
     * @param str text
     */
    static encode(str: string): string {
        return Buffer.from(str, 'utf8').toString('base64');
    }

    /**
     * @param str Url
     */
    static encodeUrl(str: string): string {
        return Base64Encode.encode(str)
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
}
