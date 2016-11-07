import {parse} from "./parser";
import {assert} from "chai";

import * as fs from "fs";

declare var describe, it;

describe("parser", () => {
    describe("proj0", () => {
        it("roundtrips", () => {
            const src = fs.readFileSync("tests/proj0.pbxproj").toString();
            const ast = parse(src);
            const out = ast.toString();
            // console.log("out: " + out);
            assert.equal(out, src, "Expect proj0 pbxproj to roundtrip");
        });
    });
    describe("proj1", () => {
        it("roundtrips", () => {
            const src = fs.readFileSync("tests/proj1.pbxproj").toString();
            const ast = parse(src);
            const out = ast.toString();
            // console.log("out: " + out);
            assert.equal(out, src, "Expect proj1 pbxproj to roundtrip");
        });
    });
});
