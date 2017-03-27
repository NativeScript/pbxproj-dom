{
    var ast = require("./ast");
}

Document = "// !$*UTF8*$!" root:Dictionary s1:Space { return new ast.Document(root, s1); }
Dictionary = s1:Space "{" content:KeyValuePair* s2:Space "}" { return new ast.Dictionary(s1, content, s2); }
KeyValuePair = key:(StringBlock / Identifier) s1:Space "=" value:Value s2:Space ";" { return new ast.KeyValuePair(key, s1, value, s2); }
Value = StringBlock / Dictionary / List / Identifier
List = s1:Space "(" content:(Value Space ",")* s2:Space ")" { return new ast.List(s1, content, s2); }

// Id used to be [a-zA-Z0-9\/\\_]* but characters such as '-', '.', '$' keep breaking the parser.
Identifier = s1:Space id:$[^(){} \t\n\r=;,]* { return new ast.Identifier(s1, id); }

StringBlock = s1:Space '"' content:$([^\\\"] / '\\"' / "\\'" / '\\n')* '"' { return new ast.StringBlock(s1, content); }
Space = content:(WhiteSpace / CommentBlock)* { return new ast.Space(content); }
WhiteSpace = ws:$[ \t\n\r]+ { return new ast.WhiteSpace(ws); }
CommentBlock = "/*" content:$[^*]* "*/" { return new ast.CommentBlock(content); }
