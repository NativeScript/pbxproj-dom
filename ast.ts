export type Kind =
    "Document" |
    "Dictionary" |
    "KeyValuePair" |
    "StringBlock" |
    "CommentBlock" |
    "List" |
    "Identifier" |
    "WhiteSpace" |
    "Space" |
    "Null";

export function isDictionary(node: Node): node is Dictionary {
    return node.kind === "Dictionary";
}
export function isList(node: Node): node is List {
    return node.kind === "List";
}

export abstract class Node {
    readonly kind: Kind;
    get kvps(): KeyValuePair[] { return []; }
    get items(): Value[] { return []; }
    get text(): string { return undefined; }

    /**
     * Perform "RFC 7386 - JSON Merge Patch" on the json version of the AST
     * and tries to propagate the changes back to the AST.
     * 
     * A Node can not change its own type based on the merge.
     * Arrays may be completely overwritten.
     */
    patch(json: any) {}
}

class Null extends Node {
    get json() { return undefined; }
    static instance = new Null();
}

export class Document extends Node {
    constructor(private _s1: Space, public root: Dictionary, private _s2: Space) {
        super();
    }
    get json(): any {
        return this.root.json;
    }
    get(key: string): NullableValue {
        return this.root.get(key);
    }
    toString() {
        return "// !$*UTF8*$!" + this._s1 + this.root + this._s2;
    }
    forEach(cb: (kvp: KeyValuePair) => void) {
        this.root.kvps.forEach(cb);
    }
}
(<any>Document.prototype).kind = "Document";

export class Dictionary extends Node {
    constructor(private _s1: Space, private _content: [KeyValuePair, Space, ";", Space][]) {
        super();
    }
    get kvps(): KeyValuePair[] {
        return this._content.map(arr => arr[0]);
    }
    get(key: string): NullableValue {
        const kvp = this.kvps.find(kvp => kvp.key.json == key);
        return kvp ? kvp.value : Null.instance;
    }
    get json(): any {
        return this._content.reduce((acc, kvpArr) => {
            const kvp = kvpArr[0];
            acc[kvp.key.json] = kvp.value.json;
            return acc;
        }, {});
    }
    toString() {
        return "{" + this._s1 + this._content.map(a => a.join("")).join("") + "}";
    }
}
(<any>Dictionary.prototype).kind = "Dictionary";

export type Value = StringBlock | Dictionary | List | Identifier;
export type NullableValue = Value | Null;
export type Key = StringBlock | Identifier;

export class KeyValuePair extends Node {
    constructor(private _key: Key, private _s1: Space, private _s2: Space, public value: Value) {
        super();
    }
    get key(): Key { return this._key }
    get(key: string): NullableValue {
        return isDictionary(this.value) && this.value.get(key) || Null.instance;
    }
    toString() {
        return "" + this._key + this._s1 + "=" + this._s2 + this.value;
    }
}
(<any>KeyValuePair.prototype).kind = "KeyValuePair";

export class StringBlock extends Node {
    constructor(private _text: string) {
        // TODO: _text is unescaped, we need to support 2 versions
        super();
    }
    get text(): string { return this._text; }
    get json(): string { return this._text; }
    toString() {
        return '"' + this._text + '"';
    }
}
(<any>StringBlock.prototype).kind = "StringBlock";

export class CommentBlock extends Node {
    constructor(private _text: string) {
        super();
    }
    toString() {
        return "/*" + this._text + "*/";
    }
}
(<any>CommentBlock.prototype).kind = "CommentBlock";


export class List extends Node {
    constructor(private _s1, private _content: [Value, Space, ",", Space][]) {
        super();
    }
    get items(): Value[] {
        return this._content.map(e => e[0]);
    }
    get json(): any[] {
        return this._content.map(e => e[0].json);
    }
    toString() {
        return "(" + this._s1 + this._content.map(l => l.join("")).join("") + ")";
    }
}
(<any>List.prototype).kind = "List";

export class Identifier extends Node {
    constructor(private _text: string) {
        super();
    }
    get text(): string { return this._text; }
    get json(): string { return this._text; }
    toString() { return this._text; }
}
(<any>Identifier.prototype).kind = "Identifier";

export class WhiteSpace extends Node {
    constructor(private _text: string) {
        super();
    }
    toString() {
        return this._text;
    }
}
(<any>WhiteSpace.prototype).kind = "WhiteSpace";

export class Space extends Node {
    constructor(private _content: (WhiteSpace | CommentBlock)[]) {
        super();
    }
    toString() {
        return this._content.join("");
    }
}
(<any>Space.prototype).kind = "Space";
