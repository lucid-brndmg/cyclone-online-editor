antlr4 -o src/generated/antlr -listener -Dlanguage=JavaScript raw/grammar/CycloneLexer.g4
antlr4 -o src/generated/antlr -listener -Dlanguage=JavaScript raw/grammar/CycloneParser.g4

cp src/generated/antlr/*.js execution_server/src/generated/antlr