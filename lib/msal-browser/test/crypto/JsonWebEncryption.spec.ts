import { expect } from "chai";
import { JsonWebEncryption } from "../../src/crypto/JsonWebEncryption";
import { TEST_JWE_VALUES } from "../utils/StringConstants";

const testUnwrappingKey: JsonWebKey = {
    alg: "RSA-OAEP-256",
    d: "D_LzLRNiU_uWue-5vMMnKJRDbvF1UtmnugP_JkJE1rMOgJ7vn9r-sDKBnR7iKCAg6Cy-fuNG-oqU4hY4oo_ZSN4XBfK2ryxEalOuuTntGOYjZczR__070UyKYJA_tjR-KRSrE6Ii8HruQ4lL9-R_TVWbr1rdewyB6miLJhglr0xYF8dDF7H7bL8-Ya24mLiKZ3zgw8eTDR3Hb5w1ukO1gjqCGwXxvNeLwXWVa4yLod8W3j3kCka3oVXTo7kOTf6DGL_h_tKIRrjNGuVXKgje4F5Z5k5VPOWkUGwQrX6HWt_Uvo7YozHF4c8F17H7Uxt1VM4QdmOFGbld9BxtpX-1qQ",
    dp: "a9JvyiXYyEWkBAJAT0MRMiLpHTaQi-2y05LAyTFF2vzHroisptUL9uzRNfyFnCa4eDmApGJISscho8msDfn6xRP9-TQNlbI6E_bi48POqlNJ30WmFAbe1r9ZN1dUv4uMcxXNeHaUUy3mpXxDULHl-T4M77MM7Ss5PDgP0x26skE",
    dq: "cih4fwOzdBJfxe5w_2CZtOlSzASIwVm08EKRBmLxBtnaoa3ldQtPLKMhW0SQICpBEoCop2GMAeY5LFwyP6uxteZnQREn10jPtqGm3zjH5kZIPL6qT3Dtr9WjKQh1127k68g5JoXKROpbJpUwaIRIu8x5HzxxKjo7_6VrG0n2Vrs",
    e: "AQAB",
    ext:true,
    key_ops:["decrypt"],
    kty: "RSA",
    n: "uzhn0D8RKoCbDgGLR4bCf4my1osht2m3_rQS_rw7p2gBRORckZE-L6aTuQqmlguxsjdr99PiAOWbnIxvvCi1-r54abnfh9DX_0VVMQwTBWvoJ0K1KIuRs3DsGrcmxFqfjPIdFb6MKBHqvtJx3OXH3hwzZmqCljco_TlXp77gv5V6rs9lwMvWyiHr_Q0A3D5AiIWOVaBrZkueFmrNaZDUQPjmNnoTnkOqcj-37ivNb-Qpimf9EUvmySEHciiA3dRYS9nwIu0ZwVjjNKz0aZdc56VIsUIOutlskNfpqAWimVXUpllr04EjxmlRqXEFd_wucbT0bcMynpS3d3Q0WUXK0w",
    p: "9Tj14KLsFU624cd3ISY9mCE4Jc6oCRTiTajnqFDe_VKb47d20878RLuzjUUvRMPFtj7DkgHRfjfUmeZFSq3G2Zw-F3i9a-KTB_f1bxLI1PKtAtavEHYlgTEuZevsTZzj_FMEP7dWFVdc_eTJY9S0nvOwPNZSce3c0IkiElCTZwU",
    q: "w3LaWey3Nz8LVnecGOpz4cPSXzBWZDZR25NEFLR8HBS97b753DnIlcRs8imbaGsQzEgrH3C-mM2TLlXLXdlCrkUXkhwbov3EKvHFmFngmfdjvbsELjh3J2SY0cByELzWX5NRLJETZHlemrdpRQ44RW1Dhi_EOr24JWhGCesa4fc",
    qi: "Cmp8ZlwOmH2QJeN9MlpPJ5dkqWAOxkRVJw1e8LEqlvIvn9KeZr_ZQ3Og-8mzYkHm5Vnu67ZsuQRwVDtsILYL3fQE6Mngk9-XF_e1J_fmSIDZSB4-CAUr7NPuQM5-IycjnHk_LDrdzQojNIIsrf76LGI7GNfTl8a1f9Me7aqVmN0"
}

describe.only("JsonWebEncryption.ts Unit Tests",
 () => {
    describe("unwrap",
     () => {
        it("unwraps content encryption key from session key JWE",
         async () => {
            const sessionKeyJwe = new JsonWebEncryption(TEST_JWE_VALUES.SESSION_KEY_JWE);
            const unwrappingKey = await window.crypto.subtle.importKey("jwk", testUnwrappingKey, {
                name: "RSA-OAEP",
                hash: {
                    name: "SHA-256"
                }
            } , false, ["decrypt"]);
            const sessionKey = await sessionKeyJwe.unwrap(unwrappingKey, ["decrypt"]);
            expect(sessionKey).to.not.be.null;
        });
    });
});