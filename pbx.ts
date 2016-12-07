import * as ast from "./ast";

export function isProject(obj: DocumentObject): obj is Project {
    return obj.isa === "PBXProject";
}
export function isTarget(obj: DocumentObject): obj is NativeTarget {
    return obj.isa === "PBXNativeTarget";
}

type ISA = "PBXProject" | "PBXNativeTarget";

export class DocumentObject {
    isa: ISA;
    document: Document;
    ast: ast.KeyValuePair;

    constructor(document: Document, ast: ast.KeyValuePair) {
        Object.defineProperty(this, "document", { enumerable: false, writable: false, value: document });
        Object.defineProperty(this, "ast", { enumerable: false, writable: false, value: ast });
    }

    get key() { return this.ast.key.json; }

    /**
     * Override and use the ast and the document to resolve any objects referenced by hash.
     */
    protected resolve() {
    }
}

export class Project extends DocumentObject {
    get targets(): NativeTarget[] {
        return this.ast.get("targets").items.map(key => this.document[key.json]).filter(isTarget);
    }
}
Project.prototype.isa = "PBXProject";

export class NativeTarget extends DocumentObject {
    get name() { return this.ast.get("name").json; }
}
NativeTarget.prototype.isa = "PBXNativeTarget";

const ctorMap: { [key: string]: typeof DocumentObject } = {
    "PBXProject": Project,
    "PBXNativeTarget": NativeTarget
}

export class Document {
    [id: string]: DocumentObject | any;

    get objects(): DocumentObject[] { return Object.keys(this).map(key => this[key]); }
    get targets(): NativeTarget[] { return <any>this.objects.filter(isTarget); }
    get projects(): Project[] { return <any>this.objects.filter(isProject); }

    static fromAST(fromAST: ast.Document): Document {
        const doc = new Document();
        fromAST.get("objects").kvps.forEach(kvp => {
            const Ctor = ctorMap[kvp.get("isa").json];
            if (Ctor) {
                const obj = new Ctor(doc, kvp);
                doc[kvp.key.json] = obj;
            }
        });
        return doc;
    }
}

export function parse(project: ast.Document): Document {
    return Document.fromAST(project);
}
