import { ASTNode } from './ast';
import * as fs from 'fs';

class BreakSignal extends Error {}
class ContinueSignal extends Error {}
class ReturnSignal extends Error {
  constructor(public value: any) { super(); }
}

export class Interpreter {
  private variables: Map<string, any> = new Map();
  private functions: Map<string, { params: { type: string; name: string }[]; body: ASTNode[] }> = new Map();

  public execute(ast: ASTNode[]): void {
    this.variables.clear();
    this.functions.clear();

    for (const node of ast) {
      if (node.type === 'FuncDeclStatement') {
        this.functions.set(node.name, { params: node.params, body: node.body });
      }
    }

    if (!this.functions.has('main')) {
      throw new Error("[Erro Beta 1.0] Nenhuma função 'func main()' foi encontrada no programa.");
    }

    try {
      this.callFunction('main', []);
    } catch (e: any) {
      if (e instanceof ReturnSignal) return;
      console.error(`\n[Erro Crítico em Tempo de Execução]: ${e.message}`);
    }
  }

  private callFunction(name: string, args: any[]): any {
    const func = this.functions.get(name);
    if (!func) throw new Error(`Função '${name}' não declarada.`);

    const previousVariables = new Map(this.variables);
    for (let i = 0; i < func.params.length; i++) {
      this.variables.set(func.params[i].name, args[i]);
    }

    let returnValue: any = null;
    try {
      for (const stmt of func.body) {
        this.executeNode(stmt);
      }
    } catch (e: any) {
      if (e instanceof ReturnSignal) {
        returnValue = e.value;
      } else {
        throw e;
      }
    } finally {
      this.variables = previousVariables;
    }

    return returnValue;
  }

  private executeNode(node: ASTNode): void {
    switch (node.type) {
      case 'FuncDeclStatement':
        break;
      case 'ReturnStatement': {
        const val = this.evaluateExpression(node.value);
        throw new ReturnSignal(val);
      }
      case 'VarDeclStatement': {
        const val = this.evaluateExpression(node.value);
        this.variables.set(node.name, val);
        break;
      }
      case 'AssignStatement': {
        const val = this.evaluateExpression(node.value);
        this.variables.set(node.name, val);
        break;
      }
      case 'CompoundAssignStatement': {
        const current = this.variables.get(node.name) ?? 0;
        const val = this.evaluateExpression(node.value);
        let res = current;
        if (node.operator === '+=') res = current + val;
        else if (node.operator === '-=') res = current - val;
        else if (node.operator === '*=') res = current * val;
        else if (node.operator === '/=') res = current / val;
        this.variables.set(node.name, res);
        break;
      }
      case 'ArrayAssignStatement': {
        const arr = this.variables.get(node.name);
        if (!Array.isArray(arr)) throw new Error(`Variável '${node.name}' não é array.`);
        const index = this.evaluateExpression(node.index);
        const val = this.evaluateExpression(node.value);
        arr[index] = val;
        break;
      }
      case 'IncrementStatement': {
        const currentVal = this.variables.get(node.name) ?? 0;
        if (node.operator === '++') this.variables.set(node.name, currentVal + 1);
        else this.variables.set(node.name, currentVal - 1);
        break;
      }
      case 'ConsoleOutStatement': {
        const val = this.evaluateExpression(node.message);
        console.log(val);
        break;
      }
      case 'ConsoleOutfStatement': {
        const output = node.template.replace(/!\{([^}]+)\}/g, (_, exprStr) => {
          try {
            const trimmed = exprStr.trim();

            // 1. Trata funções nativas como len(var) dentro da interpolação
            const builtInMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.+)\)$/);
            if (builtInMatch) {
              const funcName = builtInMatch[1];
              const argName = builtInMatch[2].trim();
              if (funcName === 'len') {
                const target = this.variables.get(argName);
                if (Array.isArray(target) || typeof target === 'string') return target.length;
                return 0;
              }
            }

            // 2. Trata acesso por índice em array ex: !{numeros[0]}
            const arrayMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(.+)\]$/);
            if (arrayMatch) {
              const arrName = arrayMatch[1];
              const indexExpr = arrayMatch[2].trim();
              const arr = this.variables.get(arrName);

              if (Array.isArray(arr)) {
                const idx = this.variables.has(indexExpr)
                  ? this.variables.get(indexExpr)
                  : Number(indexExpr);
                return arr[idx] !== undefined ? arr[idx] : `[Índice inválido]`;
              }
            }

            // 3. Variável simples
            if (this.variables.has(trimmed)) {
              return this.variables.get(trimmed);
            }

