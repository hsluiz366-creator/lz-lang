"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const tokens_1 = require("./tokens");
class Lexer {
    code;
    pos = 0;
    line = 1;
    constructor(code) {
        this.code = code;
    }
    tokenize() {
        const tokens = [];
        while (this.pos < this.code.length) {
            const char = this.code[this.pos];
            if (char === '\n') {
                this.line++;
                this.pos++;
                continue;
            }
            if (/\s/.test(char)) {
                this.pos++;
                continue;
            }
            // Comentário multi-linha: #* ... *#
            if (this.code.startsWith('#*', this.pos)) {
                this.pos += 2;
                while (this.pos < this.code.length && !this.code.startsWith('*#', this.pos)) {
                    if (this.code[this.pos] === '\n')
                        this.line++;
                    this.pos++;
                }
                this.pos += 2;
                continue;
            }
            // Comentário de linha única: #
            if (char === '#') {
                while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }
            if (this.code.startsWith('.and.', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.LOGICAL_AND, value: '.and.', line: this.line });
                this.pos += 5;
                continue;
            }
            if (this.code.startsWith('.or.', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.LOGICAL_OR, value: '.or.', line: this.line });
                this.pos += 4;
                continue;
            }
            if (this.code.startsWith('++', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.INCREMENT, value: '++', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('--', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.DECREMENT, value: '--', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('+=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.PLUS_ASSIGN, value: '+=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('-=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.MINUS_ASSIGN, value: '-=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('*=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.MUL_ASSIGN, value: '*=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('/=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.DIV_ASSIGN, value: '/=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('==', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.EQUALS, value: '==', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('!=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.NOT_EQUALS, value: '!=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('<=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.LESS_EQUALS, value: '<=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('>=', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.GREATER_EQUALS, value: '>=', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('**', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.POWER, value: '**', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('//', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.FLOOR_DIV, value: '//', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('<<', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.LSHIFT, value: '<<', line: this.line });
                this.pos += 2;
                continue;
            }
            if (this.code.startsWith('>>', this.pos)) {
                tokens.push({ type: tokens_1.TokenType.RSHIFT, value: '>>', line: this.line });
                this.pos += 2;
                continue;
            }
            if (char === '=') {
                tokens.push({ type: tokens_1.TokenType.ASSIGN, value: '=', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '<') {
                tokens.push({ type: tokens_1.TokenType.LESS, value: '<', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '>') {
                tokens.push({ type: tokens_1.TokenType.GREATER, value: '>', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '+') {
                tokens.push({ type: tokens_1.TokenType.PLUS, value: '+', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '-') {
                tokens.push({ type: tokens_1.TokenType.MINUS, value: '-', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '*') {
                tokens.push({ type: tokens_1.TokenType.MULTIPLY, value: '*', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '/') {
                tokens.push({ type: tokens_1.TokenType.DIVIDE, value: '/', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '%') {
                tokens.push({ type: tokens_1.TokenType.MODULUS, value: '%', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '&') {
                tokens.push({ type: tokens_1.TokenType.BIT_AND, value: '&', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '|') {
                tokens.push({ type: tokens_1.TokenType.BIT_OR, value: '|', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '?') {
                tokens.push({ type: tokens_1.TokenType.TERNARY_QUESTION, value: '?', line: this.line });
                this.pos++;
                continue;
            }
            if (char === ':') {
                tokens.push({ type: tokens_1.TokenType.COLON, value: ':', line: this.line });
                this.pos++;
                continue;
            }
            if (char === ',') {
                tokens.push({ type: tokens_1.TokenType.COMMA, value: ',', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '.') {
                tokens.push({ type: tokens_1.TokenType.DOT, value: '.', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '(') {
                tokens.push({ type: tokens_1.TokenType.LPAREN, value: '(', line: this.line });
                this.pos++;
                continue;
            }
            if (char === ')') {
                tokens.push({ type: tokens_1.TokenType.RPAREN, value: ')', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '{') {
                tokens.push({ type: tokens_1.TokenType.LBRACE, value: '{', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '}') {
                tokens.push({ type: tokens_1.TokenType.RBRACE, value: '}', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '[') {
                tokens.push({ type: tokens_1.TokenType.LBRACKET, value: '[', line: this.line });
                this.pos++;
                continue;
            }
            if (char === ']') {
                tokens.push({ type: tokens_1.TokenType.RBRACKET, value: ']', line: this.line });
                this.pos++;
                continue;
            }
            if (char === ';') {
                tokens.push({ type: tokens_1.TokenType.SEMICOLON, value: ';', line: this.line });
                this.pos++;
                continue;
            }
            if (char === '"' || char === '“' || char === '”') {
                this.pos++;
                let str = '';
                while (this.pos < this.code.length && this.code[this.pos] !== '"' && this.code[this.pos] !== '“' && this.code[this.pos] !== '”') {
                    str += this.code[this.pos];
                    this.pos++;
                }
                this.pos++;
                tokens.push({ type: tokens_1.TokenType.STRING, value: str, line: this.line });
                continue;
            }
            if (char === "'" || char === '‘' || char === '’') {
                this.pos++;
                let str = '';
                while (this.pos < this.code.length && this.code[this.pos] !== "'" && this.code[this.pos] !== '‘' && this.code[this.pos] !== '’') {
                    str += this.code[this.pos];
                    this.pos++;
                }
                this.pos++;
                tokens.push({ type: tokens_1.TokenType.STRING, value: str, line: this.line });
                continue;
            }
            if (/[0-9]/.test(char)) {
                let num = '';
                while (this.pos < this.code.length && /[0-9.]/.test(this.code[this.pos])) {
                    num += this.code[this.pos];
                    this.pos++;
                }
                tokens.push({ type: tokens_1.TokenType.NUMBER, value: num, line: this.line });
                continue;
            }
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (this.pos < this.code.length && /[a-zA-Z0-9_]/.test(this.code[this.pos])) {
                    ident += this.code[this.pos];
                    this.pos++;
                }
                let type = tokens_1.TokenType.IDENTIFIER;
                if (ident === 'int')
                    type = tokens_1.TokenType.INT;
                else if (ident === 'float')
                    type = tokens_1.TokenType.FLOAT;
                else if (ident === 'double')
                    type = tokens_1.TokenType.DOUBLE;
                else if (ident === 'short')
                    type = tokens_1.TokenType.SHORT;
                else if (ident === 'long')
                    type = tokens_1.TokenType.LONG;
                else if (ident === 'byte')
                    type = tokens_1.TokenType.BYTE;
                else if (ident === 'void')
                    type = tokens_1.TokenType.VOID;
                else if (ident === 'string')
                    type = tokens_1.TokenType.STRING_TYPE;
                else if (ident === 'char')
                    type = tokens_1.TokenType.CHAR;
                else if (ident === 'bool')
                    type = tokens_1.TokenType.BOOL_TYPE;
                else if (ident === 'true' || ident === 'false')
                    type = tokens_1.TokenType.BOOLEAN;
                else if (ident === 'if')
                    type = tokens_1.TokenType.IF;
                else if (ident === 'then')
                    type = tokens_1.TokenType.THEN;
                else if (ident === 'else')
                    type = tokens_1.TokenType.ELSE;
                else if (ident === 'while')
                    type = tokens_1.TokenType.WHILE;
                else if (ident === 'do')
                    type = tokens_1.TokenType.DO;
                else if (ident === 'for')
                    type = tokens_1.TokenType.FOR;
                else if (ident === 'break')
                    type = tokens_1.TokenType.BREAK;
                else if (ident === 'continue')
                    type = tokens_1.TokenType.CONTINUE;
                else if (ident === 'func')
                    type = tokens_1.TokenType.FUNC;
                else if (ident === 'return')
                    type = tokens_1.TokenType.RETURN;
                else if (ident === 'switch')
                    type = tokens_1.TokenType.SWITCH;
                else if (ident === 'case')
                    type = tokens_1.TokenType.CASE;
                else if (ident === 'default')
                    type = tokens_1.TokenType.DEFAULT;
                else if (ident === 'try')
                    type = tokens_1.TokenType.TRY;
                else if (ident === 'catch')
                    type = tokens_1.TokenType.CATCH;
                else if (ident === 'System')
                    type = tokens_1.TokenType.SYSTEM;
                else if (ident === 'console')
                    type = tokens_1.TokenType.CONSOLE;
                else if (ident === 'out')
                    type = tokens_1.TokenType.OUT;
                else if (ident === 'outf')
                    type = tokens_1.TokenType.OUTF;
                else if (ident === 'in')
                    type = tokens_1.TokenType.IN;
                else if (ident === 'any')
                    type = tokens_1.TokenType.ANY;
                tokens.push({ type, value: ident, line: this.line });
                continue;
            }
            throw new Error(`[Linha ${this.line}] Caractere desconhecido: '${char}'`);
        }
        tokens.push({ type: tokens_1.TokenType.EOF, value: '', line: this.line });
        return tokens;
    }
}
exports.Lexer = Lexer;
