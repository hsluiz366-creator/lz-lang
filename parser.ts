import { Token, TokenType } from './tokens';
import { ASTNode } from './ast';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): ASTNode[] {
    const ast: ASTNode[] = [];

    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.EOF) {
      ast.push(this.parseStatement());
    }

    return ast;
  }

  private parseStatement(): ASTNode {
    const token = this.tokens[this.current];

    if (token.type === TokenType.IF) return this.parseIfStatement();
    if (token.type === TokenType.WHILE) return this.parseWhileStatement();
    if (token.type === TokenType.DO) return this.parseDoWhileStatement();
    if (token.type === TokenType.FOR) return this.parseForStatement();
    if (token.type === TokenType.SWITCH) return this.parseSwitchStatement();
    if (token.type === TokenType.TRY) return this.parseTryCatchStatement();
    if (token.type === TokenType.FUNC) return this.parseFuncDecl();

    if (token.type === TokenType.RETURN) {
      this.current++;
      let val = null;
      if (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.SEMICOLON) {
        val = this.parseExpression();
      }
      if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
      return { type: 'ReturnStatement', value: val };
    }

    if (token.type === TokenType.BREAK) {
      this.current++;
      if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
      return { type: 'BreakStatement' };
    }

    if (token.type === TokenType.CONTINUE) {
      this.current++;
      if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
      return { type: 'ContinueStatement' };
    }

    if (this.isTypeToken(token.type) || token.type === TokenType.VOID) {
      return this.parseVarDecl();
    }

    if (token.type === TokenType.IDENTIFIER) {
      const nextToken = this.tokens[this.current + 1];
      
      if (nextToken && nextToken.type === TokenType.LPAREN) {
        const name = token.value;
        this.current += 2;
        const args: any[] = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          if (this.tokens[this.current]?.type === TokenType.COMMA) this.current++;
        }
        this.expect(TokenType.RPAREN, "Esperado ')'");
        if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
        return { type: 'CallExpression', name, args } as any;
      }

      if (nextToken && [TokenType.INCREMENT, TokenType.DECREMENT].includes(nextToken.type)) {
        const name = token.value;
        const op = nextToken.value as '++' | '--';
        this.current += 2;
        if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
        return { type: 'IncrementStatement', name, operator: op };
      }

      if (nextToken && [TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, TokenType.MUL_ASSIGN, TokenType.DIV_ASSIGN].includes(nextToken.type)) {
        const name = token.value;
        const op = nextToken.value;
        this.current += 2;
        const value = this.parseExpression();
        if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
        return { type: 'CompoundAssignStatement', name, operator: op, value };
      }

      if (nextToken && nextToken.type === TokenType.LBRACKET) {
        const name = token.value;
        this.current += 2;
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET, "Esperado ']'");
        this.expect(TokenType.ASSIGN, "Esperado '='");
        const value = this.parseExpression();
        if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
        return { type: 'ArrayAssignStatement', name, index, value };
      }

      if (nextToken && nextToken.type === TokenType.ASSIGN) {
        const name = token.value;
        this.current += 2;
        const value = this.parseExpression();
        if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
        return { type: 'AssignStatement', name, value };
      }
    }

    if (token.type === TokenType.SYSTEM) {
      this.current++;
      this.expect(TokenType.DOT, "Esperado '.'");
      this.expectToken(TokenType.CONSOLE, "Esperado 'console'");
      this.expect(TokenType.DOT, "Esperado '.'");

      const methodToken = this.tokens[this.current];
      if (methodToken.type === TokenType.OUT) {
        this.current++;
        return this.parseConsoleOut();
      } else if (methodToken.type === TokenType.OUTF) {
        this.current++;
        return this.parseConsoleOutf();
      } else if (methodToken.type === TokenType.IN) {
        this.current++;
        return this.parseConsoleIn();
      }
      throw new Error(`Método desconhecido em System.console`);
    }

    throw new Error(`[Linha ${token.line}] Instrução desconhecida ou mal formatada: '${token.value}'`);
  }

  private parseFuncDecl(): ASTNode {
    this.current++; // func
    const nameToken = this.expect(TokenType.IDENTIFIER, "Esperado nome da função");
    const name = nameToken.value;

    this.expect(TokenType.LPAREN, "Esperado '('");
    const params: { type: string; name: string }[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RPAREN) {
      const pType = this.tokens[this.current].value;
      this.current++;
      const pName = this.expect(TokenType.IDENTIFIER, "Esperado nome do parâmetro").value;
      params.push({ type: pType, name: pName });
      if (this.tokens[this.current]?.type === TokenType.COMMA) this.current++;
    }
    this.expect(TokenType.RPAREN, "Esperado ')'");

    const retTypeToken = this.tokens[this.current];
    if (!this.isTypeToken(retTypeToken.type) && retTypeToken.type !== TokenType.VOID) {
      throw new Error(`[Linha ${retTypeToken.line}] Esperado tipo de retorno após a função`);
    }
    const returnType = retTypeToken.value;
    this.current++;

    this.expect(TokenType.LBRACE, "Esperado '{'");
    const body: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");

    return { type: 'FuncDeclStatement', returnType, name, params, body };
  }

  private parseSwitchStatement(): ASTNode {
    this.current++; // switch
    this.expect(TokenType.LPAREN, "Esperado '('");
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN, "Esperado ')'");
    this.expect(TokenType.LBRACE, "Esperado '{'");

    const cases: { value: any; body: ASTNode[] }[] = [];
    let defaultBody: ASTNode[] | undefined = undefined;

    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      const t = this.tokens[this.current];
      if (t.type === TokenType.CASE) {
        this.current++;
        const caseVal = this.parseExpression();
        if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.COLON) {
          this.current++;
        }
        const caseBody: ASTNode[] = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.CASE && this.tokens[this.current].type !== TokenType.DEFAULT && this.tokens[this.current].type !== TokenType.RBRACE) {
          caseBody.push(this.parseStatement());
        }
        cases.push({ value: caseVal, body: caseBody });
      } else if (t.type === TokenType.DEFAULT) {
        this.current++;
        if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.COLON) {
          this.current++;
        }
        defaultBody = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.CASE && this.tokens[this.current].type !== TokenType.RBRACE) {
          defaultBody.push(this.parseStatement());
        }
      } else {
        this.current++;
      }
    }
    this.expect(TokenType.RBRACE, "Esperado '}' no switch");

    return { type: 'SwitchStatement', condition, cases, defaultBody };
  }

  private parseTryCatchStatement(): ASTNode {
    this.current++; // try
    this.expect(TokenType.LBRACE, "Esperado '{' após try");
    const tryBody: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      tryBody.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");

    this.expectToken(TokenType.CATCH, "Esperado 'catch'");
    this.expect(TokenType.LPAREN, "Esperado '('");
    const catchVar = this.expect(TokenType.IDENTIFIER, "Esperado nome da variável de erro").value;
    this.expect(TokenType.RPAREN, "Esperado ')'");
    this.expect(TokenType.LBRACE, "Esperado '{'");

    const catchBody: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      catchBody.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");

    return { type: 'TryStatement', tryBody, catchVar, catchBody };
  }

  private parseVarDecl(): ASTNode {
    const typeToken = this.tokens[this.current];
    const varType = typeToken.value;
    this.current++;

    const nameToken = this.expect(TokenType.IDENTIFIER, "Esperado nome da variável");
    const name = nameToken.value;

    let value: any = null;
    if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.ASSIGN) {
      this.current++;
      if (this.tokens[this.current]?.type === TokenType.LBRACKET) {
        this.current++;
        const elements: any[] = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACKET) {
          elements.push(this.parseExpression());
          if (this.tokens[this.current]?.type === TokenType.COMMA) this.current++;
        }
        this.expect(TokenType.RBRACKET, "Esperado ']'");
        value = elements;
      } else {
        value = this.parseExpression();
      }
    } else {
      if (varType === 'string') value = '';
      else if (['int', 'float', 'double', 'short', 'long', 'byte', 'char'].includes(varType)) value = 0;
      else if (varType === 'bool') value = false;
    }

    if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.SEMICOLON) {
      this.current++;
    }

    return { type: 'VarDeclStatement', varType, name, value };
  }

  private parseConsoleIn(): ASTNode {
    this.expect(TokenType.LPAREN, "Esperado '('");
    const varNames: string[] = [];
    const firstVar = this.expect(TokenType.IDENTIFIER, "Esperado nome");
    varNames.push(firstVar.value);

    while (this.tokens[this.current]?.type === TokenType.COMMA) {
      this.current++;
      const nextVar = this.expect(TokenType.IDENTIFIER, "Esperado nome");
      varNames.push(nextVar.value);
    }

    this.expect(TokenType.RPAREN, "Esperado ')'");
    if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
    return { type: 'InputStatement', varNames };
  }

  private parseIfStatement(): ASTNode {
    this.current++;
    this.expect(TokenType.LPAREN, "Esperado '('");
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN, "Esperado ')'");
    this.expect(TokenType.THEN, "Esperado 'then'");
    this.expect(TokenType.LBRACE, "Esperado '{'");
    const thenBranch: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      thenBranch.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");

    const elseIfs: { condition: any; branch: ASTNode[] }[] = [];
    let elseBranch: ASTNode[] | undefined = undefined;

    while (this.tokens[this.current] && this.tokens[this.current].type === TokenType.ELSE) {
      this.current++;
      if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.IF) {
        this.current++;
        this.expect(TokenType.LPAREN, "Esperado '('");
        const elseIfCond = this.parseExpression();
        this.expect(TokenType.RPAREN, "Esperado ')'");
        this.expect(TokenType.THEN, "Esperado 'then'");
        this.expect(TokenType.LBRACE, "Esperado '{'");
        const elseIfBranch: ASTNode[] = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
          elseIfBranch.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE, "Esperado '}'");
        elseIfs.push({ condition: elseIfCond, branch: elseIfBranch });
      } else {
        this.expect(TokenType.THEN, "Esperado 'then'");
        this.expect(TokenType.LBRACE, "Esperado '{'");
        elseBranch = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
          elseBranch.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE, "Esperado '}'");
        break;
      }
    }

    return { type: 'IfStatement', condition, thenBranch, elseIfs, elseBranch };
  }

  private parseWhileStatement(): ASTNode {
    this.current++;
    this.expect(TokenType.LPAREN, "Esperado '('");
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN, "Esperado ')'");
    this.expect(TokenType.THEN, "Esperado 'then'");
    this.expect(TokenType.LBRACE, "Esperado '{'");
    const body: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");
    return { type: 'WhileStatement', condition, body };
  }

  private parseDoWhileStatement(): ASTNode {
    this.current++;
    this.expect(TokenType.LBRACE, "Esperado '{'");
    const body: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");
    this.expectToken(TokenType.WHILE, "Esperado 'while'");
    this.expect(TokenType.LPAREN, "Esperado '('");
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN, "Esperado ')'");
    if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
    return { type: 'DoWhileStatement', body, condition };
  }

  private parseForStatement(): ASTNode {
    this.current++;
    this.expect(TokenType.LPAREN, "Esperado '('");
    let init: ASTNode;
    if (this.isTypeToken(this.tokens[this.current].type)) {
      init = this.parseVarDecl();
    } else {
      const name = this.expect(TokenType.IDENTIFIER, "Esperado variável").value;
      this.expect(TokenType.ASSIGN, "Esperado '='");
      const val = this.parseExpression();
      this.expect(TokenType.SEMICOLON, "Esperado ';'");
      init = { type: 'VarDeclStatement', varType: 'int', name, value: val };
    }
    const condition = this.parseExpression();
    this.expect(TokenType.SEMICOLON, "Esperado ';'");
    let update: ASTNode;
    const updateId = this.expect(TokenType.IDENTIFIER, "Esperado id").value;
    const op = this.tokens[this.current].value as '++' | '--';
    if (op === '++' || op === '--') {
      this.current++;
      update = { type: 'IncrementStatement', name: updateId, operator: op };
    } else {
      this.expect(TokenType.ASSIGN, "Esperado '='");
      const val = this.parseExpression();
      update = { type: 'AssignStatement', name: updateId, value: val };
    }
    this.expect(TokenType.RPAREN, "Esperado ')'");
    this.expect(TokenType.THEN, "Esperado 'then'");
    this.expect(TokenType.LBRACE, "Esperado '{'");
    const body: ASTNode[] = [];
    while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RBRACE && this.tokens[this.current].type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE, "Esperado '}'");
    return { type: 'ForStatement', init, condition, update, body };
  }

  private parseConsoleOut(): ASTNode {
    this.expect(TokenType.LPAREN, "Esperado '('");
    let expr = this.parseExpression();
    this.expect(TokenType.RPAREN, "Esperado ')'");
    if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
    return { type: 'ConsoleOutStatement', message: expr };
  }

  private parseConsoleOutf(): ASTNode {
    this.expect(TokenType.LPAREN, "Esperado '('");
    const strToken = this.expect(TokenType.STRING, "Esperada string");
    this.expect(TokenType.RPAREN, "Esperado ')'");
    if (this.tokens[this.current]?.type === TokenType.SEMICOLON) this.current++;
    return { type: 'ConsoleOutfStatement', template: strToken.value };
  }

  private parseExpression(): any {
    let expr = this.parseLogicalOr();
    if (this.tokens[this.current] && this.tokens[this.current].type === TokenType.TERNARY_QUESTION) {
      this.current++;
      const consequence = this.parseExpression();
      this.expect(TokenType.TERNARY_COLON, "Esperado ':'");
      const alternative = this.parseExpression();
      return { type: 'TernaryExpression', condition: expr, consequence, alternative };
    }
    return expr;
  }

  private parseLogicalOr(): any {
    let left = this.parseLogicalAnd();
    while (this.tokens[this.current]?.type === TokenType.LOGICAL_OR) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseLogicalAnd() };
    }
    return left;
  }

  private parseLogicalAnd(): any {
    let left = this.parseBitwise();
    while (this.tokens[this.current]?.type === TokenType.LOGICAL_AND) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseBitwise() };
    }
    return left;
  }

  private parseBitwise(): any {
    let left = this.parseEquality();
    while (this.tokens[this.current] && [TokenType.BIT_AND, TokenType.BIT_OR, TokenType.LSHIFT, TokenType.RSHIFT].includes(this.tokens[this.current].type)) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): any {
    let left = this.parseComparison();
    while (this.tokens[this.current] && [TokenType.EQUALS, TokenType.NOT_EQUALS].includes(this.tokens[this.current].type)) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): any {
    let left = this.parseTerm();
    while (this.tokens[this.current] && [TokenType.LESS, TokenType.GREATER, TokenType.LESS_EQUALS, TokenType.GREATER_EQUALS].includes(this.tokens[this.current].type)) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseTerm() };
    }
    return left;
  }

  private parseTerm(): any {
    let left = this.parseFactor();
    while (this.tokens[this.current] && [TokenType.PLUS, TokenType.MINUS].includes(this.tokens[this.current].type)) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parseFactor() };
    }
    return left;
  }

  private parseFactor(): any {
    let left = this.parsePrimary();
    while (this.tokens[this.current] && [TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.POWER, TokenType.FLOOR_DIV, TokenType.MODULUS].includes(this.tokens[this.current].type)) {
      const op = this.tokens[this.current];
      this.current++;
      left = { type: 'BinaryExpression', operator: op.value, left, right: this.parsePrimary() };
    }
    return left;
  }

  private parsePrimary(): any {
    const token = this.tokens[this.current];
    if (token.type === TokenType.STRING) { this.current++; return token.value; }
    if (token.type === TokenType.BOOLEAN) { this.current++; return token.value === 'true'; }
    if (token.type === TokenType.NUMBER) { this.current++; return Number(token.value); }

    if (token.type === TokenType.IDENTIFIER) {
      const name = token.value;
      this.current++;
      
      if (this.tokens[this.current]?.type === TokenType.LPAREN) {
        this.current++;
        const args: any[] = [];
        while (this.tokens[this.current] && this.tokens[this.current].type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          if (this.tokens[this.current]?.type === TokenType.COMMA) this.current++;
        }
        this.expect(TokenType.RPAREN, "Esperado ')'");
        return { type: 'CallExpression', name, args };
      }

      if (this.tokens[this.current]?.type === TokenType.LBRACKET) {
        this.current++;
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET, "Esperado ']'");
        return { type: 'ArrayAccess', name, index };
      }
      return { type: 'VarRef', name };
    }

    if (token.type === TokenType.LPAREN) {
      this.current++;
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, "Esperado ')'");
      return expr;
    }
    throw new Error(`[Linha ${token.line}] Expressão inválida em '${token.value}'`);
  }

  private isTypeToken(type: TokenType): boolean {
    return [
      TokenType.INT, TokenType.FLOAT, TokenType.DOUBLE, TokenType.SHORT,
      TokenType.LONG, TokenType.BYTE, TokenType.VOID, TokenType.STRING_TYPE,
      TokenType.CHAR, TokenType.BOOL_TYPE, TokenType.ANY
    ].includes(type);
  }

  private expectToken(type: TokenType, msg: string): Token {
    const token = this.tokens[this.current];
    if (!token || token.type !== type) throw new Error(`[Linha ${token?.line || 1}] ${msg}`);
    this.current++;
    return token;
  }

  private expect(type: TokenType, msg: string): Token {
    const token = this.tokens[this.current];
    if (!token || token.type !== type) throw new Error(`[Linha ${token?.line || 1}] ${msg}`);
    this.current++;
    return token;
  }
}