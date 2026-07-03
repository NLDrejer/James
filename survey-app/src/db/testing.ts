import { answers, questions, users, type Answer, type Question, type User } from "./schema";

type TableName = "users" | "questions" | "answers";
type OrderDirection = "asc" | "desc";

type State = {
  users: User[];
  questions: Question[];
  answers: Answer[];
  nextUserId: number;
  nextQuestionId: number;
  nextAnswerId: number;
};

type ColumnLike = {
  name?: string;
  table?: object;
  columnType?: string;
};

type ParamLike = {
  value?: unknown;
  encoder?: unknown;
};

type SqlLike = {
  queryChunks?: unknown[];
};

type OrderDirective = {
  column: string;
  direction: OrderDirection;
};

function getTableName(table: object): TableName {
  const symbol = Object.getOwnPropertySymbols(table).find(
    (candidate) => candidate.description === "drizzle:Name"
  );

  if (!symbol) {
    throw new Error("Unknown table passed to in-memory database");
  }

  return String((table as Record<symbol, unknown>)[symbol]) as TableName;
}

function getTableColumns(table: object): Record<string, ColumnLike> {
  const symbol = Object.getOwnPropertySymbols(table).find(
    (candidate) => candidate.description === "drizzle:Columns"
  );

  if (!symbol) {
    return {};
  }

  return (table as Record<symbol, Record<string, ColumnLike>>)[symbol] ?? {};
}

function isSqlLike(value: unknown): value is SqlLike {
  return Boolean(value && typeof value === "object" && "queryChunks" in value);
}

function isColumnLike(value: unknown): value is ColumnLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "table" in value &&
      typeof (value as ColumnLike).name === "string"
  );
}

function isParamLike(value: unknown): value is ParamLike {
  return Boolean(value && typeof value === "object" && "value" in value);
}

function getColumnPropertyName(column: ColumnLike): string {
  if (column.table) {
    const columns = getTableColumns(column.table);
    const entry = Object.entries(columns).find(([, candidate]) => candidate === column);
    if (entry?.[0]) return entry[0];
  }

  return String(column.name);
}

function parseWhereClauses(value: unknown): Array<{ column: string; value: unknown }> {
  if (!isSqlLike(value) || !Array.isArray(value.queryChunks)) return [];

  const clauses: Array<{ column: string; value: unknown }> = [];
  const chunks = value.queryChunks;

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];

    if (isSqlLike(chunk)) {
      clauses.push(...parseWhereClauses(chunk));
      continue;
    }

    if (isColumnLike(chunk)) {
      const maybeParam = chunks[i + 2];
      if (isParamLike(maybeParam)) {
        clauses.push({ column: getColumnPropertyName(chunk), value: maybeParam.value });
      }
    }
  }

  return clauses;
}

function getSqlString(value: unknown): string {
  if (!isSqlLike(value) || !Array.isArray(value.queryChunks)) return "";
  return value.queryChunks
    .map((chunk) => {
      if (typeof chunk === "string") return chunk;
      if (chunk && typeof chunk === "object" && "value" in chunk) {
        const chunkValue = (chunk as { value?: unknown }).value;
        if (Array.isArray(chunkValue)) return chunkValue.join("");
      }
      return "";
    })
    .join("");
}

function parseOrderDirective(value: unknown): OrderDirective | null {
  if (!value) return null;

  if (typeof value === "object" && "column" in value && "direction" in value) {
    const directive = value as Partial<OrderDirective>;
    if (
      typeof directive.column === "string" &&
      (directive.direction === "asc" || directive.direction === "desc")
    ) {
      return { column: directive.column, direction: directive.direction };
    }
  }

  if (!isSqlLike(value) || !Array.isArray(value.queryChunks)) return null;

  const column = value.queryChunks.find(isColumnLike);
  if (!column?.name) return null;

  const sql = getSqlString(value).toLowerCase();
  const direction: OrderDirection = sql.includes(" desc") ? "desc" : "asc";

  return { column: getColumnPropertyName(column), direction };
}

function normalizeOrderBy(
  table: object,
  orderBy: unknown
): OrderDirective[] {
  if (!orderBy) return [];

  const asc = (column: ColumnLike): OrderDirective => ({
    column: getColumnPropertyName(column),
    direction: "asc",
  });
  const desc = (column: ColumnLike): OrderDirective => ({
    column: getColumnPropertyName(column),
    direction: "desc",
  });

  const resolved = typeof orderBy === "function" ? orderBy(table, { asc, desc }) : orderBy;
  const items = Array.isArray(resolved) ? resolved : [resolved];

  return items
    .map((item) => parseOrderDirective(item))
    .filter((item): item is OrderDirective => item !== null);
}

function applyWhere<T extends Record<string, unknown>>(rows: T[], where: unknown): T[] {
  const clauses = parseWhereClauses(where);
  if (clauses.length === 0) return [...rows];

  return rows.filter((row) => clauses.every((clause) => row[clause.column] === clause.value));
}

