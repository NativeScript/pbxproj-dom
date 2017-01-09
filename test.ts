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
        assert.equal(xcode.toString(), expected);
    });
    it("can set signing style from manual to automatic", () => {
        const xcode = Xcode.open("tests/signing-style/manual.pbxproj");
        xcode.setAutomaticSigningStyle("SampleProvProfApp", "W7TGC3P93K");
        const expected = fs.readFileSync("tests/signing-style/automatic.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });
    it("can upgrade signing style from none to manual", () => {
        const xcode = Xcode.open("tests/signing-style/none.pbxproj");
        xcode.setManualSigningStyle("SampleProvProfApp");
        const expected = fs.readFileSync("tests/signing-style/manual.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });
    it("can upgrade signing style from none to manual with specific provisioning profile for all targets", () => {
        const xcode = Xcode.open("tests/signing-style/none.pbxproj");
        xcode.setManualSigningStyle("SampleProvProfApp", {
            uuid: "a62743b2-2513-4488-8d83-bad5f3b6716d",
            name: "NativeScriptDevProfile",
            team: "W7TGC3P93K"
        });
        const expected = fs.readFileSync("tests/signing-style/manual-with-provisioning.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });
    it("can upgrade signing style from automatic to manual with specific provisioning profile for all targets", () => {
        const xcode = Xcode.open("tests/signing-style/automatic.pbxproj");
        xcode.setManualSigningStyle("SampleProvProfApp", {
            uuid: "a62743b2-2513-4488-8d83-bad5f3b6716d",
            name: "NativeScriptDevProfile",
            team: "W7TGC3P93K"
        });
        const expected = fs.readFileSync("tests/signing-style/manual-with-provisioning.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });
    it("can upgrade signing style from none to automatic", () => {
        const xcode = Xcode.open("tests/signing-style/none.pbxproj");
        xcode.setAutomaticSigningStyle("SampleProvProfApp", "W7TGC3P93K");
        const expected = fs.readFileSync("tests/signing-style/automatic.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });
    it("can upgrade signing style from manual with specific provisioning profile to automatic", () => {
        const xcode = Xcode.open("tests/signing-style/manual-with-provisioning.pbxproj");
        xcode.setAutomaticSigningStyle("SampleProvProfApp", "W7TGC3P93K");
        const expected = fs.readFileSync("tests/signing-style/automatic.pbxproj").toString();
        assert.equal(xcode.toString(), expected);
    });

    it("can read signing style of autmatically signed target", () => {
        const xcode = Xcode.open("tests/signing-style/automatic.pbxproj");
        const signing = xcode.getSigning("SampleProvProfApp");
        assert.deepEqual(signing, { style: "Automatic", team: "W7TGC3P93K" });
    });
    it("can read signing style of manually signed target", () => {
        const xcode = Xcode.open("tests/signing-style/manual-with-provisioning.pbxproj");
        const signing = xcode.getSigning("SampleProvProfApp");
        assert.deepEqual(signing, {
            style: "Manual",
            configurations: {
                "Debug": {
                    uuid: 'a62743b2-2513-4488-8d83-bad5f3b6716d',
                    name: 'NativeScriptDevProfile',
                    identity: undefined,
                    team: 'W7TGC3P93K'
                },
                "Release": {
                    uuid: 'a62743b2-2513-4488-8d83-bad5f3b6716d',
                    name: 'NativeScriptDevProfile',
                    identity: undefined,
                    team: 'W7TGC3P93K'
                }
            }
        });
    });
});
