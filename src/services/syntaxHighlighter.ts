import { SupportedLanguage, Diagnostic } from '../types/ide';

export function detectLanguageByFilename(filename: string): SupportedLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py':
    case 'pyw':
    case 'ipynb':
      return 'python';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    default:
      return 'text';
  }
}

export interface SyntaxToken {
  type:
    | 'keyword'
    | 'type'
    | 'string'
    | 'number'
    | 'comment'
    | 'function'
    | 'operator'
    | 'decorator'
    | 'punctuation'
    | 'text';
  text: string;
}

const PYTHON_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while',
  'break', 'continue', 'in', 'is', 'not', 'and', 'or', 'with', 'try', 'except', 'finally',
  'raise', 'assert', 'yield', 'lambda', 'global', 'nonlocal', 'pass', 'async', 'await',
  'True', 'False', 'None'
]);

const PYTHON_BUILTINS = new Set([
  'print', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple',
  'open', 'sum', 'min', 'max', 'enumerate', 'zip', 'map', 'filter', 'abs', 'round',
  'isinstance', 'issubclass', 'type', 'super', 'iter', 'next', 'help', 'dir', 'id'
]);

const RUST_KEYWORDS = new Set([
  'fn', 'let', 'mut', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'match',
  'if', 'else', 'loop', 'while', 'for', 'in', 'return', 'break', 'continue', 'where',
  'type', 'const', 'static', 'unsafe', 'extern', 'async', 'await', 'move', 'ref', 'self',
  'Self', 'true', 'false'
]);

const RUST_TYPES = new Set([
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc',
  'Some', 'None', 'Ok', 'Err'
]);

const GO_KEYWORDS = new Set([
  'package', 'import', 'func', 'type', 'struct', 'interface', 'var', 'const', 'return',
  'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'go', 'select', 'chan',
  'defer', 'break', 'continue', 'fallthrough', 'goto', 'true', 'false', 'nil', 'iota'
]);

const GO_TYPES = new Set([
  'string', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32',
  'uint64', 'uintptr', 'float32', 'float64', 'complex64', 'complex128', 'bool', 'byte',
  'rune', 'error', 'any'
]);

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record', 'true',
  'false', 'null'
]);

const JAVA_TYPES = new Set([
  'String', 'Integer', 'Double', 'Boolean', 'Character', 'Float', 'Long', 'Short', 'Byte',
  'Object', 'System', 'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet', 'Arrays',
  'Collections', 'Stream', 'Collectors', 'Optional'
]);

export function highlightLine(line: string, language: SupportedLanguage): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i];

    // Single line comments
    if (
      (language === 'python' || language === 'yaml' || language === 'bash') &&
      ch === '#'
    ) {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    if (
      (language === 'rust' || language === 'go' || language === 'java') &&
      ch === '/' &&
      i + 1 < n &&
      line[i + 1] === '/'
    ) {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // Decorators / Annotations (@override, @derive)
    if (ch === '@' && (language === 'python' || language === 'java' || language === 'rust')) {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_]/.test(line[j])) j++;
      tokens.push({ type: 'decorator', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Strings: double quote or single quote or backtick
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      // Handle python triple quotes
      const isTriple =
        line.slice(i, i + 3) === '"""' || line.slice(i, i + 3) === "'''";
      if (isTriple) {
        const triQuote = line.slice(i, i + 3);
        const endIdx = line.indexOf(triQuote, i + 3);
        if (endIdx !== -1) {
          j = endIdx + 3;
        } else {
          j = n;
        }
      } else {
        while (j < n) {
          if (line[j] === '\\') {
            j += 2;
            continue;
          }
          if (line[j] === quote) {
            j++;
            break;
          }
          j++;
        }
      }
      tokens.push({ type: 'string', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_]/.test(line[i - 1]))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObB._]/.test(line[j])) j++;
      tokens.push({ type: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers & keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);

      let tokenType: SyntaxToken['type'] = 'text';

      if (language === 'python') {
        if (PYTHON_KEYWORDS.has(word)) tokenType = 'keyword';
        else if (PYTHON_BUILTINS.has(word)) tokenType = 'type';
        else if (j < n && line[j] === '(') tokenType = 'function';
      } else if (language === 'rust') {
        if (RUST_KEYWORDS.has(word)) tokenType = 'keyword';
        else if (RUST_TYPES.has(word)) tokenType = 'type';
        else if (j < n && (line[j] === '(' || (line[j] === '!' && j + 1 < n && line[j + 1] === '('))) {
          tokenType = 'function';
        }
      } else if (language === 'go') {
        if (GO_KEYWORDS.has(word)) tokenType = 'keyword';
        else if (GO_TYPES.has(word)) tokenType = 'type';
        else if (j < n && line[j] === '(') tokenType = 'function';
      } else if (language === 'java') {
        if (JAVA_KEYWORDS.has(word)) tokenType = 'keyword';
        else if (JAVA_TYPES.has(word)) tokenType = 'type';
        else if (j < n && line[j] === '(') tokenType = 'function';
      } else if (language === 'yaml') {
        if (j < n && line[j] === ':') tokenType = 'keyword';
      }

      tokens.push({ type: tokenType, text: word });
      i = j;
      continue;
    }

    // Operators & Punctuation
    if (/[+\-*/%=<>!&|^~?:;,.]/.test(ch)) {
      tokens.push({ type: 'operator', text: ch });
      i++;
      continue;
    }

    // Brackets
    if (/[{}()[\]]/.test(ch)) {
      tokens.push({ type: 'punctuation', text: ch });
      i++;
      continue;
    }

    // Whitespace or plain characters
    tokens.push({ type: 'text', text: ch });
    i++;
  }

  return tokens;
}

