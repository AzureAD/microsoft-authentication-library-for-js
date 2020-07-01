import { expect } from "chai";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { PkceGenerator } from "../../src/crypto/PkceGenerator";

describe("PkceVerifier.spec.ts Unit Tests", () => {
    it("bufferToCVString() evenly distributed encoding", async () => {
      // This only works with a very large number of tests as we are testing distribution from random numbers

      // Added here because they aren't exported from PkceGenerator
      const CV_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

      // Arrange
      const browserCrypto = new BrowserCrypto();
      const pkceGenerator = new PkceGenerator(browserCrypto);

      // We want to count the amount of times each character is encoded.
      const characterCounts = {};
      [...CV_CHARSET].forEach(char => characterCounts[char] = 0);
      let totalCharacters = 0;

      // Act
      for (let i = 0; i < 256; i++) {
        const buffer: Uint8Array = new Uint8Array(2);
        buffer[0] = i;

        for (let j = 0; j < 256; j++) {
          buffer[1] = j;
          const pkceCodeVerifierString = pkceGenerator['bufferToCVString'](buffer);
          totalCharacters += pkceCodeVerifierString.length;
          [...pkceCodeVerifierString].forEach(char => characterCounts[char]++);
        }
      }

      // Logging
      const expectedDistribution = Math.round(1 / CV_CHARSET.length * 10000) / 10000;
      console.log(`Expected distribution: ${expectedDistribution}`);
      [...CV_CHARSET].forEach(char => {
        const distribution = Math.round(characterCounts[char] / totalCharacters * 10000) / 10000;
        console.log(`${char}: ${distribution}`);
      });
      
      // Assert
      [...CV_CHARSET].forEach(char => {
        const distribution = Math.round(characterCounts[char] / totalCharacters * 10000) / 10000;
        expect(distribution).to.equal(expectedDistribution);
      });
    });
});
