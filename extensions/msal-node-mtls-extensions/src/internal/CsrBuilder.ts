/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * CsrBuilder.ts
 * Builds PKCS#10 CertificationRequest DER for IMDS /issuecredential.
 *
 * The CSR format must match MSAL.NET's Csr.Generate() exactly:
 *   - Subject: DC={tenantId}, CN={clientId}  (DC first — X.500 least-specific → most-specific)
 *   - SubjectPublicKeyInfo: RSA-2048 (from CNG key, passed in as DER Buffer)
 *   - Attributes [0]: OID 1.3.6.1.4.1.311.90.2.10 with SET { UTF8String(JSON) }
 *       (uses OtherRequestAttributes pattern — NOT extensionRequest wrapper)
 *   - Signature algorithm: RSASSA-PSS SHA-256, salt=32 (from cng_key addon)
 *
 * DER encoding is done manually to support RSASSA-PSS signing which Go/MSAL.NET use
 * but Node.js's built-in x509 APIs do not expose for CSR construction.
 */

import * as crypto from "crypto";

// ── DER primitives ────────────────────────────────────────────────────────────

function encodeLen(len: number): Buffer {
    if (len < 0x80) return Buffer.from([len]);
    if (len < 0x100) return Buffer.from([0x81, len]);
    if (len < 0x10000)
        return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
    throw new Error(`DER length too large: ${len}`);
}

function tlv(tag: number, content: Buffer): Buffer {
    return Buffer.concat([
        Buffer.from([tag]),
        encodeLen(content.length),
        content,
    ]);
}

const seq = (content: Buffer): Buffer => tlv(0x30, content);
const set = (content: Buffer): Buffer => tlv(0x31, content);
const oidBuf = (bytes: number[]): Buffer => tlv(0x06, Buffer.from(bytes));
const utf8Str = (s: string): Buffer => tlv(0x0c, Buffer.from(s, "utf8"));
/** PrintableString (0x13) — used by Windows CAPI for CN when chars are in the PrintableString set */
const printableStr = (s: string): Buffer => tlv(0x13, Buffer.from(s, "ascii"));
/** IA5String (0x16) — used by Windows CAPI for DC (domainComponent) */
const ia5Str = (s: string): Buffer => tlv(0x16, Buffer.from(s, "ascii"));
const intSmall = (n: number): Buffer => tlv(0x02, Buffer.from([n]));
const bitStr = (content: Buffer): Buffer =>
    tlv(0x03, Buffer.concat([Buffer.from([0x00]), content]));

/** Context-specific EXPLICIT tag [n] (constructed). */
function ctxExplicit(n: number, content: Buffer): Buffer {
    return Buffer.concat([
        Buffer.from([0xa0 | n]),
        encodeLen(content.length),
        content,
    ]);
}

// ── OID byte arrays ───────────────────────────────────────────────────────────

/** 2.5.4.3  id-at-commonName */
const OID_CN = [0x55, 0x04, 0x03];
/** 0.9.2342.19200300.100.1.25  domainComponent (DC) */
const OID_DC = [0x09, 0x92, 0x26, 0x89, 0x93, 0xf2, 0x2c, 0x64, 0x01, 0x19];
/** 1.3.6.1.4.1.311.90.2.10  Microsoft cuId attribute */
const OID_CUATTR = [
    0x2b, 0x06, 0x01, 0x04, 0x01, 0x82, 0x37, 0x5a, 0x02, 0x0a,
];
/** 2.16.840.1.101.3.4.2.1  sha-256 */
const OID_SHA256 = [
    0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01,
];
/** 1.2.840.113549.1.1.8  id-mgf1 */
const OID_MGF1 = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x08];
/** 1.2.840.113549.1.1.10  id-RSASSA-PSS */
const OID_RSA_PSS = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a];

// ── Algorithm Identifiers ─────────────────────────────────────────────────────

/** SHA-256 AlgorithmIdentifier: SEQUENCE { OID sha-256 } — no NULL per RFC 4055. */
function sha256AlgId(): Buffer {
    return seq(oidBuf(OID_SHA256));
}

