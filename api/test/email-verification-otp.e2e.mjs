/**
 * End-to-end test for the six-digit OTP email-verification flow.
 *
 * Exercises the real built API, the real Postgres database, and a real SMTP
 * conversation captured by a local sink. Nothing is mocked.
 *
 * Run with: npm run test:email-verification
 * (build first: npm run build)
 */
import { createServer, connect } from "node:net";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const here = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(here, "..");
const API_PREFIX = "/api/v1";

// --- .env loader -----------------------------------------------------------
const envText = readFileSync(resolve(apiDir, ".env"), "utf8");
for (const rawLine of envText.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const index = line.indexOf("=");
  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (process.env[key] === undefined) process.env[key] = value;
}

const HTTP_PORT = Number(process.env.E2E_HTTP_PORT ?? 4110);
const SMTP_PORT = Number(process.env.E2E_SMTP_PORT ?? 2526);
const BASE = `http://127.0.0.1:${HTTP_PORT}${API_PREFIX}`;
const TEST_PASSWORD = "OtpPassword123";
const SMTP_USER = "e2e@example.test";
const SMTP_PASS = "e2e-app-password";

const messages = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startSmtpSink() {
  return new Promise((resolveServer) => {
    const server = createServer((socket) => {
      let buffer = "";
      let inData = false;
      let data = "";
      let authStep = 0;

      socket.write("220 localhost ESMTP e2e\r\n");

      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");

        let newline;
        while ((newline = buffer.indexOf("\r\n")) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 2);

          if (inData) {
            if (line === ".") {
              inData = false;
              messages.push(data);
              data = "";
              socket.write("250 2.0.0 Message accepted\r\n");
            } else {
              data += `${line.startsWith("..") ? line.slice(1) : line}\r\n`;
            }
            continue;
          }

          const upper = line.toUpperCase();

          if (authStep === 1) {
            authStep = 2;
            socket.write("334 UGFzc3dvcmQ6\r\n");
            continue;
          }
          if (authStep === 2) {
            authStep = 0;
            socket.write("235 2.7.0 Authentication successful\r\n");
            continue;
          }
          if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
            socket.write(
              "250-localhost\r\n250-AUTH PLAIN LOGIN\r\n250-8BITMIME\r\n250 OK\r\n",
            );
            continue;
          }
          if (upper.startsWith("AUTH PLAIN")) {
            socket.write("235 2.7.0 Authentication successful\r\n");
            continue;
          }
          if (upper === "AUTH LOGIN") {
            authStep = 1;
            socket.write("334 VXNlcm5hbWU6\r\n");
            continue;
          }
          if (upper.startsWith("MAIL FROM") || upper.startsWith("RCPT TO")) {
            socket.write("250 2.1.0 OK\r\n");
            continue;
          }
          if (upper === "DATA") {
            inData = true;
            socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
            continue;
          }
          if (upper === "RSET" || upper === "NOOP") {
            socket.write("250 2.0.0 OK\r\n");
            continue;
          }
          if (upper === "QUIT") {
            socket.write("221 2.0.0 Bye\r\n");
            socket.end();
            continue;
          }
          socket.write("250 2.0.0 OK\r\n");
        }
      });

      socket.on("error", () => undefined);
    });

    server.listen(SMTP_PORT, "127.0.0.1", () => resolveServer(server));
  });
}

async function waitForPort(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolveProbe) => {
      const socket = connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolveProbe(true);
      });
      socket.once("error", () => resolveProbe(false));
    });
    if (ok) return;
    await sleep(150);
  }
  throw new Error(`Port ${port} did not become ready in time`);
}

async function waitForMessage(index, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (messages.length > index) return messages[index];
    await sleep(100);
  }
  throw new Error(`SMTP message #${index + 1} was not delivered in time`);
}

