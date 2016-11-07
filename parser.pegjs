{
    function Document(encoding, leadingspace, root, trailingspace, text, location) {
        this.encoding = encoding;
        this.leadingspace = leadingspace;
        this.root = root;
        this.trailingspace = trailingspace;
    }
    Document.prototype.kind = "Document";
    Document.prototype.toString = function() {
        return this.encoding + this.leadingspace + this.root + this.trailingspace;
    }

    function DictionaryStart(text, location) {
    }
    DictionaryStart.prototype.kind = "DictionaryStart";
    DictionaryStart.prototype.toString = function() { return "{"; };

    function Dictionary(start, leadingspace, content, end, text, location) {
        this.start = start;
        this.leadingspace = leadingspace;
        this.content = [];
        this.keyValuePairs = [];
        for (var i = 0; i < content.length; i++) {
            var outermember = content[i];
            for (var j = 0; j < outermember.length; j++) {
                var innermember = outermember[j];
                if (innermember.kind === "KeyValuePair") {
                    this.keyValuePairs.push(innermember);
                }
                this.content.push(innermember);
            }
        }
        this.end = end;
    }
    Dictionary.prototype.kind = "Dictionary";
    Dictionary.prototype.toString = function() {
        return this.start + this.leadingspace + this.content.join("") + this.end;
    }

    function DictionaryEnd(text, location) {
    }
    DictionaryEnd.prototype.kind = "DictionaryEnd";
    DictionaryEnd.prototype.toString = function() { return "}"; };

    function KeyValuePair(key, leadingspace, equals, trailingspace, value, text, location) {
        this.key = key;
        this.leadingspace = leadingspace;
        this.equals = equals;
        this.trailingspace = trailingspace;
        this.value = value;
    }
    KeyValuePair.prototype.kind = "KeyValuePair";
    KeyValuePair.prototype.toString = function(indent) {
        return this.key + this.leadingspace + this.equals + this.trailingspace + this.value;
    }

    function StringBlock(start, content, end, text, location) {
        this.start = start;
        this.content = content;
        this.end = end;
    }
    StringBlock.prototype.kind = "StringBlock";
    StringBlock.prototype.toString = function() {
        // TODO: JavaScript string escape
        return this.start + this.content + this.end;
    }

    function StringStart(text, location) {
    }
    StringStart.prototype.kind = "StringStart";
    StringStart.prototype.toString = function() { return '"'; };

    function StringContent(text, locaiton) {
        // TODO: JavaScript string unescape
        this.text = text();
    }
    StringContent.prototype.kind = "StringContent";
    StringContent.prototype.toString = function() { return this.text };

    function StringEnd(text, location) {
    }
    StringEnd.prototype.kind = "StringEnd";
    StringEnd.prototype.toString = function() { return '"' };

    function CommentBlock(start, content, end, text, location) {
        this.start = start;
        this.content = content;
        this.end = end;
    }
    CommentBlock.prototype.toString = function() {
        return this.start + this.content + this.end;
    }

    function CommentStart(text, location) {
    }
    CommentStart.prototype.kind = "CommentStart";
    CommentStart.prototype.toString = function() { return "/*"; }

    function CommentContent(text, location) {
        this.text = text();
    }
    CommentContent.prototype.kind = "CommentContent";
    CommentContent.prototype.toString = function() {
        return this.text;
    }

    function CommentEnd(text, location) {
    }
    CommentEnd.prototype.kind = "CommentEnd";
    CommentEnd.prototype.toString = function() { return "*/"; }

    function ListStart(text, location) {
    }
    ListStart.prototype.kind = "ListStart";
    ListStart.prototype.toString = function() { return "("; }

    function List(start, leadingspace, content, end, text, location) {
        this.start = start;
        this.leadingspace = leadingspace;
        this.content = [];
        this.members = [];

        for (var i = 0; i < content.length; i++) {
            var outermember = content[i];
            for (var j = 0; j < outermember.length; j++) {
                var innermember = outermember[j];
                if (innermember.kind === "StringBlock" || innermember.kind === "Dictionary" || innermember.kind === "List" || innermember.kind === "Identifier") {
                    this.members.push(innermember);
                }
                this.content.push(innermember);
            }
        }

        this.end = end;
    }
    List.prototype.kind = "List";
    List.prototype.toString = function(indent) {
        return this.start + this.leadingspace + this.content.join("") + this.end;
    }

    function ListEnd(text, location) {
    }
    ListEnd.prototype.kind = "ListEnd";
    ListEnd.prototype.toString = function() { return ")"; }

    function Identifier(text, location) {
        this.text = text();
    }
    Identifier.prototype.kind = "Identifier";
    Identifier.prototype.toString = function() { return this.text; }

    function WhiteSpace(text, location) {
        this.text = text();
    }
    WhiteSpace.prototype.kind = "WhiteSpace";
    WhiteSpace.prototype.toString = function() { return this.text; }

    function Space(content, text, location) {
        this.content = content;
    }
    Space.prototype.kind = "Space";
    Space.prototype.toString = function() { return this.content.join(""); }
}

Expression = encoding:Encoding leadingspace:Space root:Dictionary trailingspace:Space { return new Document(encoding, leadingspace, root, trailingspace, text, location); }

Encoding = "// !$*UTF8*$!"

Dictionary = start:DictionaryStart leadingspace:Space content:(KeyValuePair Space ";" Space)* end:DictionaryEnd { return new Dictionary(start, leadingspace, content, end, text, location); }

DictionaryStart = "{" { return new DictionaryStart(text, location); }
DictionaryEnd = "}" { return new DictionaryEnd(text, location); }

KeyValuePair = key:(StringBlock / Identifier) leadingspace:Space equals:Equals trailingspace:Space value:Value { return new KeyValuePair(key, leadingspace, equals, trailingspace, value, text, location); }
Equals = "="

Value = StringBlock / Dictionary / List / Identifier

List = start:ListStart leadingspace:Space content:(Value Space "," Space)* end:ListEnd { return new List(start, leadingspace, content, end, text, location); }
ListStart = "(" { return new ListStart(text, location); }
ListEnd = ")" { return new ListEnd(text, location); }

Identifier = $[a-zA-Z0-9_\.\/]* { return new Identifier(text, location); }

StringBlock = start:StringStart content:StringContent end:StringEnd { return new StringBlock(start, content, end, text, location); }
StringStart = $'"' { return new StringStart(text, location); }
StringContent = $([^\\\"] / '\\"' / '\\n')* { return new StringContent(text, location); }
StringEnd = $'"' { return new StringEnd(text, location); }

Space = content:(WhiteSpace / CommentBlock)* { return new Space(content, text, location); } 
WhiteSpace = $[ \t\n\r]+ { return new WhiteSpace(text, location); }

CommentBlock = start:CommentStart content:CommentContent end:CommentEnd { return new CommentBlock(start, content, end); }
CommentStart = $"/*" { return new CommentStart(text, location); }
CommentContent = $[^*]* { return new CommentContent(text, location); }
CommentEnd = $"*/" { return new CommentEnd(text, location); }
