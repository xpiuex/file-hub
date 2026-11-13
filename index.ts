// Supabase Edge Function: ส่งและตรวจรหัสยืนยันทางอีเมล (ใช้ Resend)
// ตรวจตัวตนจาก Firebase ID token แล้วเช็กอีเมลกับตาราง allowed_emails
import { createClient } from "jsr:@supabase/supabase-js@2";

const CODE_TTL_MIN = 10;
const COOLDOWN_SEC = 60;
const MAX_ATTEMPTS = 5;
const LOCK_MIN = 15;
const SESSION_HOURS = 12;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function sha256Hex(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const idToken = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!idToken) return json({ error: "no_token" }, 401);

    // ยืนยัน ID token กับ Firebase
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${Deno.env.get("FIREBASE_API_KEY")}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) },
    );
    const info = await lookup.json();
    const email = String(info?.users?.[0]?.email || "").toLowerCase();
    if (!email) return json({ error: "bad_token" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ต้องอยู่ในรายการอนุญาตก่อน
    const { data: allowed } = await admin.from("allowed_emails").select("email").ilike("email", email).maybeSingle();
    if (!allowed) return json({ error: "not_allowed" }, 403);

    const body = await req.json().catch(() => ({}));
    const now = Date.now();
    const { data: row } = await admin.from("login_codes").select("*").eq("email", email).maybeSingle();

    if (body.action === "send") {
      if (row?.locked_until && new Date(row.locked_until).getTime() > now) return json({ error: "locked" }, 429);
      if (row?.last_sent_at) {
        const passed = now - new Date(row.last_sent_at).getTime();
        if (passed < COOLDOWN_SEC * 1000) {
          return json({ error: "cooldown", wait: Math.ceil((COOLDOWN_SEC * 1000 - passed) / 1000) }, 429);
        }
      }
      const code = randomCode();
      const salt = crypto.randomUUID();
      const { error: upErr } = await admin.from("login_codes").upsert({
        email,
        salt,
        code_hash: await sha256Hex(salt + code),
        expires_at: new Date(now + CODE_TTL_MIN * 60000).toISOString(),
        attempts: 0,
        locked_until: null,
        last_sent_at: new Date(now).toISOString(),
      });
      if (upErr) return json({ error: "db", detail: upErr.message }, 500);

      const mail = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL"),
          to: [email],
          subject: "รหัสเข้าใช้งาน AskFile",
          html: `<p>รหัสเข้าใช้งาน AskFile ของคุณคือ</p>
<p style="font-size:24px;letter-spacing:6px"><b>${code}</b></p>
<p>รหัสหมดอายุใน ${CODE_TTL_MIN} นาที ถ้าคุณไม่ได้ขอรหัสนี้ ให้เพิกเฉยต่ออีเมลนี้</p>`,
        }),
      });
      if (!mail.ok) return json({ error: "mail_failed", detail: await mail.text() }, 502);
      return json({ ok: true, cooldown: COOLDOWN_SEC });
    }

    if (body.action === "verify") {
      if (!row) return json({ error: "no_code" }, 400);
      if (row.locked_until && new Date(row.locked_until).getTime() > now) return json({ error: "locked" }, 429);
      if (new Date(row.expires_at).getTime() < now) return json({ error: "expired" }, 400);

      const ok = (await sha256Hex(row.salt + String(body.code || ""))) === row.code_hash;
      if (!ok) {
        const attempts = (row.attempts || 0) + 1;
        const lockUntil = attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MIN * 60000).toISOString() : null;
        await admin.from("login_codes").update({ attempts: lockUntil ? 0 : attempts, locked_until: lockUntil }).eq("email", email);
        return json({ error: "wrong", attempts_left: Math.max(0, MAX_ATTEMPTS - attempts), locked: !!lockUntil }, 400);
      }

      await admin.from("login_verified").upsert({
        email,
        verified_until: new Date(now + SESSION_HOURS * 3600000).toISOString(),
      });
      await admin.from("login_codes").delete().eq("email", email);
      return json({ ok: true });
    }

    return json({ error: "bad_action" }, 400);
  } catch (err) {
    return json({ error: "server", detail: String(err) }, 500);
  }
});
