export type Kind =
    "Document" |
    "Dictionary" |
    "KeyValuePair" |
    "StringBlock" |
    "CommentBlock" |
    "List" |
    "Identifier" |
    "WhiteSpace" |
    "Space";

export abstract class Node {
    kind: Kind;
}

export class Document extends Node {
    constructor(private s1: Space, private root: Dictionary, private s2: Space) {
        super();
    }
    toString() {
        return "// !$*UTF8*$!" + this.s1 + this.root + this.s2;
    }
}
Document.prototype.kind = "Document";

export class Dictionary extends Node {
    constructor(private s1: Space, private content: [KeyValuePair, Space, ";", Space][]) {
        super();
    }
    toString = function() {
        return "{" + this.s1 + this.content.map(a => a.join("")).join("") + "}";
    }
}
Dictionary.prototype.kind = "Dictionary";

export type Value = StringBlock | Dictionary | List | Identifier;

export class KeyValuePair extends Node {
    constructor(private key: StringBlock | Identifier, private s1: Space, private s2: Space, private value: Value) {
        super();
    }
    toString = function(indent) {
        return this.key + this.s1 + "=" + this.s2 + this.value;
    }
}
KeyValuePair.prototype.kind = "KeyValuePair";

export class StringBlock extends Node {
    constructor(private text: string) {
        // TODO: text is unescaped
        super();
    }
    toString = function() {
        return '"' + this.text + '"';
    }
}
StringBlock.prototype.kind = "StringBlock";

export class CommentBlock extends Node {
    constructor(private text) {
        // TODO: text is unescaped
        super();
    }
    toString() {
        return "/*" + this.text + "*/";
    }
}
CommentBlock.prototype.kind = "CommentBlock";


export class List extends Node {
    constructor(private s1, private content: [Value, Space, ",", Space][]) {
        super();
    }
    toString() {
        return "(" + this.s1 + this.content.map(l => l.join("")).join("") + ")";
    }
}
List.prototype.kind = "List";

export class Identifier extends Node {
    constructor(private text: string) {
        super();
    }
    toString() {
        return this.text;
    }
}
Identifier.prototype.kind = "Identifier";

export class WhiteSpace extends Node {
    constructor(private text: string) {
        super();
    }
    toString() {
        return this.text;
    }
}
WhiteSpace.prototype.kind = "WhiteSpace";

export class Space extends Node {
    constructor(private content: (WhiteSpace | CommentBlock)[]) {
        super();
    }
    toString() {
        return this.content.join("");
    }
}
Space.prototype.kind = "Space";
