import * as ast from "./ast";

export function isProject(obj: DocumentObject): obj is PBXProject {
    return obj.isa === "PBXProject";
}
export function isTarget(obj: DocumentObject): obj is PBXNativeTarget {
    return obj.isa === "PBXNativeTarget";
}

export type ISA = "PBXProject" | "PBXNativeTarget" | "XCBuildConfiguration" | "XCConfigurationList";
const pbxConstructors: { [key: string]: typeof DocumentObject } = {}

function pbx(target: typeof DocumentObject): void {
    target.prototype.isa = <ISA>target.name;
    pbxConstructors[target.prototype.isa] = target;
}

export class DocumentObject {
    isa: ISA;

    constructor(protected document: Document, public ast: ast.KeyValuePair<ast.Dictionary>) {
    }

    get key() { return this.ast.key.json; }

    public patch(json: any) {
        this.ast.value.patch(json);
    }

    /**
     * Override and use the ast and the document to resolve any objects referenced by hash.
     */
    protected resolve() {
    }

    toString() {
        return this.ast.toString();
    }
}

@pbx export class PBXProject extends DocumentObject {
    get targets(): PBXNativeTarget[] {
        return this.ast.value.get("targets").items.map(key => this.document[key.text]);
    }
    get buildConfigurationsList(): XCConfigurationList {
        return this.document[this.ast.value.get("buildConfigurationList").text];
    }
}

@pbx export class PBXNativeTarget extends DocumentObject {
    get name() { return this.ast.value.get("name").text; }
    get buildConfigurationsList(): XCConfigurationList {
        return this.document[this.ast.value.get("buildConfigurationList").text];
    }
    get productType() { return this.ast.value.get("productType").text; }
}

@pbx export class XCBuildConfiguration extends DocumentObject {
    get name() {
        return this.ast.value.get("name").text;
    }
}

@pbx export class XCConfigurationList extends DocumentObject {
    get buildConfigurations(): XCBuildConfiguration[] {
        return this.ast.value.get("buildConfigurations").items.map(key => this.document[key.text]);
    }
}

export class Document {
    [id: string]: DocumentObject | any;

    private constructor(protected ast: ast.Document) {
    }

    get objects(): DocumentObject[] { return Object.keys(this).map(key => this[key]); }
    get targets(): PBXNativeTarget[] { return <any>this.objects.filter(isTarget); }
    get projects(): PBXProject[] { return <any>this.objects.filter(isProject); }

    static fromAST(fromAST: ast.Document): Document {
        const doc = new Document(fromAST);
        fromAST.get("objects").kvps.forEach(kvp => {
            if (ast.isKVPDictionary(kvp)) {
                const Ctor = pbxConstructors[kvp.value.get("isa").json];
                if (Ctor) {
                    const obj = new Ctor(doc, kvp);
                    doc[kvp.key.json] = obj;
                }
            }
        });
        return doc;
    }

    toString() {
        return this.ast.toString();
    }
}

export function parse(project: ast.Document): Document {
    return Document.fromAST(project);
}
