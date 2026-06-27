import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mianshi";

const pool =
  globalThis.aiProviderPool ??
  new Pool({
    connectionString: databaseUrl
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.aiProviderPool = pool;
}

declare global {
  // eslint-disable-next-line no-var
  var aiProviderPool: Pool | undefined;
}

type AiProviderRow = {
  id: string;
  name: string;
  provider_format: string;
  base_url: string;
  model: string;
  encrypted_api_key: string;
  active: boolean;
  last_tested_at: Date | null;
  last_test_status: string;
  created_at: Date;
};

export type AiProviderConfig = {
  id: string;
  name: string;
  format: string;
  baseUrl: string;
  model: string;
  maskedKey: string;
  active: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string;
  createdAt: string;
};

export type CreateAiProviderConfigInput = {
  name: string;
  format: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type AiProviderRuntimeConfig = {
  id: string;
  name: string;
  format: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

function encryptionSecret() {
  const secret = process.env.AI_CONFIG_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing AI_CONFIG_ENCRYPTION_KEY");
  }
  return "dev-only-ai-config-encryption-key";
}

function encryptionKey() {
  return createHash("sha256").update(encryptionSecret()).digest();
}

function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptApiKey(value: string) {
  const [ivText, tagText, encryptedText] = value.split(":");
  if (!ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted API key");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64")), decipher.final()]).toString("utf8");
}

function maskApiKey(apiKey: string) {
  const end = apiKey.slice(-4);
  const start = apiKey.startsWith("sk-") ? "sk-" : "";
  return `${start}****${end}`;
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCreateAiProviderConfigInput(input: Record<string, unknown>): CreateAiProviderConfigInput {
  const config = {
    name: cleanText(input.name),
    format: cleanText(input.format),
    baseUrl: cleanText(input.baseUrl),
    model: cleanText(input.model),
    apiKey: cleanText(input.apiKey)
  };

  if (!config.name || !config.format || !config.baseUrl || !config.model || !config.apiKey) {
    throw new Error("请填写完整 Provider 配置");
  }

  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error("Base URL 格式不正确");
  }

  return config;
}

function toConfig(row: AiProviderRow): AiProviderConfig {
  return {
    id: row.id,
    name: row.name,
    format: row.provider_format,
    baseUrl: row.base_url,
    model: row.model,
    maskedKey: maskApiKey(decryptApiKey(row.encrypted_api_key)),
    active: row.active,
    lastTestedAt: row.last_tested_at?.toISOString() ?? null,
    lastTestStatus: row.last_test_status,
    createdAt: row.created_at.toISOString()
  };
}

export async function listAiProviderConfigs(userId: string) {
  const { rows } = await pool.query<AiProviderRow>(
    `select id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at
     from ai_provider_configs
     where user_id = $1
     order by active desc, created_at desc`,
    [userId]
  );
  return rows.map(toConfig);
}

export async function createAiProviderConfig(userId: string, input: CreateAiProviderConfigInput) {
  const { rows } = await pool.query<AiProviderRow>(
    `insert into ai_provider_configs (user_id, name, provider_format, base_url, model, encrypted_api_key)
     values ($1, $2, $3, $4, $5, $6)
     returning id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at`,
    [userId, input.name, input.format, input.baseUrl, input.model, encryptApiKey(input.apiKey)]
  );
  return toConfig(rows[0]);
}

export async function activateAiProviderConfig(userId: string, configId: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const found = await client.query("select 1 from ai_provider_configs where id = $1 and user_id = $2", [configId, userId]);
    if (!found.rowCount) {
      throw new Error("Provider 不存在");
    }
    await client.query("update ai_provider_configs set active = false, updated_at = now() where user_id = $1", [userId]);
    const { rows } = await client.query<AiProviderRow>(
      `update ai_provider_configs
       set active = true, updated_at = now()
       where id = $1 and user_id = $2
       returning id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at`,
      [configId, userId]
    );
    await client.query("commit");
    return toConfig(rows[0]);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function getActiveAiProviderConfig(userId: string) {
  const { rows } = await pool.query<AiProviderRow>(
    `select id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at
     from ai_provider_configs
     where user_id = $1 and active
     limit 1`,
    [userId]
  );
  return rows[0] ? toConfig(rows[0]) : null;
}

export async function getActiveAiProviderRuntimeConfig(userId: string): Promise<AiProviderRuntimeConfig | null> {
  const { rows } = await pool.query<AiProviderRow>(
    `select id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at
     from ai_provider_configs
     where user_id = $1 and active
     limit 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    format: row.provider_format,
    baseUrl: row.base_url,
    model: row.model,
    apiKey: decryptApiKey(row.encrypted_api_key)
  };
}

export async function testAiProviderConfig(userId: string, configId: string) {
  const { rows } = await pool.query<AiProviderRow>(
    `select id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at
     from ai_provider_configs
     where id = $1 and user_id = $2`,
    [configId, userId]
  );
  if (!rows[0]) {
    throw new Error("Provider 不存在");
  }

  const apiKey = decryptApiKey(rows[0].encrypted_api_key);
  if (!apiKey) {
    throw new Error("API Key 不可用");
  }

  const updated = await pool.query<AiProviderRow>(
    `update ai_provider_configs
     set last_test_status = 'ok', last_tested_at = now(), updated_at = now()
     where id = $1 and user_id = $2
     returning id, name, provider_format, base_url, model, encrypted_api_key, active, last_tested_at, last_test_status, created_at`,
    [configId, userId]
  );

  return toConfig(updated.rows[0]);
}
