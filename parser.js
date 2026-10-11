"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokens_1 = require("./tokens");
class Parser {
    tokens;
    current = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    parse() {
        const ast = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            ast.push(this.parseStatement());
        }
        return ast;
    }
    parseStatement() {
        const token = this.tokens[this.current];
        if (token.type === tokens_1.TokenType.IF)
            return this.parseIfStatement();
        if (token.type === tokens_1.TokenType.WHILE)
            return this.parseWhileStatement();
        if (token.type === tokens_1.TokenType.DO)
            return this.parseDoWhileStatement();
        if (token.type === tokens_1.TokenType.FOR)
            return this.parseForStatement();
        if (token.type === tokens_1.TokenType.SWITCH)
            return this.parseSwitchStatement();
        if (token.type === tokens_1.TokenType.TRY)
            return this.parseTryCatchStatement();
        if (token.type === tokens_1.TokenType.FUNC)
            return this.parseFuncDecl();
        if (token.type === tokens_1.TokenType.RETURN) {
            this.current++;
            let val = null;
            if (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.SEMICOLON) {
                val = this.parseExpression();
            }
            if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                this.current++;
            return { type: 'ReturnStatement', value: val };
        }
        if (token.type === tokens_1.TokenType.BREAK) {
            this.current++;
            if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                this.current++;
            return { type: 'BreakStatement' };
        }
        if (token.type === tokens_1.TokenType.CONTINUE) {
            this.current++;
            if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                this.current++;
            return { type: 'ContinueStatement' };
        }
        if (this.isTypeToken(token.type) || token.type === tokens_1.TokenType.VOID) {
            return this.parseVarDecl();
        }
        if (token.type === tokens_1.TokenType.IDENTIFIER) {
            const nextToken = this.tokens[this.current + 1];
            if (nextToken && nextToken.type === tokens_1.TokenType.LPAREN) {
                const name = token.value;
                this.current += 2;
                const args = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RPAREN) {
                    args.push(this.parseExpression());
                    if (this.tokens[this.current]?.type === tokens_1.TokenType.COMMA)
                        this.current++;
                }
                this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
                if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                    this.current++;
                return { type: 'CallExpression', name, args };
            }
            if (nextToken && [tokens_1.TokenType.INCREMENT, tokens_1.TokenType.DECREMENT].includes(nextToken.type)) {
                const name = token.value;
                const op = nextToken.value;
                this.current += 2;
                if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                    this.current++;
                return { type: 'IncrementStatement', name, operator: op };
            }
            if (nextToken && [tokens_1.TokenType.PLUS_ASSIGN, tokens_1.TokenType.MINUS_ASSIGN, tokens_1.TokenType.MUL_ASSIGN, tokens_1.TokenType.DIV_ASSIGN].includes(nextToken.type)) {
                const name = token.value;
                const op = nextToken.value;
                this.current += 2;
                const value = this.parseExpression();
                if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                    this.current++;
                return { type: 'CompoundAssignStatement', name, operator: op, value };
            }
            if (nextToken && nextToken.type === tokens_1.TokenType.LBRACKET) {
                const name = token.value;
                this.current += 2;
                const index = this.parseExpression();
                this.expect(tokens_1.TokenType.RBRACKET, "Esperado ']'");
                this.expect(tokens_1.TokenType.ASSIGN, "Esperado '='");
                const value = this.parseExpression();
                if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                    this.current++;
                return { type: 'ArrayAssignStatement', name, index, value };
            }
            if (nextToken && nextToken.type === tokens_1.TokenType.ASSIGN) {
                const name = token.value;
                this.current += 2;
                const value = this.parseExpression();
                if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
                    this.current++;
                return { type: 'AssignStatement', name, value };
            }
        }
        if (token.type === tokens_1.TokenType.SYSTEM) {
            this.current++;
            this.expect(tokens_1.TokenType.DOT, "Esperado '.'");
            this.expectToken(tokens_1.TokenType.CONSOLE, "Esperado 'console'");
            this.expect(tokens_1.TokenType.DOT, "Esperado '.'");
            const methodToken = this.tokens[this.current];
            if (methodToken.type === tokens_1.TokenType.OUT) {
                this.current++;
                return this.parseConsoleOut();
            }
            else if (methodToken.type === tokens_1.TokenType.OUTF) {
                this.current++;
                return this.parseConsoleOutf();
            }
            else if (methodToken.type === tokens_1.TokenType.IN) {
                this.current++;
                return this.parseConsoleIn();
            }
            throw new Error(`Método desconhecido em System.console`);
        }
        throw new Error(`[Linha ${token.line}] Instrução desconhecida ou mal formatada: '${token.value}'`);
    }
    parseFuncDecl() {
        this.current++; // func
        const nameToken = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome da função");
        const name = nameToken.value;
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const params = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RPAREN) {
            const pType = this.tokens[this.current].value;
            this.current++;
            const pName = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome do parâmetro").value;
            params.push({ type: pType, name: pName });
            if (this.tokens[this.current]?.type === tokens_1.TokenType.COMMA)
                this.current++;
        }
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        const retTypeToken = this.tokens[this.current];
        if (!this.isTypeToken(retTypeToken.type) && retTypeToken.type !== tokens_1.TokenType.VOID) {
            throw new Error(`[Linha ${retTypeToken.line}] Esperado tipo de retorno após a função`);
        }
        const returnType = retTypeToken.value;
        this.current++;
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const body = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        return { type: 'FuncDeclStatement', returnType, name, params, body };
    }
    parseSwitchStatement() {
        this.current++; // switch
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const condition = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const cases = [];
        let defaultBody = undefined;
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            const t = this.tokens[this.current];
            if (t.type === tokens_1.TokenType.CASE) {
                this.current++;
                const caseVal = this.parseExpression();
                if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.COLON) {
                    this.current++;
                }
                const caseBody = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.CASE && this.tokens[this.current].type !== tokens_1.TokenType.DEFAULT && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE) {
                    caseBody.push(this.parseStatement());
                }
                cases.push({ value: caseVal, body: caseBody });
            }
            else if (t.type === tokens_1.TokenType.DEFAULT) {
                this.current++;
                if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.COLON) {
                    this.current++;
                }
                defaultBody = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.CASE && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE) {
                    defaultBody.push(this.parseStatement());
                }
            }
            else {
                this.current++;
            }
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}' no switch");
        return { type: 'SwitchStatement', condition, cases, defaultBody };
    }
    parseTryCatchStatement() {
        this.current++; // try
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{' após try");
        const tryBody = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            tryBody.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        this.expectToken(tokens_1.TokenType.CATCH, "Esperado 'catch'");
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const catchVar = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome da variável de erro").value;
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const catchBody = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            catchBody.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        return { type: 'TryStatement', tryBody, catchVar, catchBody };
    }
    parseVarDecl() {
        const typeToken = this.tokens[this.current];
        const varType = typeToken.value;
        this.current++;
        const nameToken = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome da variável");
        const name = nameToken.value;
        let value = null;
        if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.ASSIGN) {
            this.current++;
            if (this.tokens[this.current]?.type === tokens_1.TokenType.LBRACKET) {
                this.current++;
                const elements = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACKET) {
                    elements.push(this.parseExpression());
                    if (this.tokens[this.current]?.type === tokens_1.TokenType.COMMA)
                        this.current++;
                }
                this.expect(tokens_1.TokenType.RBRACKET, "Esperado ']'");
                value = elements;
            }
            else {
                value = this.parseExpression();
            }
        }
        else {
            if (varType === 'string')
                value = '';
            else if (['int', 'float', 'double', 'short', 'long', 'byte', 'char'].includes(varType))
                value = 0;
            else if (varType === 'bool')
                value = false;
        }
        if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.SEMICOLON) {
            this.current++;
        }
        return { type: 'VarDeclStatement', varType, name, value };
    }
    parseConsoleIn() {
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const varNames = [];
        const firstVar = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome");
        varNames.push(firstVar.value);
        while (this.tokens[this.current]?.type === tokens_1.TokenType.COMMA) {
            this.current++;
            const nextVar = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado nome");
            varNames.push(nextVar.value);
        }
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
            this.current++;
        return { type: 'InputStatement', varNames };
    }
    parseIfStatement() {
        this.current++;
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const condition = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        this.expect(tokens_1.TokenType.THEN, "Esperado 'then'");
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const thenBranch = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            thenBranch.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        const elseIfs = [];
        let elseBranch = undefined;
        while (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.ELSE) {
            this.current++;
            if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.IF) {
                this.current++;
                this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
                const elseIfCond = this.parseExpression();
                this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
                this.expect(tokens_1.TokenType.THEN, "Esperado 'then'");
                this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
                const elseIfBranch = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
                    elseIfBranch.push(this.parseStatement());
                }
                this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
                elseIfs.push({ condition: elseIfCond, branch: elseIfBranch });
            }
            else {
                this.expect(tokens_1.TokenType.THEN, "Esperado 'then'");
                this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
                elseBranch = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
                    elseBranch.push(this.parseStatement());
                }
                this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
                break;
            }
        }
        return { type: 'IfStatement', condition, thenBranch, elseIfs, elseBranch };
    }
    parseWhileStatement() {
        this.current++;
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const condition = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        this.expect(tokens_1.TokenType.THEN, "Esperado 'then'");
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const body = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        return { type: 'WhileStatement', condition, body };
    }
    parseDoWhileStatement() {
        this.current++;
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const body = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        this.expectToken(tokens_1.TokenType.WHILE, "Esperado 'while'");
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const condition = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
            this.current++;
        return { type: 'DoWhileStatement', body, condition };
    }
    parseForStatement() {
        this.current++;
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        let init;
        if (this.isTypeToken(this.tokens[this.current].type)) {
            init = this.parseVarDecl();
        }
        else {
            const name = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado variável").value;
            this.expect(tokens_1.TokenType.ASSIGN, "Esperado '='");
            const val = this.parseExpression();
            this.expect(tokens_1.TokenType.SEMICOLON, "Esperado ';'");
            init = { type: 'VarDeclStatement', varType: 'int', name, value: val };
        }
        const condition = this.parseExpression();
        this.expect(tokens_1.TokenType.SEMICOLON, "Esperado ';'");
        let update;
        const updateId = this.expect(tokens_1.TokenType.IDENTIFIER, "Esperado id").value;
        const op = this.tokens[this.current].value;
        if (op === '++' || op === '--') {
            this.current++;
            update = { type: 'IncrementStatement', name: updateId, operator: op };
        }
        else {
            this.expect(tokens_1.TokenType.ASSIGN, "Esperado '='");
            const val = this.parseExpression();
            update = { type: 'AssignStatement', name: updateId, value: val };
        }
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        this.expect(tokens_1.TokenType.THEN, "Esperado 'then'");
        this.expect(tokens_1.TokenType.LBRACE, "Esperado '{'");
        const body = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RBRACE && this.tokens[this.current].type !== tokens_1.TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.RBRACE, "Esperado '}'");
        return { type: 'ForStatement', init, condition, update, body };
    }
    parseConsoleOut() {
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        let expr = this.parseExpression();
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
            this.current++;
        return { type: 'ConsoleOutStatement', message: expr };
    }
    parseConsoleOutf() {
        this.expect(tokens_1.TokenType.LPAREN, "Esperado '('");
        const strToken = this.expect(tokens_1.TokenType.STRING, "Esperada string");
        this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
        if (this.tokens[this.current]?.type === tokens_1.TokenType.SEMICOLON)
            this.current++;
        return { type: 'ConsoleOutfStatement', template: strToken.value };
    }
    parseExpression() {
        let expr = this.parseLogicalOr();
        if (this.tokens[this.current] && this.tokens[this.current].type === tokens_1.TokenType.TERNARY_QUESTION) {
            this.current++;
            const consequence = this.parseExpression();
            this.expect(tokens_1.TokenType.TERNARY_COLON, "Esperado ':'");
            const alternative = this.parseExpression();
            return { type: 'TernaryExpression', condition: expr, consequence, alternative };
        }
        return expr;
    }
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.tokens[this.current]?.type === tokens_1.TokenType.LOGICAL_OR) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseLogicalAnd() };
        }
        return left;
    }
    parseLogicalAnd() {
        let left = this.parseBitwise();
        while (this.tokens[this.current]?.type === tokens_1.TokenType.LOGICAL_AND) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseBitwise() };
        }
        return left;
    }
    parseBitwise() {
        let left = this.parseEquality();
        while (this.tokens[this.current] && [tokens_1.TokenType.BIT_AND, tokens_1.TokenType.BIT_OR, tokens_1.TokenType.LSHIFT, tokens_1.TokenType.RSHIFT].includes(this.tokens[this.current].type)) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseEquality() };
        }
        return left;
    }
    parseEquality() {
        let left = this.parseComparison();
        while (this.tokens[this.current] && [tokens_1.TokenType.EQUALS, tokens_1.TokenType.NOT_EQUALS].includes(this.tokens[this.current].type)) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseComparison() };
        }
        return left;
    }
    parseComparison() {
        let left = this.parseTerm();
        while (this.tokens[this.current] && [tokens_1.TokenType.LESS, tokens_1.TokenType.GREATER, tokens_1.TokenType.LESS_EQUALS, tokens_1.TokenType.GREATER_EQUALS].includes(this.tokens[this.current].type)) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseTerm() };
        }
        return left;
    }
    parseTerm() {
        let left = this.parseFactor();
        while (this.tokens[this.current] && [tokens_1.TokenType.PLUS, tokens_1.TokenType.MINUS].includes(this.tokens[this.current].type)) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseFactor() };
        }
        return left;
    }
    parseFactor() {
        let left = this.parsePrimary();
        while (this.tokens[this.current] && [tokens_1.TokenType.MULTIPLY, tokens_1.TokenType.DIVIDE, tokens_1.TokenType.POWER, tokens_1.TokenType.FLOOR_DIV, tokens_1.TokenType.MODULUS].includes(this.tokens[this.current].type)) {
            const op = this.tokens[this.current];
            this.current++;
            left = { type: 'BinaryExpression', operator: op.value, left, right: this.parsePrimary() };
        }
        return left;
    }
    parsePrimary() {
        const token = this.tokens[this.current];
        if (token.type === tokens_1.TokenType.STRING) {
            this.current++;
            return token.value;
        }
        if (token.type === tokens_1.TokenType.BOOLEAN) {
            this.current++;
            return token.value === 'true';
        }
        if (token.type === tokens_1.TokenType.NUMBER) {
            this.current++;
            return Number(token.value);
        }
        if (token.type === tokens_1.TokenType.IDENTIFIER) {
            const name = token.value;
            this.current++;
            if (this.tokens[this.current]?.type === tokens_1.TokenType.LPAREN) {
                this.current++;
                const args = [];
                while (this.tokens[this.current] && this.tokens[this.current].type !== tokens_1.TokenType.RPAREN) {
                    args.push(this.parseExpression());
                    if (this.tokens[this.current]?.type === tokens_1.TokenType.COMMA)
                        this.current++;
                }
                this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
                return { type: 'CallExpression', name, args };
            }
            if (this.tokens[this.current]?.type === tokens_1.TokenType.LBRACKET) {
                this.current++;
                const index = this.parseExpression();
                this.expect(tokens_1.TokenType.RBRACKET, "Esperado ']'");
                return { type: 'ArrayAccess', name, index };
            }
            return { type: 'VarRef', name };
        }
        if (token.type === tokens_1.TokenType.LPAREN) {
            this.current++;
            const expr = this.parseExpression();
            this.expect(tokens_1.TokenType.RPAREN, "Esperado ')'");
            return expr;
        }
        throw new Error(`[Linha ${token.line}] Expressão inválida em '${token.value}'`);
    }
    isTypeToken(type) {
        return [
            tokens_1.TokenType.INT, tokens_1.TokenType.FLOAT, tokens_1.TokenType.DOUBLE, tokens_1.TokenType.SHORT,
            tokens_1.TokenType.LONG, tokens_1.TokenType.BYTE, tokens_1.TokenType.VOID, tokens_1.TokenType.STRING_TYPE,
            tokens_1.TokenType.CHAR, tokens_1.TokenType.BOOL_TYPE, tokens_1.TokenType.ANY
        ].includes(type);
    }
    expectToken(type, msg) {
        const token = this.tokens[this.current];
        if (!token || token.type !== type)
            throw new Error(`[Linha ${token?.line || 1}] ${msg}`);
        this.current++;
        return token;
    }
    expect(type, msg) {
        const token = this.tokens[this.current];
        if (!token || token.type !== type)
            throw new Error(`[Linha ${token?.line || 1}] ${msg}`);
        this.current++;
        return token;
    }
}
exports.Parser = Parser;
