import * as ast from "./parser";
import * as pbx from "./pbx";
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
    it("set signing style to manual", () => {
        const str = fs.readFileSync("tests/signing-style/automatic.pbxproj").toString();
        const parsed = ast.parse(str);
        const document = pbx.parse(parsed);

        const signTargetName = "SampleProvProfApp";
        
        document.targets
            .filter(target => target.name === signTargetName)
            .forEach(target => document.projects
                .filter(project => project.targets.indexOf(target) >= 0)
                .forEach(project => project.ast.patch({
                    attributes: {
                        TargetAttributes: {
                            [target.key]: {
                                DevelopmentTeam: undefined/* deletes "W7TGC3P93K" */,
                                ProvisioningStyle: "Manual"
                            }
                        }
                    }
                })));
    });
});