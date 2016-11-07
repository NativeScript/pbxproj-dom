{
    // TODO: Complete AST

    function DictionaryStart(text, location) {
    }
    DictionaryStart.prototype.kind = "DictionaryStart";
    DictionaryStart.prototype.toString = function() { return "{"; };

    function Dictionary(start, content, end, text, location) {
        this.start = start;
        this.content = content;
        this.keyValuePairs = [];
        for (var i = 0; i < this.content.length; i++) {
            var member = this.content[i];
            for (var j = 0; j < member.length; j++) {
                var kvp = member[j];
                if (kvp.kind === "KeyValuePair") {
                    this.keyValuePairs.push(kvp);
                }
            }
        }
        this.end = end;
    }
    Dictionary.prototype.kind = "Dictionary";
    Dictionary.prototype.toString = function() {
        return this.start + this.keyValuePairs.join("; ") + this.end;
    }

    function DictionaryEnd(text, location) {
    }
    DictionaryEnd.prototype.kind = "DictionaryEnd";
    DictionaryEnd.prototype.toString = function() { return "}"; };

    function KeyValuePair(key, equals, value, text, location) {
        this.key = key;
        this.equals = equals;
        this.value = value;
    }
    KeyValuePair.prototype.kind = "KeyValuePair";
    KeyValuePair.prototype.toString = function() {
        return this.key + " = " + this.value;
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
}

Expression
    = Encoding WS Dictionary WS

Encoding
    = "// !$*UTF8*$!"
 
Dictionary = start:DictionaryStart WS content:(KeyValuePair WS ";" WS)* end:DictionaryEnd { return new Dictionary(start, content, end, text, location); }

DictionaryStart = "{" { return new DictionaryStart(text, location); }
DictionaryEnd = "}" { return new DictionaryEnd(text, location); }

KeyValuePair = key:(StringBlock / Identifier) WS equals:Equals WS value:Value { return new KeyValuePair(key, equals, value, text, location); }
Equals = "="

Value
    = StringBlock / Dictionary / Array / Identifier

Array
    = "(" WS (Value WS "," WS)* ")"

Identifier
    = $[a-zA-Z0-9_\.\/]*

StringBlock = start:StringStart content:StringContent end:StringEnd { return new StringBlock(start, content, end, text, location); }
StringStart = $'"' { return new StringStart(text, location); }
StringContent = $([^\\\"] / '\\"' / '\\n')* { return new StringContent(text, location); }
StringEnd = $'"' { return new StringEnd(text, location); }

WS = (Space / CommentBlock)*
Space = $[ \t\n\r]+

CommentBlock = start:CommentStart content:CommentContent end:CommentEnd { return new CommentBlock(start, content, end); }
CommentStart = $"/*" { return new CommentStart(text, location); }
CommentContent = $[^*]* { return new CommentContent(text, location); }
CommentEnd = $"*/" { return new CommentEnd(text, location); }