/**
 * RSASSA-PSS AlgorithmIdentifier with SHA-256, MGF1(SHA-256), saltLength=32.
 * Matches MSAL.NET's Csr.Generate() signature algorithm encoding.
 */
function rsaPssAlgId(): Buffer {
    const sha256 = sha256AlgId();
    const mgf1OidEntry = oidBuf(OID_MGF1);

    const hashAlg = ctxExplicit(0, sha256); // [0] EXPLICIT HashAlgorithm
    const maskAlg = ctxExplicit(1, seq(Buffer.concat([mgf1OidEntry, sha256]))); // [1] EXPLICIT MaskGenAlgorithm
    const saltLen = ctxExplicit(2, intSmall(32)); // [2] EXPLICIT saltLength

    const params = seq(Buffer.concat([hashAlg, maskAlg, saltLen]));
    return seq(Buffer.concat([oidBuf(OID_RSA_PSS), params]));
}

// ── Subject Name ──────────────────────────────────────────────────────────────

function buildSubject(clientId: string, tenantId: string): Buffer {
    // X.500 DN encodes from least-specific (root) to most-specific (leaf).
    // MSAL.NET's X500DistinguishedName("CN=clientId, DC=tenantId") serializes
    // DC first, CN second in the DER — matching standard X.500 ordering.
    const dcRdn = set(seq(Buffer.concat([oidBuf(OID_DC), ia5Str(tenantId)])));
    const cnRdn = set(seq(Buffer.concat([oidBuf(OID_CN), printableStr(clientId)])));
    return seq(Buffer.concat([dcRdn, cnRdn]));
}

// ── CuId Attribute ────────────────────────────────────────────────────────────

function buildCuIdAttribute(vmId: string, vmssId = ""): Buffer {
    // MSAL.NET uses OtherRequestAttributes.Add() which places the OID directly
    // in the PKCS#10 attributes [0] field as: SEQUENCE { OID, SET { UTF8String(JSON) } }
    // Omit vmssId when empty — MSAL.NET/prototype only include it when non-empty.
    // IMDS validates the cuId JSON strictly; a blank vmssId field causes "CSR is invalid".
    const json = vmssId ? JSON.stringify({ vmId, vmssId }) : JSON.stringify({ vmId });
    return seq(Buffer.concat([oidBuf(OID_CUATTR), set(utf8Str(json))]));
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CsrOptions {
    clientId: string;
    tenantId: string;
    cuId: string;
    vmssId?: string;
    /** SubjectPublicKeyInfo DER from addon.getPublicKeyDer(handleId) */
    pubKeyDer: Buffer;
}

/**
 * Builds the DER-encoded CertificationRequestInfo that must be hashed (SHA-256)
 * and signed with the CNG key via addon.signHashPss().
 */
export function buildCertReqInfoDer(opts: CsrOptions): Buffer {
    const version = intSmall(0);
    const subject = buildSubject(opts.clientId, opts.tenantId);
    const spki = opts.pubKeyDer; // already DER-encoded by addon
    const attributes = ctxExplicit(
        0,
        buildCuIdAttribute(opts.cuId, opts.vmssId ?? "")
    );
    return seq(Buffer.concat([version, subject, spki, attributes]));
}

/**
 * Hashes a CertificationRequestInfo DER buffer with SHA-256.
 * Pass the returned hash to addon.signHashPss().
 */
export function hashCertReqInfo(certReqInfoDer: Buffer): Buffer {
    return crypto.createHash("sha256").update(certReqInfoDer).digest();
}

/**
 * Assembles the complete PKCS#10 CertificationRequest DER from the
 * already-signed CertificationRequestInfo, and returns it as base64
 * (no PEM headers), ready for IMDS /issuecredential request body.
 */
export function buildFullCsr(
    certReqInfoDer: Buffer,
    signature: Buffer
): string {
    const algId = rsaPssAlgId();
    const sig = bitStr(signature);
    return seq(Buffer.concat([certReqInfoDer, algId, sig])).toString("base64");
}
