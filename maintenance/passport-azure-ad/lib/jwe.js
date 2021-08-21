/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

const crypto = require("crypto");
const constants = require("constants");
const base64url = require("base64url");

const jose = require("node-jose");

/**
 * utility functions
 */

/**
 * Create a buffer depends on the version of node
 *
 * @param{Buffer/String/Number}  data: buffer, string, or size
 * @param{String}  encoding: ignored if data is a buffer
 * @return{Buffer} 
 */
const createBuffer = (data, encoding) => {
  if (!Buffer.isBuffer(data) && typeof data !== "string" && typeof data !== "number")
    throw new Error("in createBuffer, data must be a buffer, string or number");

  if (process.version >= "v6") {
    if (typeof data === "string")
      return Buffer.from(data, encoding);
    else if (typeof data === "number")
      return Buffer.alloc(data);
    else
      return Buffer.from(data);
  } else {
    if (typeof data === "string")
      return new Buffer(data, encoding); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed
    else
      return new Buffer(data); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed
  } 
};

/**
 * xor of two number in buffer format
 *
 * @param{Buffer}  a: first number
 * @param{Buffer}  b: second number
 * @return{Buffer}  a^b
 */
const xor = (a, b) => {
  let c1, c2;
  if (a.length > b.length) {
    c1 = a; c2 = b;
  } else {
    c2 = a; c1 = b;
  }
  const c = createBuffer(c1);
  for (let i = 1; i <= c2.length; i++)
    c[c1.length-i] = c[c1.length-i] ^ c2[c2.length-i];
  return c;
};

/**
 * AES key unwrap algorithms
 */

/**
 * Unwrap wrapped_cek using AES with kek
 *
 * @param{String}  algorithm: algorithm
 * @param{Buffer}  wrapped_cek: wrapped key
 * @param{Buffer}  kek: key encryption key
 * @return{Buffer}  cek, the unwrapped key
 */
const AESKeyUnWrap = (algorithm, wrapped_cek, kek) => {

  /**
   * Inputs: CipherText, (n+1) 64-bit values {C0, C1, ..., Cn}, and 
   *         Key, K (the KEK)
   * Outputs: Plaintext, n 64-bit values {P0, P1, K, Pn}
   */
  const C = wrapped_cek;
  const n = C.length/8-1;
  const K = kek;

  /**
   * 1) Initialize variables
   *    Set A = C[0]
   *    For i = 1 to b
   *      R[i] = C[i]
   */
  let A = C.slice(0,8);
  const R = [createBuffer(1)];
  for (let i = 1; i <= n; i++)
    R.push(C.slice(8*i, 8*i+8));

  /**
   * 2) compute intermediate values
   *    For j = 5 to 0
   *      For i = n to 1
   *        B = AES-1(K, (A^t) | R[i]) where t = n*j+i
   *        A = MSB(64, B)
   *        R[i] = LSB(64, B)
   */
  for(let j=5; j >= 0; j--) {
    for(let i=n; i >= 1; i--) {
      // turn t = n*j+i into buffer
      let str = (n*j+i).toString(16);
      if (str.length %2 !== 0)
        str = "0" + str;
      const t = createBuffer(str, "hex");

      // B = AES-1(K, (A^t) | R[i])
      const aes = crypto.createDecipheriv(algorithm, K, "");
      aes.setAutoPadding(false);
      let B = aes.update(Buffer.concat([xor(A, t), R[i]]), null, "hex");
      B += aes.final("hex");
      B = createBuffer(B, "hex");

      // A = MSB(64, B)
      A = B.slice(0, 8);

      // R[i] = LSB(64, B)
      R[i] = B.slice(B.length-8);
    }
  }

  /**
   * 3) Output results.
   *    If A is an appropriate initial value
   *    Then
   *      For i = 1 to n
   *        P[i] = R[i]
   *    Else
   *      Return an error
   */
  
  // check A
  if (A.toString("hex").toUpperCase() === "A6A6A6A6A6A6A6A6") {
    let result = R[1];
    for (let i = 2; i <= n; i++)
      result = Buffer.concat([result, R[i]]);
    
    return result;
  } else {
    throw new Error("aes decryption failed: invalid key");
  }
};

/**
 * AES-CBC-HMAC-SHA2 decryption
 */

/**
 * decrypt ciperText using aes-cbc-hmac-sha2 algorithm
 *
 * @param{String}  algorithm: algorithm
 * @param{Buffer}  key: encryption key
 * @param{Buffer}  cipherText: encrypted content
 * @param{Buffer}  iv: intialization vector
 * @param{Buffer}  aad: additional authentication data
 * @param{Buffer}  authTag: authentication tag
 * @return{Buffer}  decrypted content
 */
