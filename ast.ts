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

function isJSONNull(json: any): json is Null {
    return typeof json === "undefined";
}
function isJSONList(json: any): json is Array<any> {
    return json instanceof Array;
}
function isJSONDictionary(json: any): json is Object {
    return typeof json === "object";
}
function isJSONIdentifier(json: any): json is number | string {
    return isJSONKey(json) && canBeIdentifier(json.toString());
}
function isJSONStringBlock(json: any): json is number | string {
    return isJSONKey(json) && !canBeIdentifier(json.toString());
}
function isJSONKey(json: any): json is number | string {
    return typeof json === "number" || typeof json === "string";
}
function canBeIdentifier(text: string): boolean {
    return /[0-9a-zA-Z][0-9a-zA-Z-]*/.test(text);
}
function makeKey(space: Space, json: string | number): Key {
    let text = json.toString();
    if (canBeIdentifier(text)) {
        return new Identifier(space, text);
    } else {
        return new StringBlock(space, text);
    }
}

export function isKVPDictionary(kvp: KeyValuePair<Value>): kvp is KeyValuePair<Dictionary> {
    return isDictionary(kvp.value);
}
export function isDictionary(node: Node): node is Dictionary {
    return node.kind === "Dictionary";
}
export function isList(node: Node): node is List {
    return node.kind === "List";
}
export function isIdentifier(node: Node): node is Identifier {
    return node.kind === "Identifier";
}
export function isStringBlock(node: Node): node is StringBlock {
    return node.kind === "StringBlock";
}
export function isNull(node: Node): node is Null {
    return node.kind === "Null";
}

export abstract class Node {
    readonly kind: Kind;

    /**
     * If the node is Dictionary, returns array with its KeyValuePair items. Returns empty array otherwise.
     */
    get kvps(): KeyValuePair<Value>[] { return []; }

    /**
     * If the node is List, returns array with its Value nodes. Returns empty array otherwise.
     */
    get items(): Value[] { return []; }

    /**
     * Read the text of text nodes. Returns undefined for dictionaries and arrays.
     */
    readonly text: string;

    /**
     * Returns JSON object matching the AST.
     */
    get json(): any { return undefined; }

    get indent(): string { return " "; }
}

class Null extends Node {
    static instance = new Null();
}

export class Document extends Node {
    constructor(public root: Dictionary, private _s1: Space) {
        super();
    }
    get json(): any {
        return this.root.json;
    }
    get(key: string): NullableValue {
        return this.root.get(key);
    }

    forEach(cb: (kvp: KeyValuePair<Value>) => void) {
        this.root.kvps.forEach(cb);
    }
    toString() {
        return "// !$*UTF8*$!" + this.root + this._s1;
    }
}
(<any>Document.prototype).kind = "Document";

export class Dictionary extends Node {
    constructor(private _s1: Space, private _content: KeyValuePair<Value>[], private _s2: Space) {
        super();
    }
    get kvps(): KeyValuePair<Value>[] {
        return this._content;
    }
    get json(): any {
        return this._content.reduce((acc: any, kvp: KeyValuePair<Value>) => {
            acc[kvp.key.json] = kvp.value.json;
            return acc;
        }, {});
    }
    get(key: string): NullableValue {
        const kvp = this.kvps.find(kvp => {
            return kvp.key.json == key;
        });
        return kvp ? kvp.value : Null.instance;
    }

    /**
     * Perform "RFC 7386 - JSON Merge Patch" on the json version of the AST
     * and tries to propagate the changes back to the AST.
     * 
     * A Node can not change its own type based on the merge.
     * Arrays are completely overwritten.
     */
    patch(json: any) {

        for(let key in json) {
            let value = json[key];
            let current = this.get(key);

            if (isJSONNull(value)) {
                this.delete(key);
            } else if (isJSONList(value) && isList(current)) {
                // TODO:
                throw new Error("Not implemented setting List from Array");
            } else if (isJSONDictionary(value) && isDictionary(current)) {
                current.patch(value);
            } else if (isJSONIdentifier(value) && isIdentifier(current)) {
                current.text = value.toString();
            } else if (isJSONStringBlock(value) && isStringBlock(current)) {
                current.text = value.toString();
            } else {
                let astValue: Value;
                if (isJSONKey(value)) {
                    astValue = makeKey(new Space([new WhiteSpace(" ")]), value);
                } else if (isDictionary(value)) {
                    // TODO:
                    throw new Error("Not implemented making dictionary from json object");
                } else if (isList(value)) {
                    // TODO:
                    throw new Error("Not implemented making dictionary from json Array");
                } else {
                    // TODO:
                    throw new Error("Not implemented making ast from json " + value);
                }

                let kvp = this._content.find(kvp => kvp.key.text === key);
                if (kvp) {
                    kvp.value = astValue;
                } else {
                    // TODO: Indent here...
                    kvp = new KeyValuePair<Value>(new Space([]), makeKey(new Space([new WhiteSpace(" ")]), key), new Space([new WhiteSpace(" ")]), astValue, new Space([]));
                    this._content.push(kvp);
                }
            }
        }
    }
    delete(key: string) {
        for (let i = this._content.length - 1; i >= 0; i--) {
            if (this._content[i].key.text === key) {
                this._content.splice(i, 1);
                return;
            }
        }
    }
    toString() {
        // TODO: It appears the _content is ordered alphabetically...
        return this._s1 + "{" + this._content.join("") + this._s2 + "}";
    }
}
(<any>Dictionary.prototype).kind = "Dictionary";

export type Value = StringBlock | Dictionary | List | Identifier;
export type NullableValue = Value | Null;
export type Key = StringBlock | Identifier;

export class KeyValuePair<V extends Value> extends Node {
    constructor(private _s1: Space, private _key: Key, private _s2: Space, public value: V, private _s3: Space) {
        super();
    }
    get key(): Key { return this._key }
    toString() {
        return "" + this._s1 + this._key + this._s2 + "=" + this.value + this._s3 + ";";
    }
}
(<any>KeyValuePair.prototype).kind = "KeyValuePair";

export class StringBlock extends Node {
    constructor(private _s1: Space, public text: string) {
        // TODO: Escape the text.
        super();
    }
    get json(): string { return this.text; }
    toString() {
        // TODO: Unescape the text.
        return this._s1 + '"' + this.text + '"';
    }
}
(<any>StringBlock.prototype).kind = "StringBlock";

export class CommentBlock extends Node {
    constructor(private _text: string) {
        super();
    }
    get text(): string { return this._text; }
    toString() {
        return "/*" + this._text + "*/";
    }
}
(<any>CommentBlock.prototype).kind = "CommentBlock";

export class List extends Node {
    constructor(private _s1: Space, private _content: [Value, Space, ",", Space][], private _s2: Space) {
        super();
    }
    get items(): Value[] {
        return this._content.map(e => e[0]);
    }
    get json(): any[] {
        return this._content.map(e => e[0].json);
    }
    toString() {
        return this._s1 + "(" + this._content.map(l => l.join("")).join("") + this._s2 + ")";
    }
}
(<any>List.prototype).kind = "List";

export class Identifier extends Node {
    constructor(private _s1: Space, public text: string) {
        super();
    }
    get json(): string { return this.text; }
    toString() { return this._s1 + this.text; }
}
(<any>Identifier.prototype).kind = "Identifier";

export class WhiteSpace extends Node {
    constructor(public text: string) {
        // TODO: Unescape the text
        super();
    }
    toString() {
        // TODO: Escape the text
        return this.text;
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
