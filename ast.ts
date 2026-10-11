export type ASTNode =
  | { type: 'VarDeclStatement'; varType: string; name: string; value: any }
  | { type: 'AssignStatement'; name: string; value: any }
  | { type: 'CompoundAssignStatement'; name: string; operator: string; value: any }
  | { type: 'ArrayAssignStatement'; name: string; index: any; value: any }
  | { type: 'IncrementStatement'; name: string; operator: '++' | '--' }
  | { type: 'ConsoleOutStatement'; message: any }
  | { type: 'ConsoleOutfStatement'; template: string }
  | { type: 'InputStatement'; varNames: string[] }
  | { type: 'IfStatement'; condition: any; thenBranch: ASTNode[]; elseIfs?: { condition: any; branch: ASTNode[] }[]; elseBranch?: ASTNode[] }
  | { type: 'WhileStatement'; condition: any; body: ASTNode[] }
  | { type: 'DoWhileStatement'; body: ASTNode[]; condition: any }
  | { type: 'ForStatement'; init: ASTNode; condition: any; update: ASTNode; body: ASTNode[] }
  | { type: 'FuncDeclStatement'; returnType: string; name: string; params: { type: string; name: string }[]; body: ASTNode[] }
  | { type: 'ReturnStatement'; value: any }
  | { type: 'SwitchStatement'; condition: any; cases: { value: any; body: ASTNode[] }[]; defaultBody?: ASTNode[] }
  | { type: 'TryStatement'; tryBody: ASTNode[]; catchVar: string; catchBody: ASTNode[] }
  | { type: 'BreakStatement' }
  | { type: 'ContinueStatement' }
  | { type: 'CallExpression'; name: string; args: any[] };
  
export interface PrintNode {
  type: 'PrintStatement';
  message: string;
}

export interface PrintVarNode {
  type: 'PrintVarStatement';
  varName: string;
}

export interface VarDeclNode {
  type: 'VarDeclStatement';
  varType: string;
  name: string;
  value: string | number;
}