const decrypt_AES_CBC_HMAC_SHA2 = (algorithm, key, cipherText, iv, aad, authTag) => {
  /*
   * algorithm information
   * note ENC_KEY_LEN = MAC_KEY_LEN = T_LEN = len
   */
  const algInfo = {
    "aes-128-cbc-hmac-sha-256": {
        "cipher_algo": "aes-128-cbc", 
        "hash_algo": "sha256", 
        "len": 16
      },
    "aes-192-cbc-hmac-sha-384": {
        "cipher_algo": "aes-192-cbc", 
        "hash_algo": "sha384", 
        "len": 24
      },
    "aes-256-cbc-hmac-sha-512": {
        "cipher_algo": "aes-256-cbc", 
        "hash_algo": "sha512", 
        "len": 32
      }
  };

  // 1. Verify input

  // check if we have a supported algorithm
  if (!algorithm)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: algorithm is not provided");
  if (!algInfo[algorithm])
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: unsupported algorithm: " + algorithm);

  const algo = algInfo[algorithm];

  // check the size of key
  if (!key)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: key is not provided");
  if (!(key instanceof Buffer))
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: key must be a buffer");
  if (key.length !== algInfo[algorithm].len * 2)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: key has size " + key.length + ", it must have size " + algo.len * 2);
  
  // check the size of iv
  if (!iv)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: iv is not provided");
  if (!(iv instanceof Buffer))
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: iv must be a buffer");
  if (iv.length !== 16)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: iv has size " + iv.length + ", it must have size 16");

  // check the existence of aad
  if (!aad)
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: aad is not provided");
  if (!(aad instanceof Buffer))
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: aad must be a buffer");

  // 2. Split key

  // first half is mac_key and the second half is enc_key
  const mac_key = key.slice(0, algo.len);
  const enc_key = key.slice(algo.len);

  // 3. Verify tag

  /*
   * tag should be: hash(aad + iv + cipherText + aad_len) where aad_len is the
   * number of bits in aad expressed as a 64-bit unsigned big-endian integer
   */

  // 3.1 compute aad_len
  const aad_len = createBuffer(8);
  aad_len.writeUInt32BE(aad.length * 8, 4);
  aad_len.writeUInt32BE(0, 0);

  // 3.2 create hmac algorithm
  const hmac = crypto.createHmac(algo.hash_algo, mac_key);
  hmac.write(aad);
  hmac.write(iv);
  hmac.update(cipherText);
  hmac.update(aad_len);
  const computed_authTag = hmac.digest().slice(0, algo.len);

  // 3.3 verify the tag
  if (!authTag || !computed_authTag || (authTag.toString("hex") !== computed_authTag.toString("hex")))
    throw new Error("In decrypt_AES_CBC_HMAC_SHA2: invalid authentication tag");

  // 4. Decrypt cipherText
  const decipher = crypto.createDecipheriv(algo.cipher_algo, enc_key, iv);
  let plainText = decipher.update(cipherText);
  plainText = Buffer.concat([plainText, decipher.final()]);
  
  return plainText;
};

/**
 * JWE decryption
 */

/**
 * decrypt cek helper function
 *
 * @param{String}  alg: algorithm
 * @param{Buffer}  encrypted_cek: encrypted cek
 * @param{Buffer}  key: encryption key
 * @return{Function}  log: logging function
 */
const decryptCEKHelper = (alg, encrypted_cek, key, log) => {
  let error = null;
  let cek = null;

  try {
    let key_to_use;

    if (alg === "RSA1_5" || alg === "RSA-OAEP") {
      if (key["privatePemKey"]) {
        log.info("using RSA privatePemKey to decrypt cek");
        key_to_use = key["privatePemKey"];
      } else {
        log.info("converting jwk to RSA privatePemKey to decrypt cek");
        return { "error": "converting jwk to RSA privatePemKey to decrypt cek", cek: key };
      }
    } else if (alg === "A128KW" || alg === "A256KW") {
      log.info("using symmetric key to decrypt cek");
      key_to_use = base64url.toBuffer(key.k);
    } else {
      log.info("unsupported alg: " + alg);
      return {"error": error, "cek": null};
    }

    if (alg === "RSA1_5")
      cek = crypto.privateDecrypt({ key: key_to_use, padding: constants.RSA_PKCS1_PADDING }, encrypted_cek);
    else if (alg === "RSA-OAEP")
      cek = crypto.privateDecrypt({ key: key_to_use, padding: constants.RSA_PKCS1_OAEP_PADDING }, encrypted_cek);
    else if (alg === "A128KW")
      cek = AESKeyUnWrap("aes-128-ecb", encrypted_cek, key_to_use);
    else if (alg === "A256KW")
      cek = AESKeyUnWrap("aes-256-ecb", encrypted_cek, key_to_use);
    else
      cek = key_to_use;  // dir 
  } catch (ex) {
    error = ex;
  }

  return {"error": error, "cek": cek};
};

