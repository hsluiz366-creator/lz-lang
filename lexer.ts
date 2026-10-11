import { Token, TokenType } from './tokens';

export class Lexer {
  private code: string;
  private pos = 0;
  private line = 1;

  constructor(code: string) {
    this.code = code;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

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
          if (this.code[this.pos] === '\n') this.line++;
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

      if (this.code.startsWith('.and.', this.pos)) { tokens.push({ type: TokenType.LOGICAL_AND, value: '.and.', line: this.line }); this.pos += 5; continue; }
      if (this.code.startsWith('.or.', this.pos)) { tokens.push({ type: TokenType.LOGICAL_OR, value: '.or.', line: this.line }); this.pos += 4; continue; }
      if (this.code.startsWith('++', this.pos)) { tokens.push({ type: TokenType.INCREMENT, value: '++', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('--', this.pos)) { tokens.push({ type: TokenType.DECREMENT, value: '--', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('+=', this.pos)) { tokens.push({ type: TokenType.PLUS_ASSIGN, value: '+=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('-=', this.pos)) { tokens.push({ type: TokenType.MINUS_ASSIGN, value: '-=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('*=', this.pos)) { tokens.push({ type: TokenType.MUL_ASSIGN, value: '*=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('/=', this.pos)) { tokens.push({ type: TokenType.DIV_ASSIGN, value: '/=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('==', this.pos)) { tokens.push({ type: TokenType.EQUALS, value: '==', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('!=', this.pos)) { tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('<=', this.pos)) { tokens.push({ type: TokenType.LESS_EQUALS, value: '<=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('>=', this.pos)) { tokens.push({ type: TokenType.GREATER_EQUALS, value: '>=', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('**', this.pos)) { tokens.push({ type: TokenType.POWER, value: '**', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('//', this.pos)) { tokens.push({ type: TokenType.FLOOR_DIV, value: '//', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('<<', this.pos)) { tokens.push({ type: TokenType.LSHIFT, value: '<<', line: this.line }); this.pos += 2; continue; }
      if (this.code.startsWith('>>', this.pos)) { tokens.push({ type: TokenType.RSHIFT, value: '>>', line: this.line }); this.pos += 2; continue; }

      if (char === '=') { tokens.push({ type: TokenType.ASSIGN, value: '=', line: this.line }); this.pos++; continue; }
      if (char === '<') { tokens.push({ type: TokenType.LESS, value: '<', line: this.line }); this.pos++; continue; }
      if (char === '>') { tokens.push({ type: TokenType.GREATER, value: '>', line: this.line }); this.pos++; continue; }
      if (char === '+') { tokens.push({ type: TokenType.PLUS, value: '+', line: this.line }); this.pos++; continue; }
      if (char === '-') { tokens.push({ type: TokenType.MINUS, value: '-', line: this.line }); this.pos++; continue; }
      if (char === '*') { tokens.push({ type: TokenType.MULTIPLY, value: '*', line: this.line }); this.pos++; continue; }
      if (char === '/') { tokens.push({ type: TokenType.DIVIDE, value: '/', line: this.line }); this.pos++; continue; }
      if (char === '%') { tokens.push({ type: TokenType.MODULUS, value: '%', line: this.line }); this.pos++; continue; }
      if (char === '&') { tokens.push({ type: TokenType.BIT_AND, value: '&', line: this.line }); this.pos++; continue; }
      if (char === '|') { tokens.push({ type: TokenType.BIT_OR, value: '|', line: this.line }); this.pos++; continue; }
      if (char === '?') { tokens.push({ type: TokenType.TERNARY_QUESTION, value: '?', line: this.line }); this.pos++; continue; }
      if (char === ':') { tokens.push({ type: TokenType.COLON, value: ':', line: this.line }); this.pos++; continue; }
      if (char === ',') { tokens.push({ type: TokenType.COMMA, value: ',', line: this.line }); this.pos++; continue; }
      if (char === '.') { tokens.push({ type: TokenType.DOT, value: '.', line: this.line }); this.pos++; continue; }
      if (char === '(') { tokens.push({ type: TokenType.LPAREN, value: '(', line: this.line }); this.pos++; continue; }
      if (char === ')') { tokens.push({ type: TokenType.RPAREN, value: ')', line: this.line }); this.pos++; continue; }
      if (char === '{') { tokens.push({ type: TokenType.LBRACE, value: '{', line: this.line }); this.pos++; continue; }
      if (char === '}') { tokens.push({ type: TokenType.RBRACE, value: '}', line: this.line }); this.pos++; continue; }
      if (char === '[') { tokens.push({ type: TokenType.LBRACKET, value: '[', line: this.line }); this.pos++; continue; }
      if (char === ']') { tokens.push({ type: TokenType.RBRACKET, value: ']', line: this.line }); this.pos++; continue; }
      if (char === ';') { tokens.push({ type: TokenType.SEMICOLON, value: ';', line: this.line }); this.pos++; continue; }

      if (char === '"' || char === '“' || char === '”') {
        this.pos++;
        let str = '';
        while (this.pos < this.code.length && this.code[this.pos] !== '"' && this.code[this.pos] !== '“' && this.code[this.pos] !== '”') {
          str += this.code[this.pos];
          this.pos++;
        }
        this.pos++;
        tokens.push({ type: TokenType.STRING, value: str, line: this.line });
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
        tokens.push({ type: TokenType.STRING, value: str, line: this.line });
        continue;
      }

      if (/[0-9]/.test(char)) {
        let num = '';
        while (this.pos < this.code.length && /[0-9.]/.test(this.code[this.pos])) {
          num += this.code[this.pos];
          this.pos++;
        }
        tokens.push({ type: TokenType.NUMBER, value: num, line: this.line });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (this.pos < this.code.length && /[a-zA-Z0-9_]/.test(this.code[this.pos])) {
          ident += this.code[this.pos];
          this.pos++;
        }

        let type = TokenType.IDENTIFIER;
        if (ident === 'int') type = TokenType.INT;
        else if (ident === 'float') type = TokenType.FLOAT;
        else if (ident === 'double') type = TokenType.DOUBLE;
        else if (ident === 'short') type = TokenType.SHORT;
        else if (ident === 'long') type = TokenType.LONG;
        else if (ident === 'byte') type = TokenType.BYTE;
        else if (ident === 'void') type = TokenType.VOID;
        else if (ident === 'string') type = TokenType.STRING_TYPE;
        else if (ident === 'char') type = TokenType.CHAR;
        else if (ident === 'bool') type = TokenType.BOOL_TYPE;
        else if (ident === 'true' || ident === 'false') type = TokenType.BOOLEAN;
        else if (ident === 'if') type = TokenType.IF;
        else if (ident === 'then') type = TokenType.THEN;
        else if (ident === 'else') type = TokenType.ELSE;
        else if (ident === 'while') type = TokenType.WHILE;
        else if (ident === 'do') type = TokenType.DO;
        else if (ident === 'for') type = TokenType.FOR;
        else if (ident === 'break') type = TokenType.BREAK;
        else if (ident === 'continue') type = TokenType.CONTINUE;
        else if (ident === 'func') type = TokenType.FUNC;
        else if (ident === 'return') type = TokenType.RETURN;
        else if (ident === 'switch') type = TokenType.SWITCH;
        else if (ident === 'case') type = TokenType.CASE;
        else if (ident === 'default') type = TokenType.DEFAULT;
        else if (ident === 'try') type = TokenType.TRY;
        else if (ident === 'catch') type = TokenType.CATCH;
        else if (ident === 'System') type = TokenType.SYSTEM;
        else if (ident === 'console') type = TokenType.CONSOLE;
        else if (ident === 'out') type = TokenType.OUT;
        else if (ident === 'outf') type = TokenType.OUTF;
        else if (ident === 'in') type = TokenType.IN;
        else if (ident === 'any') type = TokenType.ANY;

        tokens.push({ type, value: ident, line: this.line });
        continue;
      }

      throw new Error(`[Linha ${this.line}] Caractere desconhecido: '${char}'`);
    }

    tokens.push({ type: TokenType.EOF, value: '', line: this.line });
    return tokens;
  }
}