import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { root } from "../scripts/stage.mjs";

test("run and validation documents exist and local links resolve", () => {
    for (const name of ["README.md", "VALIDATION.md"]) {
        const text = fs.readFileSync(path.join(root, name), "utf8");
        assert.match(text, /HTTPS/);
        for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
            if (/^https?:/.test(match[1])) continue;
            assert.ok(fs.existsSync(path.resolve(root, match[1].split("#")[0])), `${name}: ${match[1]}`);
        }
    }
});