/**
 * decrypt cek function (except header.alg == dir)
 *
 * @param{Object}  header: header
 * @param{Buffer}  encrypted_cek: encrypted cek
 * @param{Object}  jweKeyStore: list of keys
 * @return{Function}  log: logging function
 */
const decryptCEK = (header, encrypted_cek, jweKeyStore, log) => {
  const algKtyMapper = { "RSA1_5": "RSA", "RSA-OAEP": "RSA", "A128KW": "oct", "A256KW": "oct"};

  if (!header.alg)
    return { "error": new Error("alg is missing in JWE header"), "cek": null };
  if(["RSA1_5", "RSA-OAEP", "dir", "A128KW", "A256KW"].indexOf(header.alg) === -1)
    return { "error" : new Error("Unsupported alg in JWE header: " + header.alg), "cek": null };

  let key = null;

  if (header.kid) {
    for (let i = 0; i < jweKeyStore.length; i++) {
      if (header.kid === jweKeyStore[i].kid && algKtyMapper[header.alg] === jweKeyStore[i].kty) {
        key = jweKeyStore[i];
        log.info("found a key matching kid: " + header.kid);
        return decryptCEKHelper(header.alg, encrypted_cek, key, log);
      }
    }

    return { "error": new Error("cannot find a key matching kid: " + header.kid), "cek": null };
  }

  log.info("kid is not provided in JWE header, now we try all the possible keys");

  // kid matching failed, now we try every possible key
  for(let i = 0; i < jweKeyStore.length; i++) {
    if (jweKeyStore[i].kty === algKtyMapper[header.alg]) {
      const result = decryptCEKHelper(header.alg, encrypted_cek, jweKeyStore[i], log);
      if (result.cek) {
        return result;
      }
    }
  }

  return { "error": new Error("tried all keys to decrypt cek but none of them works"), "cek": null };
};

/**
 * decrypt content function with provided cek
 *
 * @param{Object}  header: header
 * @param{Buffer}  cek: cek
 * @param{Buffer}  cipherText: encrypted content
 * @param{Buffer}  iv: initialization vector
 * @param{Buffer}  authTag: authentication tag
 * @param{Buffer}  aad: additional authentication information
 * @return{Function}  log: logging function
 */
const decryptContent = (header, cek, cipherText, iv, authTag, aad) => {
  if (!header.enc)
    return { "error": new Error("enc is missing in JWE header"), "content": null };
  if (["A128GCM", "A256GCM", "A128CBC-HS256", "A192CBC-HS384", "A256CBC-HS512"].indexOf(header.enc) === -1)
    return { "error" : new Error("Unsupported enc in JWE header: " + header.enc), "content": null };

  const mapper = { 
    "A128GCM": "aes-128-gcm", 
    "A256GCM": "aes-256-gcm", 
    "A128CBC-HS256": "aes-128-cbc-hmac-sha-256",
    "A192CBC-HS384": "aes-192-cbc-hmac-sha-384",
    "A256CBC-HS512": "aes-256-cbc-hmac-sha-512"
  };

  try {
    let content = null;

    if (header.enc === "A128GCM" || header.enc === "A256GCM") {
      const decipher = crypto.createDecipheriv(mapper[header.enc], cek, iv);
      decipher.setAAD(aad);
      decipher.setAuthTag(authTag);
      content = decipher.update(cipherText);
      content = Buffer.concat([content, decipher.final()]);
    } else {
      content = decrypt_AES_CBC_HMAC_SHA2(mapper[header.enc], cek, cipherText, iv, aad, authTag);    
    }

    return { "error": null, "content": content.toString() };
  } catch (ex) {
    return { "error": ex, "content": null };
  }
};

/**
 * decrypt content function for the case where alg is dir
 *
 * @param{Object}  header: header
 * @param{Buffer}  jweKeyStore: list of keys
 * @param{Buffer}  cipherText: encrypted content
 * @param{Buffer}  iv: initialization vector
 * @param{Buffer}  authTag: authentication tag
 * @param{Buffer}  aad: additional authentication information
 * @return{Function}  log: logging function
 */