export function analyzeSyntaxDiagnostics(code: string, language: SupportedLanguage): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = code.split('\n');

  // Check bracket balance
  const stack: { char: string; line: number; col: number }[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

  lines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1;
    let inString = false;
    let stringChar = '';

    for (let colIdx = 0; colIdx < lineText.length; colIdx++) {
      const c = lineText[colIdx];

      // Comment bypass
      if (
        (language === 'python' || language === 'yaml') &&
        c === '#' &&
        !inString
      ) {
        break;
      }
      if (
        (language === 'rust' || language === 'go' || language === 'java') &&
        c === '/' &&
        lineText[colIdx + 1] === '/' &&
        !inString
      ) {
        break;
      }

      if ((c === '"' || c === "'") && (colIdx === 0 || lineText[colIdx - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = c;
        } else if (stringChar === c) {
          inString = false;
        }
        continue;
      }

      if (!inString) {
        if (c === '(' || c === '{' || c === '[') {
          stack.push({ char: c, line: lineNum, col: colIdx + 1 });
        } else if (c === ')' || c === '}' || c === ']') {
          const expected = pairs[c];
          if (stack.length === 0 || stack[stack.length - 1].char !== expected) {
            diagnostics.push({
              line: lineNum,
              column: colIdx + 1,
              message: `Mismatched closing bracket '${c}'`,
              severity: 'error',
              source: 'syntax-linter',
            });
          } else {
            stack.pop();
          }
        }
      }
    }

    // Language specific line inspections
    const trimmed = lineText.trim();
    if (language === 'python') {
      if (
        (trimmed.startsWith('def ') ||
          trimmed.startsWith('class ') ||
          trimmed.startsWith('if ') ||
          trimmed.startsWith('elif ') ||
          trimmed.startsWith('else:') ||
          trimmed.startsWith('for ') ||
          trimmed.startsWith('while ') ||
          trimmed.startsWith('try:') ||
          trimmed.startsWith('except')) &&
        !trimmed.endsWith(':') &&
        !trimmed.endsWith('\\') &&
        !trimmed.includes('#')
      ) {
        diagnostics.push({
          line: lineNum,
          column: lineText.length,
          message: `Expected ':' at the end of block statement`,
          severity: 'warning',
          source: 'py-validator',
        });
      }
    } else if (language === 'rust' || language === 'java') {
      if (
        trimmed.length > 0 &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('#[') &&
        !trimmed.startsWith('@') &&
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.endsWith(':') &&
        !trimmed.endsWith(',') &&
        !trimmed.startsWith('pub enum') &&
        !trimmed.startsWith('pub struct')
      ) {
        // Potential missing semicolon
        if (
          trimmed.startsWith('let ') ||
          trimmed.startsWith('return ') ||
          trimmed.includes('System.out.print') ||
          trimmed.includes('println!')
        ) {
          diagnostics.push({
            line: lineNum,
            column: lineText.length,
            message: `Missing semicolon ';' at end of line`,
            severity: 'error',
            source: `${language}-compiler`,
          });
        }
      }
    }
  });

  // Report unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    diagnostics.push({
      line: unclosed.line,
      column: unclosed.col,
      message: `Unclosed delimiter '${unclosed.char}'`,
      severity: 'error',
      source: 'syntax-linter',
    });
  }

  return diagnostics;
}
