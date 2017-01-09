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
    return /^[0-9a-zA-Z][0-9a-zA-Z_]*$/.test(text);
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
    kind: Kind;
    parent: Node;

    constructor(... children: Node[]) {
        children.forEach(child => child.parent = this);
    }

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

    /**
     * Get the indentation that should be used for the children of this Node.
     * For example the indent property of a List will be used when new items are added, and applied to preserve good formatting.
     */
    get indent(): string { return this.parent ? this.parent.indent : ""; }

    get(key: string): NullableValue {
        return Null.instance;
    }
}

export class Null extends Node {
    static instance = new Null();
}

export class Document extends Node {
    constructor(public root: Dictionary, private _s1: Space) {
        super(root, _s1);
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
Document.prototype.kind = "Document";

export class Dictionary extends Node {
    constructor(private _s1: Space, private _content: KeyValuePair<Value>[], private _s2: Space) {
        super(_s1, ... _content, _s2);
    }
    get indent(): string {
        return this.parent.indent + "\t";
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
                if (isJSONKey(value)) {
                    const astValue = makeKey(new Space([new WhiteSpace(" ")]), value);
                    this.set(key, astValue);
                } else if (isJSONDictionary(value)) {
                    const astValue = new Dictionary(new Space([new WhiteSpace(" ")]), [], new Space([new WhiteSpace("\n" + this.indent)]));
                    this.set(key, astValue);
                    astValue.patch(value);
                } else if (isJSONList(value)) {
                    // TODO:
                    throw new Error("Not implemented making dictionary from json Array");
                } else {
                    // TODO:
                    throw new Error("Not implemented making ast from json " + value);
                }
            }
        }
    }
    set(key: string, value: Value) {
        let kvp = this._content.find(kvp => kvp.key.text === key);
        if (kvp) {
            kvp.value = value;
        } else {
            let space: Space = new Space([new WhiteSpace(this.indent ? "\n" + this.indent : " ")]);
            kvp = new KeyValuePair<Value>(makeKey(space, key), new Space([new WhiteSpace(" ")]), value, new Space([]));
            let index = this._content.findIndex(p => p.key.text > key);
            if (index === -1) {
                this._content.push(kvp);
            } else {
                this._content.splice(index, 0, kvp);
            }
            kvp.parent = this;
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
        return this._s1 + "{" + this._content.join("") + this._s2 + "}";
    }
}
Dictionary.prototype.kind = "Dictionary";

export type Value = StringBlock | Dictionary | List | Identifier;
export type NullableValue = Value | Null;
export type Key = StringBlock | Identifier;

export class KeyValuePair<V extends Value> extends Node {
    constructor(private _key: Key, private _s2: Space, public value: V, private _s3: Space) {
        super(_key, _s2, value, _s3);
    }
    get key(): Key { return this._key }
    toString() {
        return "" + this._key + this._s2 + "=" + this.value + this._s3 + ";";
    }
    get(key: string): NullableValue {
        return this.value ? this.value.get(key) : Null.instance;
    }
}
KeyValuePair.prototype.kind = "KeyValuePair";

export class StringBlock extends Node {
    constructor(private _s1: Space, public text: string) {
        // TODO: Escape the text.
        super(_s1);
    }
    get json(): string { return this.text; }
    toString() {
        // TODO: Unescape the text.
        return this._s1 + '"' + this.text + '"';
    }
}
StringBlock.prototype.kind = "StringBlock";

export class CommentBlock extends Node {
    constructor(private _text: string) {
        super();
    }
    get text(): string { return this._text; }
    toString() {
        return "/*" + this._text + "*/";
    }
}
CommentBlock.prototype.kind = "CommentBlock";

export class List extends Node {
    constructor(private _s1: Space, private _content: [Value, Space, ","][], private _s2: Space) {
        super(_s1, ... List.flatten(_content), _s2);
    }
    get indent(): string {
        return this.parent.indent + "\t";
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
    static flatten(arr: [Value, Space, ","][]): Node[] {
        return arr.reduce((acc, child) => {
            acc.push(child[0]);
            acc.push(child[1]);
            return acc;
        }, []);
    }
}
List.prototype.kind = "List";

export class Identifier extends Node {
    constructor(private _s1: Space, public text: string) {
        super(_s1);
    }
    get json(): string { return this.text; }
    toString() { return this._s1 + this.text; }
}
Identifier.prototype.kind = "Identifier";

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
WhiteSpace.prototype.kind = "WhiteSpace";

export class Space extends Node {
    constructor(private _content: (WhiteSpace | CommentBlock)[]) {
        super(... _content);
    }
    toString() {
        return this._content.join("");
    }
}
Space.prototype.kind = "Space";