const decryptContentForDir = (header, jweKeyStore, cipherText, iv, authTag, aad, log) => {
  let key = null;

  // try the key with the corresponding kid
  if (header.kid) {
    for (let i = 0; i < jweKeyStore.length; i++) {
      if (header.kid === jweKeyStore[i].kid && jweKeyStore[i].kty === "oct") {
        key = jweKeyStore[i];
        log.info("Decrypting JWE content, header.alg == dir, found a key matching kid: " + header.kid);
        break;
      }
    }

    if (key)
      return decryptContent(header, base64url.toBuffer(key.k), cipherText, iv, authTag, aad, log);
    else
      return { "error": new Error("cannot find a key matching kid: " + header.kid), "cek": null };
  }

  log.info("In decryptContentForDir: kid is not provided in JWE header, now we try all the possible keys");

  // kid matching failed, now we try every possible key
  for(let i = 0; i < jweKeyStore.length; i++) {
    if (jweKeyStore[i].kty === "oct") {
      const result = decryptContent(header, base64url.toBuffer(jweKeyStore[i].k), cipherText, iv, authTag, aad, log);
      if (!result.error)
        return result;
    }
  }

  log.info("In decryptContentForDir: tried all keys to decrypt the content but all failed");
  return { error: new Error("In decryptContentForDir: tried all keys to decrypt the content but all failed"), content_result: null };
};

/**
 * The main decryption function
 *
 * @param{String}  jweString:  JWE id_token
 * @param{Object}  jweKeyStore: list of keys
 * @return{Function}  log: logging function
 * @return{Function}  callback: callback function
 */
exports.decrypt = (jweString, jweKeyStore, log, callback) => {
  /**
   * JWE compact format structure
   *
   * BASE64URL(UTF8(JWE Protected Header)) || '.' ||
   * BASE64URL(JWE Encrypted Key) || '.' || 
   * BASE64URL(JWE Initialization Vector) || '.' || 
   * BASE64URL(JWE Ciphertext) || '.' || 
   * BASE64URL(JWE Authentication Tag)
   */
  const parts = jweString.split(".");
  if (parts.length !== 5)
    return callback(new Error("In jwe.decrypt: invalid JWE string, it has " + parts.length + " parts instead of 5"), null);
  
  let header;
  try {
    header = JSON.parse(base64url.decode(parts[0], "binary"));
  } catch (ex) {
    return callback(new Error("In jwe.decrypt: failed to parse JWE header"), null);
  }

  const aad = createBuffer(parts[0]);
  const encrypted_cek = base64url.toBuffer(parts[1]);
  const iv = base64url.toBuffer(parts[2]);
  const cipherText = base64url.toBuffer(parts[3]);
  const authTag = base64url.toBuffer(parts[4]);

  log.info("In jwe.decrypt: the header is " + JSON.stringify(header));

  let cek_result;
  let content_result;

  // special treatment of 'dir'
  if (header.alg === "dir") {
    content_result = decryptContentForDir(header, jweKeyStore, cipherText, iv, authTag, aad, log);
  } else {
    /**
     *  cek decryption
     */
    cek_result = decryptCEK(header, encrypted_cek, jweKeyStore, log);
    if (cek_result.error) {
      if (cek_result.error === "converting jwk to RSA privatePemKey to decrypt cek") {
        jose.JWK.asKey(cek_result.cek, "pem").then((pemKey) => {
          let cek;
          if (header.alg === "RSA1_5")
            cek = crypto.privateDecrypt({ key: pemKey.toPEM(true), padding: constants.RSA_PKCS1_PADDING }, encrypted_cek);
          else if (header.alg === "RSA-OAEP")
            cek = crypto.privateDecrypt({ key: pemKey.toPEM(true), padding: constants.RSA_PKCS1_OAEP_PADDING }, encrypted_cek);
          const decryptedPemResult = decryptContent(header, cek, cipherText, iv, authTag, aad, log);
          if (!decryptedPemResult.error) {
            log.info("In jwe.decrypt: successfully decrypted id_token");
          }
          return callback(decryptedPemResult.error, decryptedPemResult.content);
        });
        return;
      }
      return callback(cek_result.error);
    }

    /**
     *  content decryption
     */
    content_result = decryptContent(header, cek_result.cek, cipherText, iv, authTag, aad, log);
  }

  if (!content_result.error) {
    log.info("In jwe.decrypt: successfully decrypted id_token");
  }
  
  return callback(content_result.error, content_result.content);
};

exports.createBuffer = createBuffer;

