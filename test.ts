import * as ast from "./parser";
import { Xcode } from "./xcode";

import {assert} from "chai";

import * as fs from "fs";

describe("parser", () => {
    describe("roundtrips", () => {
        [
            "tests/simple.pbxproj",
            "tests/proj0.pbxproj",
            "tests/proj1.pbxproj",
            "tests/signing-style/manual.pbxproj",
            "tests/signing-style/automatic.pbxproj"
        ].forEach(f => it(f, () => {
            const str = fs.readFileSync(f).toString();
            const parsed = ast.parse(str);
            const out = parsed.toString();
            assert.equal(out, str, "Expect parse and toString to roundtrip");
        }));
    });
});

describe("dom", () => {
    it("can set signing style from automatic to manual", () => {
        const xcode = Xcode.open("tests/signing-style/automatic.pbxproj");
        xcode.setManualSigningStyle("SampleProvProfApp");
        const expected = fs.readFileSync("tests/signing-style/manual.pbxproj").toString();
        console.log(xcode.toString());
        assert.equal(xcode.toString(), expected);
    });
    // it("can set signing style from manual to automatic", () => {
    //     const xcode = Xcode.open("tests/signing-style/manual.pbxproj");
    //     xcode.setAutomaticSigningStyle("SampleProvProfApp", "W7TGC3P93K");
    //     const expected = fs.readFileSync("tests/signing-style/automatic.pbxproj").toString();
    //     console.log(xcode.toString());
    //     assert.equal(xcode.toString(), expected);
    // })
});