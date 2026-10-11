#!/usr/bin/env node
import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';

const args = process.argv.slice(2);
const filePath = args[0] || 'programa.lz';

if (!fs.existsSync(filePath)) {
  console.error(`Erro: Arquivo '${filePath}' não encontrado.`);
  process.exit(1);
}

const code = fs.readFileSync(filePath, 'utf8');

try {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const interpreter = new Interpreter();
  interpreter.execute(ast);
} catch (e: any) {
  console.error(`Erro de Execução: ${e.message}`);
}