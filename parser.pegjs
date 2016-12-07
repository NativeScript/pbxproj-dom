{
    var ast = require("./ast");
}

Document = "// !$*UTF8*$!" s1:Space root:Dictionary s2:Space { return new ast.Document(s1, root, s2); }
Dictionary = "{" s1:Space content:(KeyValuePair s3:Space ";" s4:Space)* "}" { return new ast.Dictionary(s1, content); }
KeyValuePair = key:(StringBlock / Identifier) s1:Space "=" s2:Space value:Value { return new ast.KeyValuePair(key, s1, s2, value); }
Value = StringBlock / Dictionary / List / Identifier
List = "(" s1:Space content:(Value Space "," Space)* ")" { return new ast.List(s1, content); }
Identifier = id:$[a-zA-Z0-9_\.\/]* { return new ast.Identifier(id); }
StringBlock = '"' content:$([^\\\"] / '\\"' / '\\n')* '"' { return new ast.StringBlock(content); }
Space = content:(WhiteSpace / CommentBlock)* { return new ast.Space(content); }
WhiteSpace = ws:$[ \t\n\r]+ { return new ast.WhiteSpace(ws); }
CommentBlock = "/*" content:$[^*]* "*/" { return new ast.CommentBlock(content); }
