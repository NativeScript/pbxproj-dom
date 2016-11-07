import {parse} from "./parser";
import * as fs from "fs";

declare var describe, it;

describe("parser", () => {
    it("ast", () => {
        const pbxproj = fs.readFileSync("tests/proj1.pbxproj").toString();
        const ast = parse(pbxproj);
        // console.log("AST: " + ast);
    });
});
