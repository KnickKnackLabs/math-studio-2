import { gcd, isPrime, lcm } from "../instruments/gcd-lcm/math";
import { primeValuation, removePrimePowers } from "../visualization/encoding";

export interface FieldInputs {
  x: number;
  xi: number;
  y: number;
  yi: number;
}

export interface FieldProgram {
  readonly evaluate: (inputs: FieldInputs) => number;
  readonly id: string;
  readonly label: string;
  readonly source: string;
}

interface Token {
  kind: "eof" | "identifier" | "number" | "operator";
  position: number;
  value: string;
}

type Evaluator = (inputs: FieldInputs) => number;

interface FieldFunction {
  arity: number;
  evaluate: (...values: number[]) => number;
}

function truth(value: boolean): number {
  return value ? 1 : 0;
}

function euclideanMod(left: number, right: number): number {
  if (right === 0) return 0;
  const denominator = Math.abs(right);
  return ((left % denominator) + denominator) % denominator;
}

function divisorCount(value: number): number {
  if (!Number.isSafeInteger(value)) return 0;
  const target = Math.abs(value);
  if (target === 0) return 0;
  let count = 0;
  for (let divisor = 1; divisor * divisor <= target; divisor += 1) {
    if (target % divisor !== 0) continue;
    count += divisor * divisor === target ? 1 : 2;
  }
  return count;
}

const FIELD_FUNCTIONS: Readonly<Record<string, FieldFunction>> = {
  abs: { arity: 1, evaluate: Math.abs },
  coprime: { arity: 2, evaluate: (left, right) => truth(gcd(left, right) === 1) },
  divides: {
    arity: 2,
    evaluate: (left, right) => truth(left !== 0 && Number.isSafeInteger(left) && Number.isSafeInteger(right) && right % left === 0),
  },
  divisors: { arity: 1, evaluate: divisorCount },
  gcd: { arity: 2, evaluate: gcd },
  if: { arity: 3, evaluate: (condition, yes, no) => condition !== 0 ? yes : no },
  lcm: { arity: 2, evaluate: lcm },
  max: { arity: 2, evaluate: Math.max },
  min: { arity: 2, evaluate: Math.min },
  mod: { arity: 2, evaluate: euclideanMod },
  prime: { arity: 1, evaluate: (value) => truth(isPrime(value)) },
  remove: {
    arity: 3,
    evaluate: (value, prime, depth) => removePrimePowers(value, prime, depth).value,
  },
  strip: {
    arity: 2,
    evaluate: (value, prime) => removePrimePowers(value, prime, null).value,
  },
  valuation: { arity: 2, evaluate: primeValuation },
  xor: {
    arity: 2,
    evaluate: (left, right) => Number.isSafeInteger(left) && Number.isSafeInteger(right)
      ? (left | 0) ^ (right | 0)
      : 0,
  },
};

class Lexer {
  private position = 0;

  constructor(private readonly source: string) {}

  next(): Token {
    while (/\s/.test(this.source[this.position] ?? "")) this.position += 1;
    const position = this.position;
    if (position >= this.source.length) return { kind: "eof", position, value: "" };

    const rest = this.source.slice(position);
    const number = rest.match(/^\d+(?:\.\d+)?/);
    if (number) {
      this.position += number[0].length;
      return { kind: "number", position, value: number[0] };
    }

    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      this.position += identifier[0].length;
      return { kind: "identifier", position, value: identifier[0] };
    }

    const pair = rest.slice(0, 2);
    if (["==", "!=", "<=", ">="].includes(pair)) {
      this.position += 2;
      return { kind: "operator", position, value: pair };
    }

    const value = this.source[position];
    if ("()+-*/%,<>!".includes(value)) {
      this.position += 1;
      return { kind: "operator", position, value };
    }

    throw new SyntaxError(`unexpected ${JSON.stringify(value)} at column ${position + 1}`);
  }
}

class Parser {
  private token: Token;

  constructor(private readonly lexer: Lexer) {
    this.token = lexer.next();
  }

  parse(): Evaluator {
    const expression = this.comparison();
    if (this.token.kind !== "eof") this.fail(`unexpected ${JSON.stringify(this.token.value)}`);
    return expression;
  }

  private comparison(): Evaluator {
    let left = this.additive();
    while (["==", "!=", "<", "<=", ">", ">="].includes(this.token.value)) {
      const operator = this.consume().value;
      const right = this.additive();
      const previous = left;
      left = (inputs) => {
        const leftValue = previous(inputs);
        const rightValue = right(inputs);
        if (operator === "==") return truth(leftValue === rightValue);
        if (operator === "!=") return truth(leftValue !== rightValue);
        if (operator === "<") return truth(leftValue < rightValue);
        if (operator === "<=") return truth(leftValue <= rightValue);
        if (operator === ">") return truth(leftValue > rightValue);
        return truth(leftValue >= rightValue);
      };
    }
    return left;
  }