function applyOrder<T extends Record<string, unknown>>(
  rows: T[],
  directives: OrderDirective[]
): T[] {
  if (directives.length === 0) return [...rows];

  return [...rows].sort((left, right) => {
    for (const directive of directives) {
      const a = left[directive.column];
      const b = right[directive.column];
      if (a === b) continue;

      const comparison = String(a) < String(b) ? -1 : 1;
      return directive.direction === "asc" ? comparison : -comparison;
    }

    return 0;
  });
}

function getRowsForTable(
  state: State,
  tableName: TableName
): Array<Record<string, unknown>> {
  if (tableName === "users") return state.users as unknown as Array<Record<string, unknown>>;
  if (tableName === "questions") return state.questions as unknown as Array<Record<string, unknown>>;
  return state.answers as unknown as Array<Record<string, unknown>>;
}

function createSeedState(): State {
  const now = new Date();
  return {
    users: [],
    questions: [
      {
        id: 1,
        text: "What is your favourite feature so far?",
        order: 1,
        createdAt: now,
      },
      {
        id: 2,
        text: "What should we improve next?",
        order: 2,
        createdAt: now,
      },
    ],
    answers: [],
    nextUserId: 1,
    nextQuestionId: 3,
    nextAnswerId: 1,
  };
}

function createMemoryStore() {
  const state: State = createSeedState();

  const query = {
    users: {
      findFirst(options: { where?: unknown } = {}) {
        return applyWhere(state.users, options.where)[0] ?? null;
      },
      findMany(options: { where?: unknown; orderBy?: unknown; limit?: number } = {}) {
        const rows = applyWhere(state.users, options.where);
        const ordered = applyOrder(rows, normalizeOrderBy(users, options.orderBy));
        return typeof options.limit === "number" ? ordered.slice(0, options.limit) : ordered;
      },
    },
    questions: {
      findFirst(options: { where?: unknown; orderBy?: unknown; limit?: number } = {}) {
        return this.findMany({ ...options, limit: 1 })[0] ?? null;
      },
      findMany(options: { where?: unknown; orderBy?: unknown; limit?: number } = {}) {
        const rows = applyWhere(state.questions, options.where);
        const ordered = applyOrder(rows, normalizeOrderBy(questions, options.orderBy));
        return typeof options.limit === "number" ? ordered.slice(0, options.limit) : ordered;
      },
    },
    answers: {
      findFirst(options: { where?: unknown } = {}) {
        return applyWhere(state.answers, options.where)[0] ?? null;
      },
      findMany(options: { where?: unknown; orderBy?: unknown; limit?: number } = {}) {
        const rows = applyWhere(state.answers, options.where);
        const ordered = applyOrder(rows, normalizeOrderBy(answers, options.orderBy));
        return typeof options.limit === "number" ? ordered.slice(0, options.limit) : ordered;
      },
    },
  };

  function insertRow(tableName: TableName, value: Record<string, unknown>) {
    if (tableName === "users") {
      const username = String(value.username ?? "");
      if (!username) return;
      if (state.users.some((user) => user.username === username)) return;
      state.users.push({
        id: state.nextUserId++,
        username,
        createdAt: new Date(),
      });
      return;
    }

    if (tableName === "questions") {
      state.questions.push({
        id: state.nextQuestionId++,
        text: String(value.text ?? ""),
        order: Number(value.order ?? 0),
        createdAt: new Date(),
      });
      return;
    }

    if (tableName === "answers") {
      state.answers.push({
        id: state.nextAnswerId++,
        userId: Number(value.userId),
        questionId: Number(value.questionId),
        answerText: String(value.answerText ?? ""),
        createdAt: new Date(),
      });
    }
  }

  function updateRows(tableName: TableName, values: Record<string, unknown>, where: unknown) {
    const rows = getRowsForTable(state, tableName);
    const matches = applyWhere(rows, where);

    for (const row of matches) {
      Object.assign(row, values);
    }
  }

  function deleteRows(tableName: TableName, where: unknown) {
    const rows = getRowsForTable(state, tableName);
    const remaining = rows.filter((row) => !applyWhere([row], where).length);
    rows.splice(0, rows.length, ...remaining);
  }

  return {
    query,
    insert(table: object) {
      const tableName = getTableName(table);
      return {
        values(payload: Record<string, unknown> | Record<string, unknown>[]) {
          const rows = Array.isArray(payload) ? payload : [payload];
          for (const row of rows as Record<string, unknown>[]) {
            insertRow(tableName, row);
          }
          return {
            onConflictDoNothing() {
              return undefined;
            },
          };
        },
      };
    },
    update(table: object) {
      const tableName = getTableName(table);
      return {
        set(values: Record<string, unknown>) {
          return {
            where(whereClause: unknown) {
              updateRows(tableName, values, whereClause);
            },
          };
        },
      };
    },
    delete(table: object) {
      const tableName = getTableName(table);
      return {
        where(whereClause: unknown) {
          deleteRows(tableName, whereClause);
        },
      };
    },
  };
}

export const memoryDb = createMemoryStore();

export function createTestDatabase() {
  return memoryDb;
}
