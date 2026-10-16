// A deliberately tiny SQL engine over the résumé, a nod to text-to-SQL work.
// Supports:  SHOW TABLES · DESCRIBE <t>
//            SELECT <cols|*|COUNT(*)> FROM <t>
//              [WHERE <col> <op> <value> [AND|OR ...]]
//              [ORDER BY <col> [ASC|DESC]] [LIMIT <n>]
// ops: = != <> < > <= >= LIKE ILIKE

import { experience, links, projects, skills } from "./content";

type Value = string | number | boolean;
type Row = Record<string, Value>;

export const tables: Record<string, Row[]> = {
  projects: projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    kind: p.kind,
    year: p.year,
    stack: p.stack.join(", "),
    summary: p.summary,
  })),
  experience: experience.map((r) => ({ org: r.org, title: r.title, kind: r.kind, current: !!r.current })),
  skills: skills.map((s) => ({ name: s.name, area: s.area })),
  links: Object.entries(links).map(([site, url]) => ({ site, url })),
};

export interface Result {
  columns: string[];
  rows: Row[];
}

export class SqlError extends Error {}

// Tokens: quoted strings, numbers, operators, words, punctuation.
const TOKEN = /\s*('(?:[^']|'')*'|"(?:[^"]|"")*"|\d+(?:\.\d+)?|<=|>=|<>|!=|[=<>(),*;]|[A-Za-z_][\w.]*)/y;

function tokenize(sql: string): string[] {
  const out: string[] = [];
  TOKEN.lastIndex = 0;
  let i = 0;
  while (i < sql.length) {
    if (/^\s*$/.test(sql.slice(i))) break;
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(sql);
    if (!m) throw new SqlError(`syntax error near "${sql.slice(i).trim().slice(0, 12)}"`);
    out.push(m[1]);
    i = TOKEN.lastIndex;
  }
  if (out[out.length - 1] === ";") out.pop();
  return out;
}

class Parser {
  private i = 0;
  constructor(private readonly t: string[]) {}

  peek(): string | undefined {
    return this.t[this.i];
  }
  kw(word: string): boolean {
    if (this.peek()?.toUpperCase() === word) {
      this.i++;
      return true;
    }
    return false;
  }
  expect(word: string) {
    if (!this.kw(word)) throw new SqlError(`expected ${word}${this.peek() ? ` near "${this.peek()}"` : ""}`);
  }
  next(what: string): string {
    const tok = this.t[this.i++];
    if (tok === undefined) throw new SqlError(`expected ${what} but the query ended`);
    return tok;
  }
  done() {
    if (this.i < this.t.length) throw new SqlError(`unexpected "${this.peek()}"`);
  }
}

function table(name: string): Row[] {
  const rows = tables[name.toLowerCase()];
  if (!rows) throw new SqlError(`no such table: ${name}. try SHOW TABLES`);
  return rows;
}

function literal(tok: string): Value {
  if (/^'.*'$|^".*"$/.test(tok)) return tok.slice(1, -1).replace(/''|""/g, (q) => q[0]);
  if (/^\d/.test(tok)) return Number(tok);
  if (/^(true|false)$/i.test(tok)) return tok.toLowerCase() === "true";
  throw new SqlError(`expected a value but got "${tok}" (quote strings: 'like this')`);
}

function column(rows: Row[], name: string, tableName: string): string {
  const cols = Object.keys(rows[0] ?? {});
  const hit = cols.find((c) => c.toLowerCase() === name.toLowerCase());
  if (!hit) throw new SqlError(`no column "${name}" in ${tableName}. columns: ${cols.join(", ")}`);
  return hit;
}

function compare(a: Value, op: string, b: Value): boolean {
  if (op === "LIKE" || op === "ILIKE") {
    const pattern = String(b)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*")
      .replace(/_/g, ".");
    // Both are case-insensitive here; nobody should lose a match to casing.
    return new RegExp(`^${pattern}$`, "i").test(String(a));
  }
  const x = typeof a === "string" && typeof b === "string" ? a.toLowerCase() : a;
  const y = typeof a === "string" && typeof b === "string" ? b.toLowerCase() : b;
  switch (op) {
    case "=": return x === y;
    case "!=":
    case "<>": return x !== y;
    case "<": return x < y;
    case ">": return x > y;
    case "<=": return x <= y;
    case ">=": return x >= y;
  }
  throw new SqlError(`unknown operator ${op}`);
}

export function query(sql: string): Result {
  const p = new Parser(tokenize(sql));

  if (p.kw("SHOW")) {
    p.expect("TABLES");
    p.done();
    return {
      columns: ["table", "rows"],
      rows: Object.entries(tables).map(([t, rows]) => ({ table: t, rows: rows.length })),
    };
  }

  if (p.kw("DESCRIBE") || p.kw("DESC")) {
    const name = p.next("a table name");
    p.done();
    const rows = table(name);
    return {
      columns: ["column", "type", "example"],
      rows: Object.entries(rows[0]).map(([c, v]) => ({
        column: c,
        type: typeof v === "number" ? "int" : typeof v === "boolean" ? "bool" : "text",
        example: String(v).length > 28 ? String(v).slice(0, 27) + "…" : v,
      })),
    };
  }

  p.expect("SELECT");
  const picked: string[] = [];
  let count = false;
  do {
    const tok = p.next("a column");
    if (tok.toUpperCase() === "COUNT") {
      p.expect("(");
      p.next("*");
      p.expect(")");
      count = true;
    } else picked.push(tok);
  } while (p.kw(","));

  p.expect("FROM");
  const tableName = p.next("a table name");
  let rows = table(tableName);

  if (p.kw("WHERE")) {
    const conds: { col: string; op: string; val: Value; join: "AND" | "OR" }[] = [];
    let join: "AND" | "OR" = "AND";
    do {
      const col = column(rows, p.next("a column"), tableName);
      const opTok = p.next("an operator").toUpperCase();
      if (!["=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "ILIKE"].includes(opTok))
        throw new SqlError(`unsupported operator "${opTok}"`);
      conds.push({ col, op: opTok, val: literal(p.next("a value")), join });
      const nextJoin = p.kw("AND") ? "AND" : p.kw("OR") ? "OR" : null;
      if (!nextJoin) break;
      join = nextJoin;
    } while (true);
    // Left to right, which is enough for a résumé.
    rows = rows.filter((r) =>
      conds.reduce<boolean>((acc, c, idx) => {
        const hit = compare(r[c.col], c.op, c.val);
        if (idx === 0) return hit;
        return c.join === "AND" ? acc && hit : acc || hit;
      }, true),
    );
  }

  if (p.kw("ORDER")) {
    p.expect("BY");
    const col = column(table(tableName), p.next("a column"), tableName);
    const dir = p.kw("DESC") ? -1 : (p.kw("ASC"), 1);
    rows = [...rows].sort((a, b) => (a[col] < b[col] ? -dir : a[col] > b[col] ? dir : 0));
  }

  if (p.kw("LIMIT")) {
    const n = Number(p.next("a number"));
    if (!Number.isInteger(n) || n < 0) throw new SqlError("LIMIT needs a whole number");
    rows = rows.slice(0, n);
  }
  p.done();

  if (count) {
    if (picked.length) throw new SqlError("COUNT(*) can't be mixed with columns here");
    return { columns: ["count"], rows: [{ count: rows.length }] };
  }

  const all = Object.keys(table(tableName)[0] ?? {});
  const columns = picked.length === 1 && picked[0] === "*" ? all : picked.map((c) => column(table(tableName), c, tableName));
  return { columns, rows: rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c]]))) };
}