  private additive(): Evaluator {
    let left = this.multiplicative();
    while (this.token.value === "+" || this.token.value === "-") {
      const operator = this.consume().value;
      const right = this.multiplicative();
      const previous = left;
      left = operator === "+"
        ? (inputs) => previous(inputs) + right(inputs)
        : (inputs) => previous(inputs) - right(inputs);
    }
    return left;
  }

  private multiplicative(): Evaluator {
    let left = this.unary();
    while (["*", "/", "%"].includes(this.token.value)) {
      const operator = this.consume().value;
      const right = this.unary();
      const previous = left;
      if (operator === "*") left = (inputs) => previous(inputs) * right(inputs);
      if (operator === "/") {
        left = (inputs) => {
          const denominator = right(inputs);
          return denominator === 0 ? 0 : previous(inputs) / denominator;
        };
      }
      if (operator === "%") left = (inputs) => euclideanMod(previous(inputs), right(inputs));
    }
    return left;
  }

  private unary(): Evaluator {
    if (["+", "-", "!"].includes(this.token.value)) {
      const operator = this.consume().value;
      const operand = this.unary();
      if (operator === "+") return operand;
      if (operator === "-") return (inputs) => -operand(inputs);
      return (inputs) => truth(operand(inputs) === 0);
    }
    return this.primary();
  }

  private primary(): Evaluator {
    if (this.token.kind === "number") {
      const value = Number(this.consume().value);
      return () => value;
    }

    if (this.token.kind === "identifier") {
      const name = this.consume().value;
      if (this.token.value !== "(") {
        if (!["x", "y", "xi", "yi"].includes(name)) this.fail(`unknown variable ${JSON.stringify(name)}`);
        return (inputs) => inputs[name as keyof FieldInputs];
      }

      this.expect("(");
      const arguments_: Evaluator[] = [];
      if (!this.at(")")) {
        do {
          arguments_.push(this.comparison());
          if (!this.at(",")) break;
          this.consume();
        } while (true);
      }
      this.expect(")");

      const fieldFunction = FIELD_FUNCTIONS[name];
      if (!fieldFunction) this.fail(`unknown function ${JSON.stringify(name)}`);
      if (arguments_.length !== fieldFunction.arity) {
        this.fail(`${name} expects ${fieldFunction.arity} argument${fieldFunction.arity === 1 ? "" : "s"}`);
      }
      return (inputs) => fieldFunction.evaluate(...arguments_.map((argument) => argument(inputs)));
    }

    if (this.token.value === "(") {
      this.consume();
      const expression = this.comparison();
      this.expect(")");
      return expression;
    }

    this.fail("expected a number, variable, function, or parenthesized expression");
  }

  private at(value: string): boolean {
    return this.token.value === value;
  }

  private expect(value: string): void {
    if (!this.at(value)) this.fail(`expected ${JSON.stringify(value)}`);
    this.consume();
  }

  private consume(): Token {
    const current = this.token;
    this.token = this.lexer.next();
    return current;
  }

  private fail(message: string): never {
    throw new SyntaxError(`${message} at column ${this.token.position + 1}`);
  }
}

export function defineField(id: string, label: string, source: string): FieldProgram {
  const trimmed = source.trim();
  if (!trimmed) throw new SyntaxError("formula cannot be empty");
  const evaluate = new Parser(new Lexer(trimmed)).parse();
  return { evaluate, id, label, source: trimmed };
}

export function evaluateField(field: FieldProgram, inputs: FieldInputs): number {
  try {
    const value = field.evaluate(inputs);
    return Number.isFinite(value) ? (Object.is(value, -0) ? 0 : value) : 0;
  } catch {
    return 0;
  }
}

export const FIELD_PRESETS: readonly FieldProgram[] = [
  defineField("gcd", "GCD", "gcd(x, y)"),
  defineField("lcm", "LCM", "lcm(x, y)"),
  defineField("sum", "Sum", "x + y"),
  defineField("product", "Product", "x * y"),
  defineField("distance", "Distance", "abs(x - y)"),
  defineField("coprime", "Coprime", "coprime(x, y)"),
  defineField("remainder", "Remainder", "mod(x, y)"),
  defineField("prime-sum", "Prime sum", "prime(abs(x) + abs(y))"),
  defineField("common-divisors", "Shared divisors", "divisors(gcd(x, y))"),
  defineField("xor", "Bitwise XOR", "xor(x, y)"),
];

export function fieldPreset(id: string): FieldProgram {
  const field = FIELD_PRESETS.find((candidate) => candidate.id === id);
  if (!field) throw new RangeError(`unknown field preset: ${id}`);
  return field;
}
