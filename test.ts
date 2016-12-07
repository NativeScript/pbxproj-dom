import {parse} from "./parser";
import {assert} from "chai";

import * as fs from "fs";

declare var describe, it, console;

describe("parser", () => {
    describe("roundtrips", () => {
        [
            "tests/simple.pbxproj",
            "tests/proj0.pbxproj",
            "tests/proj1.pbxproj",
            "tests/signing-style/expected-manual.pbxproj"
        ].forEach(f => it(f, () => {
            const src = fs.readFileSync(f).toString();
            const ast = parse(src);
            const out = ast.toString();
            assert.equal(out, src, "Expect parse and toString to roundtrip");
        }));
    });
});

describe("dom", () => {
    it("set signing style to manual", () => {
        const expected = fs.readFileSync("tests/signing-style/expected-manual.pbxproj").toString();
        const expectedAst = parse(expected);
        // console.log(expectedAst);
    });
});