/** Decodes quoted-printable so a soft break cannot split the six digits. */
function decodeBody(raw) {
  const body = raw.split(/\r?\n\r?\n/).slice(1).join("\n");
  const joined = body.replace(/=\r?\n/g, "");
  return joined.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function extractCode(raw) {
  const body = decodeBody(raw);
  // The OTP is the only six-digit line of its own. Matching any six-digit run
  // would also match random digits inside the generated MIME boundary, e.g.
  // "----_NmP-7a101532f20a8d5e-Part_1".
  const match = body.match(/(?:^|\r?\n)[ \t]*(\d{6})[ \t]*(?:\r?\n|$)/);
  if (!match) throw new Error("No six-digit code found in delivered email");
  return match[1];
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { response, status: response.status, json, text };
}

let assertions = 0;
function check(condition, label, extra) {
  assertions += 1;
  if (!condition) {
    const detail =
      extra === undefined ? "" : `\n${JSON.stringify(extra, null, 2)}`;
    throw new Error(`Assertion failed: ${label}${detail}`);
  }
  console.log(`  ok  ${label}`);
}

async function main() {
  const prisma = new PrismaClient();
  let apiProcess;
  let smtpServer;
  let userId;

  const stamp = Date.now();
  const email = `otp.e2e.${stamp}@example.test`;
  const wrongCode = "000000";

  try {
    smtpServer = await startSmtpSink();

    apiProcess = spawn(process.execPath, ["dist/server.js"], {
      cwd: apiDir,
      env: {
        ...process.env,
        PORT: String(HTTP_PORT),
        NODE_ENV: "development",
        NODEMAIL_HOST: "127.0.0.1",
        NODEMAIL_PORT: String(SMTP_PORT),
        NODEMAIL_SECURE: "false",
        NODEMAIL_REQUIRE_TLS: "false",
        NODEMAIL_USER: SMTP_USER,
        NODEMAIL_PASS: SMTP_PASS,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const apiOutput = [];
    apiProcess.stdout.on("data", (chunk) => apiOutput.push(chunk.toString()));
    apiProcess.stderr.on("data", (chunk) => apiOutput.push(chunk.toString()));

    await waitForPort(HTTP_PORT);
    if (apiProcess.exitCode !== null) {
      throw new Error(`API exited early:\n${apiOutput.join("")}`);
    }

    console.log("\nRegistration");
    const register = await request("/auth/register", {
      method: "POST",
      body: {
        name: "OTP Test User",
        email,
        password: TEST_PASSWORD,
        role: "AGENT",
      },
    });
    check(register.status === 201, "registration returns 201", register.json);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Registered user not found in database");
    userId = user.id;
    check(user.emailVerified === null, "new account starts unverified");

    const challenge = await prisma.emailVerificationCode.findFirst({
      where: { userId },
    });
    check(Boolean(challenge), "a verification challenge was stored");
    check(
      challenge.codeHash !== null && !/^\d{6}$/.test(challenge.codeHash ?? ""),
      "the code is stored only as a hash",
    );

    const firstMessage = await waitForMessage(0);
    const code1 = extractCode(firstMessage);
    check(/^\d{6}$/.test(code1), "a real six-digit code was emailed");
    check(
      firstMessage.includes(email),
      "verification email addressed to the registered user",
    );
    check(
      !register.text.includes(code1),
      "the API response never contains the OTP",
    );
    check(
      !apiOutput.join("").includes(code1),
      "the OTP is never written to API logs",
    );

    console.log("\nLogin gate");
    const blocked = await request("/auth/login", {
      method: "POST",
      body: { email, password: TEST_PASSWORD },
    });
    check(blocked.status === 403, "unverified login is rejected with 403", blocked.json);
    check(
      blocked.json?.error?.code === "EMAIL_NOT_VERIFIED",
      "unverified login reports EMAIL_NOT_VERIFIED",
      blocked.json,
    );

    console.log("\nWrong code");
    const wrong = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: wrongCode },
    });
    check(wrong.status === 400, "incorrect code is rejected", wrong.json);
    check(
      wrong.json?.error?.code === "INVALID_CODE",
      "incorrect code reports INVALID_CODE",
      wrong.json,
    );
    check(
      /4 attempts remaining/.test(wrong.json?.error?.message ?? ""),
      "remaining attempts are reported",
      wrong.json,
    );

    console.log("\nResend cooldown");
    const cooldown = await request("/auth/verify-email/resend", {
      method: "POST",
      body: { email },
    });
    check(cooldown.status === 200, "resend during cooldown returns 200");
    check(cooldown.json?.data?.sent === false, "no email sent during cooldown");
    check(
      cooldown.json?.data?.retryAfterSeconds > 0,
      "cooldown seconds reported",
      cooldown.json,
    );

    console.log("\nResend rotates the code");
    await prisma.emailVerificationCode.updateMany({
      where: { userId },
      data: { lastSentAt: new Date(Date.now() - 120_000) },
    });
    const resent = await request("/auth/verify-email/resend", {
      method: "POST",
      body: { email },
    });
    check(resent.json?.data?.sent === true, "code is resent after the cooldown");

    const code2 = extractCode(await waitForMessage(1));
    check(code2 !== code1, "resend generates a different code");

    const stale = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: code1 },
    });
    check(stale.status === 400, "the previous code is invalidated");

    console.log("\nAttempt lockout");
    for (let attempt = 2; attempt <= 4; attempt += 1) {
      const response = await request("/auth/verify-email", {
        method: "POST",
        body: { email, code: wrongCode },
      });
      check(response.status === 400, `incorrect attempt ${attempt} rejected`);
    }
    const locked = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: wrongCode },
    });
    check(locked.status === 400, "fifth incorrect attempt rejected");
    check(
      locked.json?.error?.code === "TOO_MANY_ATTEMPTS",
      "fifth incorrect attempt locks the challenge",
      locked.json,
    );
    const remaining = await prisma.emailVerificationCode.count({ where: { userId } });
    check(remaining === 0, "locked challenge is discarded");

    console.log("\nExpiry");
    const resent2 = await request("/auth/verify-email/resend", {
      method: "POST",
      body: { email },
    });
    check(resent2.json?.data?.sent === true, "a fresh code is issued after lockout");
    const code3 = extractCode(await waitForMessage(2));

    await prisma.emailVerificationCode.updateMany({
      where: { userId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: code3 },
    });
    check(expired.status === 400, "expired code is rejected", expired.json);
    check(
      expired.json?.error?.code === "EXPIRED_CODE",
      "expired code reports EXPIRED_CODE",
      expired.json,
    );

    console.log("\nSuccessful verification");
    await prisma.emailVerificationCode.updateMany({
      where: { userId },
      data: { lastSentAt: new Date(Date.now() - 120_000) },
    });
    const finalResend = await request("/auth/verify-email/resend", {
      method: "POST",
      body: { email },
    });
    check(finalResend.json?.data?.sent === true, "final code sent");
    const code4 = extractCode(await waitForMessage(3));

    const verified = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: code4 },
    });
    check(verified.status === 200, "correct code verifies the account", verified.json);
    check(
      verified.json?.data?.user?.email === email,
      "verification returns the user",
    );

    const verifiedRow = await prisma.user.findUnique({ where: { id: userId } });
    check(verifiedRow.emailVerified !== null, "emailVerified is persisted");
    check(
      (await prisma.emailVerificationCode.count({ where: { userId } })) === 0,
      "challenge is consumed (single use)",
    );

    console.log("\nSingle use and login");
    const replay = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code: code4 },
    });
    check(replay.status === 400, "replaying a used code is rejected");
    check(
      replay.json?.error?.code === "ALREADY_VERIFIED",
      "replay reports ALREADY_VERIFIED",
      replay.json,
    );

    const login = await request("/auth/login", {
      method: "POST",
      body: { email, password: TEST_PASSWORD },
    });
    check(login.status === 200, "verified user can sign in", login.json);
    check(
      login.response.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith("agrivet_token=")),
      "login issues a session cookie",
    );

    console.log(`\nAll ${assertions} assertions passed.`);
  } catch (error) {
    console.error(
      "\nE2E test failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  } finally {
    if (apiProcess && apiProcess.exitCode === null) {
      apiProcess.kill("SIGTERM");
      await sleep(300);
      if (apiProcess.exitCode === null) apiProcess.kill("SIGKILL");
    }
    if (smtpServer) {
      await new Promise((r) => smtpServer.close(() => r()));
    }
    try {
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch(() => {
  process.exitCode = 1;
});
