/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as crypto from "crypto";
import {
    buildCertReqInfoDer,
    hashCertReqInfo,
    buildFullCsr,
    type CsrOptions,
} from "../src/internal/CsrBuilder";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a fresh RSA-2048 SubjectPublicKeyInfo DER for testing. */
function makePubKeyDer(): Buffer {
    const { publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    return publicKey.export({ type: "spki", format: "der" }) as Buffer;
}

/** Parse tag and length from a DER buffer at given offset, return {tag, len, valueOffset}. */
function parseTlv(buf: Buffer, offset = 0): { tag: number; len: number; valueOffset: number } {
    const tag = buf[offset];
    let len = buf[offset + 1];
    let valueOffset = offset + 2;
    if (len & 0x80) {
        const numLenBytes = len & 0x7f;
        len = 0;
        for (let i = 0; i < numLenBytes; i++) {
            len = (len << 8) | buf[valueOffset++];
        }
    }
    return { tag, len, valueOffset };
}

/** Extract the UTF8String content from a DER-encoded attribute in CertReqInfo. */
function extractUtf8StringFromAttributes(der: Buffer): string | undefined {
    // CertReqInfo is SEQUENCE { version, subject, spki, [0] EXPLICIT attributes }
    // We walk through the outer SEQUENCE to find the [0] context tag
    const outer = parseTlv(der, 0);
    let offset = outer.valueOffset;

    // Skip version (INTEGER), subject (SEQUENCE), spki (SEQUENCE)
    for (let i = 0; i < 3; i++) {
        const item = parseTlv(der, offset);
        offset = item.valueOffset + item.len;
    }

    // Now at [0] EXPLICIT context tag (0xa0)
    if ((der[offset] & 0xe0) !== 0xa0) return undefined;
    const ctxItem = parseTlv(der, offset);
    let attrOffset = ctxItem.valueOffset;

    // Inside [0]: SEQUENCE { OID, SET { UTF8String } }
    const attrSeq = parseTlv(der, attrOffset);
    let seqOffset = attrSeq.valueOffset;

    // Skip OID
    const oid = parseTlv(der, seqOffset);
    seqOffset = oid.valueOffset + oid.len;

    // SET
    const setItem = parseTlv(der, seqOffset);
    let setOffset = setItem.valueOffset;

    // UTF8String (tag 0x0c)
    if (der[setOffset] !== 0x0c) return undefined;
    const utf8 = parseTlv(der, setOffset);
    return der.slice(utf8.valueOffset, utf8.valueOffset + utf8.len).toString("utf8");
}

// ── buildCertReqInfoDer ───────────────────────────────────────────────────────

describe("buildCertReqInfoDer", () => {
    const pubKeyDer = makePubKeyDer();

    const baseOpts: CsrOptions = {
        clientId: "test-client-id",
        tenantId: "test-tenant-id",
        cuId: "test-cu-id",
        pubKeyDer,
    };

    it("returns a Buffer", () => {
        const result = buildCertReqInfoDer(baseOpts);
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
    });

    it("starts with SEQUENCE tag (0x30)", () => {
        const result = buildCertReqInfoDer(baseOpts);
        expect(result[0]).toBe(0x30);
    });

    it("encodes vmId in cuId JSON attribute when vmssId is absent", () => {
        const result = buildCertReqInfoDer(baseOpts);
        const json = extractUtf8StringFromAttributes(result);
        expect(json).toBeDefined();
        const parsed = JSON.parse(json!);
        expect(parsed).toEqual({ vmId: "test-cu-id" });
        expect(parsed.vmssId).toBeUndefined();
    });

    it("omits vmssId from cuId JSON when vmssId is empty string", () => {
        const result = buildCertReqInfoDer({ ...baseOpts, vmssId: "" });
        const json = extractUtf8StringFromAttributes(result);
        const parsed = JSON.parse(json!);
        expect(parsed).toEqual({ vmId: "test-cu-id" });
        expect(parsed.vmssId).toBeUndefined();
    });

    it("includes vmssId in cuId JSON when vmssId is non-empty", () => {
        const result = buildCertReqInfoDer({ ...baseOpts, vmssId: "test-vmss-id" });
        const json = extractUtf8StringFromAttributes(result);
        const parsed = JSON.parse(json!);
        expect(parsed).toEqual({ vmId: "test-cu-id", vmssId: "test-vmss-id" });
    });

    it("produces deterministic output for same inputs", () => {
        const r1 = buildCertReqInfoDer(baseOpts);
        const r2 = buildCertReqInfoDer(baseOpts);
        expect(r1).toEqual(r2);
    });

    it("produces different output when clientId differs", () => {
        const r1 = buildCertReqInfoDer(baseOpts);
        const r2 = buildCertReqInfoDer({ ...baseOpts, clientId: "other-client" });
        expect(r1).not.toEqual(r2);
    });

    it("produces different output when tenantId differs", () => {
        const r1 = buildCertReqInfoDer(baseOpts);
        const r2 = buildCertReqInfoDer({ ...baseOpts, tenantId: "other-tenant" });
        expect(r1).not.toEqual(r2);
    });

    it("produces different output when cuId differs", () => {
        const r1 = buildCertReqInfoDer(baseOpts);
        const r2 = buildCertReqInfoDer({ ...baseOpts, cuId: "other-cu-id" });
        expect(r1).not.toEqual(r2);
    });
});

// ── hashCertReqInfo ───────────────────────────────────────────────────────────

describe("hashCertReqInfo", () => {
    it("returns a 32-byte Buffer (SHA-256 digest)", () => {
        const der = Buffer.from("test-der-content");
        const hash = hashCertReqInfo(der);
        expect(hash).toBeInstanceOf(Buffer);
        expect(hash.length).toBe(32);
    });

    it("returns consistent hash for same input", () => {
        const der = Buffer.from("consistent-test-der");
        expect(hashCertReqInfo(der)).toEqual(hashCertReqInfo(der));
    });

    it("returns different hashes for different inputs", () => {
        expect(hashCertReqInfo(Buffer.from("a"))).not.toEqual(
            hashCertReqInfo(Buffer.from("b"))
        );
    });

    it("matches Node.js crypto SHA-256 output", () => {
        const der = Buffer.from("verification-test");
        const expected = crypto.createHash("sha256").update(der).digest();
        expect(hashCertReqInfo(der)).toEqual(expected);
    });
});

// ── buildFullCsr ──────────────────────────────────────────────────────────────

describe("buildFullCsr", () => {
    const pubKeyDer = makePubKeyDer();
    const certReqInfoDer = buildCertReqInfoDer({
        clientId: "csr-client-id",
        tenantId: "csr-tenant-id",
        cuId: "csr-cu-id",
        pubKeyDer,
    });
    // Use a dummy 256-byte signature (mocked — not cryptographically valid)
    const mockSignature = Buffer.alloc(256, 0xaa);

    it("returns a base64 string (no PEM headers)", () => {
        const result = buildFullCsr(certReqInfoDer, mockSignature);
        expect(typeof result).toBe("string");
        expect(result).not.toContain("-----BEGIN");
        expect(result).not.toContain("-----END");
        expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/); // valid base64
    });

    it("decodes to a Buffer starting with SEQUENCE tag (0x30)", () => {
        const result = buildFullCsr(certReqInfoDer, mockSignature);
        const der = Buffer.from(result, "base64");
        expect(der[0]).toBe(0x30);
    });

    it("outer SEQUENCE contains 3 items: certReqInfo, algId, bitString", () => {
        const result = buildFullCsr(certReqInfoDer, mockSignature);
        const der = Buffer.from(result, "base64");
        // Parse outer SEQUENCE
        const outer = parseTlv(der, 0);
        let offset = outer.valueOffset;

        // Item 1: CertReqInfo (SEQUENCE, 0x30)
        const item1 = parseTlv(der, offset);
        expect(item1.tag).toBe(0x30);
        offset = item1.valueOffset + item1.len;

        // Item 2: AlgId (SEQUENCE, 0x30)
        const item2 = parseTlv(der, offset);
        expect(item2.tag).toBe(0x30);
        offset = item2.valueOffset + item2.len;

        // Item 3: Signature (BIT STRING, 0x03)
        const item3 = parseTlv(der, offset);
        expect(item3.tag).toBe(0x03);
    });

    it("produces different output for different signatures", () => {
        const sig1 = Buffer.alloc(256, 0x01);
        const sig2 = Buffer.alloc(256, 0x02);
        expect(buildFullCsr(certReqInfoDer, sig1)).not.toBe(
            buildFullCsr(certReqInfoDer, sig2)
        );
    });
});

// ── End-to-end: buildCertReqInfoDer → hashCertReqInfo → buildFullCsr ─────────

describe("CsrBuilder end-to-end structure", () => {
    it("produces a parseable PKCS#10 base64 structure from start to finish", () => {
        const pubKeyDer = makePubKeyDer();
        const opts: CsrOptions = {
            clientId: "e2e-client",
            tenantId: "e2e-tenant",
            cuId: "e2e-cu-id",
            vmssId: "e2e-vmss",
            pubKeyDer,
        };

        const certReqInfoDer = buildCertReqInfoDer(opts);
        const hash = hashCertReqInfo(certReqInfoDer);
        expect(hash).toHaveLength(32);

        const mockSig = Buffer.alloc(256, 0xff);
        const csrBase64 = buildFullCsr(certReqInfoDer, mockSig);

        const der = Buffer.from(csrBase64, "base64");
        expect(der[0]).toBe(0x30); // SEQUENCE

        // Verify vmssId is included when non-empty
        const json = extractUtf8StringFromAttributes(certReqInfoDer);
        const parsed = JSON.parse(json!);
        expect(parsed.vmId).toBe("e2e-cu-id");
        expect(parsed.vmssId).toBe("e2e-vmss");
    });
});
