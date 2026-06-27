import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mianshi";
const pool = globalThis.interviewTargetPool ?? new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalThis.interviewTargetPool = pool;
}

declare global {
  // eslint-disable-next-line no-var
  var interviewTargetPool: Pool | undefined;
}

type InterviewTargetRow = {
  id: string;
  role: string;
  level: string;
  stack: string[];
  interview_date: Date | string | null;
  created_at: Date;
  updated_at: Date;
};

export type InterviewTargetInput = {
  role: string;
  level: string;
  stack: string[];
  interviewDate: string | null;
};

export type InterviewTarget = InterviewTargetInput & {
  id: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanStack(value: unknown) {
  const items = Array.isArray(value) ? value : cleanText(value).split(/[、,，\n]/);
  return Array.from(new Set(items.map(cleanText).filter(Boolean)));
}

function cleanDate(value: unknown) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new Error("面试时间格式不正确");
  }
  return text;
}

function dateOnly(value: Date | string | null) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

function toTarget(row: InterviewTargetRow): InterviewTarget {
  return {
    id: row.id,
    role: row.role,
    level: row.level,
    stack: row.stack,
    interviewDate: dateOnly(row.interview_date),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export function getDefaultInterviewTarget(): InterviewTarget {
  return {
    id: null,
    role: "前端工程师",
    level: "中高级",
    stack: ["React", "Next.js", "TypeScript", "性能优化"],
    interviewDate: null,
    createdAt: null,
    updatedAt: null
  };
}

export function parseInterviewTargetInput(input: Record<string, unknown>): InterviewTargetInput {
  const target = {
    role: cleanText(input.role),
    level: cleanText(input.level),
    stack: cleanStack(input.stack),
    interviewDate: cleanDate(input.interviewDate)
  };

  if (!target.role || !target.level || target.stack.length === 0) {
    throw new Error("请填写岗位、级别和技术栈");
  }

  return target;
}

export async function getCurrentInterviewTarget(userId: string) {
  const { rows } = await pool.query<InterviewTargetRow>(
    `select id, role, level, stack, interview_date, created_at, updated_at
     from interview_targets
     where user_id = $1 and is_current
     order by updated_at desc
     limit 1`,
    [userId]
  );
  return rows[0] ? toTarget(rows[0]) : getDefaultInterviewTarget();
}

export async function updateInterviewTarget(userId: string, input: InterviewTargetInput) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const current = await client.query<{ id: string }>(
      "select id from interview_targets where user_id = $1 and is_current limit 1",
      [userId]
    );
    const params = [userId, input.role, input.level, input.stack, input.interviewDate];
    const query = current.rows[0]
      ? client.query<InterviewTargetRow>(
          `update interview_targets
           set direction = $2, role = $2, level = $3, focus = $4, stack = $4, deadline = $5, interview_date = $5, updated_at = now()
           where id = $6 and user_id = $1
           returning id, role, level, stack, interview_date, created_at, updated_at`,
          [...params, current.rows[0].id]
        )
      : client.query<InterviewTargetRow>(
          `insert into interview_targets (user_id, direction, role, level, focus, stack, deadline, interview_date, is_current)
           values ($1, $2, $2, $3, $4, $4, $5, $5, true)
           returning id, role, level, stack, interview_date, created_at, updated_at`,
          params
        );
    const { rows } = await query;
    await client.query("commit");
    return toTarget(rows[0]);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
