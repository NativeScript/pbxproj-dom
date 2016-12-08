{
    var ast = require("./ast");
}

Document = "// !$*UTF8*$!" root:Dictionary s1:Space { return new ast.Document(root, s1); }
Dictionary = s1:Space "{" content:KeyValuePair* s2:Space "}" { return new ast.Dictionary(s1, content, s2); }
KeyValuePair = s1:Space key:(StringBlock / Identifier) s2:Space "=" value:Value s3:Space ";" { return new ast.KeyValuePair(s1, key, s2, value, s3); }
Value = StringBlock / Dictionary / List / Identifier
List = s1:Space "(" content:(Value Space ",")* s2:Space ")" { return new ast.List(s1, content, s2); }
Identifier = s1:Space id:$[a-zA-Z0-9_\.\/]* { return new ast.Identifier(s1, id); }
StringBlock = s1:Space '"' content:$([^\\\"] / '\\"' / '\\n')* '"' { return new ast.StringBlock(s1, content); }
Space = content:(WhiteSpace / CommentBlock)* { return new ast.Space(content); }
WhiteSpace = ws:$[ \t\n\r]+ { return new ast.WhiteSpace(ws); }
CommentBlock = "/*" content:$[^*]* "*/" { return new ast.CommentBlock(content); }