            return `[Var '${trimmed}' não encontrada]`;
          } catch {
            return `[Erro]`;
          }
        });
        console.log(output);
        break;
      }
      case 'InputStatement': {
        const inputLine = this.promptSync();
        const parts = inputLine.trim().split(/\s+/);
        for (let i = 0; i < node.varNames.length; i++) {
          const varName = node.varNames[i];
          const rawVal = parts[i] !== undefined ? parts[i] : '';
          let parsedVal: any = rawVal.trim();
          if (!isNaN(Number(parsedVal)) && parsedVal !== '') parsedVal = Number(parsedVal);
          else if (parsedVal.toLowerCase() === 'true') parsedVal = true;
          else if (parsedVal.toLowerCase() === 'false') parsedVal = false;
          this.variables.set(varName, parsedVal);
        }
        break;
      }
      case 'IfStatement': {
        const conditionResult = this.evaluateExpression(node.condition);
        if (conditionResult) {
          for (const stmt of node.thenBranch) this.executeNode(stmt);
        } else {
          let executedElseIf = false;
          if (node.elseIfs) {
            for (const elseIf of node.elseIfs) {
              if (this.evaluateExpression(elseIf.condition)) {
                for (const stmt of elseIf.branch) this.executeNode(stmt);
                executedElseIf = true;
                break;
              }
            }
          }
          if (!executedElseIf && node.elseBranch) {
            for (const stmt of node.elseBranch) this.executeNode(stmt);
          }
        }
        break;
      }
      case 'SwitchStatement': {
        const condVal = this.evaluateExpression(node.condition);
        let matched = false;
        for (const c of node.cases) {
          if (this.evaluateExpression(c.value) === condVal) {
            for (const stmt of c.body) this.executeNode(stmt);
            matched = true;
            break;
          }
        }
        if (!matched && node.defaultBody) {
          for (const stmt of node.defaultBody) this.executeNode(stmt);
        }
        break;
      }
      case 'TryStatement': {
        try {
          for (const stmt of node.tryBody) this.executeNode(stmt);
        } catch (e: any) {
          const prev = new Map(this.variables);
          this.variables.set(node.catchVar, e.message || String(e));
          try {
            for (const stmt of node.catchBody) this.executeNode(stmt);
          } finally {
            this.variables = prev;
          }
        }
        break;
      }
      case 'WhileStatement': {
        while (this.evaluateExpression(node.condition)) {
          try {
            for (const stmt of node.body) this.executeNode(stmt);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        break;
      }
      case 'DoWhileStatement': {
        do {
          try {
            for (const stmt of node.body) this.executeNode(stmt);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        } while (this.evaluateExpression(node.condition));
        break;
      }
      case 'ForStatement': {
        this.executeNode(node.init);
        while (this.evaluateExpression(node.condition)) {
          try {
            for (const stmt of node.body) this.executeNode(stmt);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) {
              this.executeNode(node.update);
              continue;
            }
            throw e;
          }
          this.executeNode(node.update);
        }
        break;
      }
      case 'BreakStatement':
        throw new BreakSignal();
      case 'ContinueStatement':
        throw new ContinueSignal();
      default:
        if ((node as any).type === 'CallExpression') {
          this.evaluateExpression(node);
          break;
        }
        throw new Error(`Instrução desconhecida.`);
    }
  }

  private promptSync(): string {
    const buffer = Buffer.alloc(1024);
    let bytesRead = 0;
    try {
      bytesRead = fs.readSync(0, buffer, 0, 1024, null);
    } catch {
      return '';
    }
    return buffer.toString('utf8', 0, bytesRead).replace(/\r?\n$/, '');
  }

  private evaluateExpression(expr: any): any {
    if (expr === null || expr === undefined) return null;

    if (typeof expr === 'object' && expr.type === 'CallExpression') {
      const evaluatedArgs = expr.args.map((arg: any) => this.evaluateExpression(arg));
      
      // Funções Nativas Globais (Built-ins)
      if (expr.name === 'len') {
        const target = evaluatedArgs[0];
        if (Array.isArray(target) || typeof target === 'string') return target.length;
        return 0;
      }
      if (expr.name === 'toString') return String(evaluatedArgs[0]);
      if (expr.name === 'toInt') return Number(evaluatedArgs[0]) || 0;

      return this.callFunction(expr.name, evaluatedArgs);
    }

    if (typeof expr === 'object' && expr.type === 'VarRef') {
      const val = this.variables.get(expr.name);
      if (val === undefined) throw new Error(`Variável não declarada: '${expr.name}'`);
      return val;
    }

    if (typeof expr === 'object' && expr.type === 'ArrayAccess') {
      const arr = this.variables.get(expr.name);
      if (!Array.isArray(arr)) throw new Error(`Variável '${expr.name}' não é um array.`);
      const index = this.evaluateExpression(expr.index);
      return arr[index];
    }

    if (typeof expr === 'object' && expr.type === 'TernaryExpression') {
      const cond = this.evaluateExpression(expr.condition);
      return cond ? this.evaluateExpression(expr.consequence) : this.evaluateExpression(expr.alternative);
    }

    if (Array.isArray(expr)) {
      return expr.map((item) => this.evaluateExpression(item));
    }

    if (typeof expr === 'object' && expr.type === 'BinaryExpression') {
      const leftVal = this.evaluateExpression(expr.left);
      const rightVal = this.evaluateExpression(expr.right);

      switch (expr.operator) {
        case '+': return leftVal + rightVal;
        case '-': return leftVal - rightVal;
        case '*': return leftVal * rightVal;
        case '/': return leftVal - rightVal === 0 ? 0 : leftVal / rightVal;
        case '%': return leftVal % rightVal;
        case '**': return leftVal ** rightVal;
        case '//': return Math.floor(leftVal / rightVal);
        case '==': return leftVal === rightVal;
        case '!=': return leftVal !== rightVal;
        case '<': return leftVal < rightVal;
        case '>': return leftVal > rightVal;
        case '<=': return leftVal <= rightVal;
        case '>=': return leftVal >= rightVal;
        case '.and.': return Boolean(leftVal) && Boolean(rightVal);
        case '.or.': return Boolean(leftVal) || Boolean(rightVal);
        case '&': return Number(leftVal) & Number(rightVal);
        case '|': return Number(leftVal) | Number(rightVal);
        case '<<': return Number(leftVal) << Number(rightVal);
        case '>>': return Number(leftVal) >> Number(rightVal);
        default: throw new Error(`Operador desconhecido: ${expr.operator}`);
      }
    }

    return expr;
  }
}