import { sendMail } from "../services/mailer.service.js";
import Register from "../models/register.model.js";
const sentIdempotencyKeys = new Set();

function validatePayload(body) {
  const errors = [];
  if (!body?.subject) errors.push("subject is required");
  if (!body?.text && !body?.html) errors.push("text or html is required");
  return errors;
}

export async function notifyEmailController(req, res) {
  try {
    const idempotencyKey = req.header("x-idempotency-key") || null;

    if (idempotencyKey && sentIdempotencyKeys.has(idempotencyKey)) {
      return res.status(200).json({ ok: true, deduped: true });
    }

    const {
      subject,
      text,
      html,
      eventId,
      userId,
      eventDateStr,
      eventTimeStr,
      notifyMinute,
    } = req.body || {};
    const errors = validatePayload({ subject, text, html });
    if (errors.length)
      return res.status(400).json({ error: errors.join(", ") });

    // (Optional) auth: verify req.user or a bearer token here

    const headers = {
      "X-Event-Id": String(eventId || ""),
      "X-User-Id": String(userId || ""),
      "X-Event-Date": String(eventDateStr || ""),
      "X-Event-Time": String(eventTimeStr || ""),
      "X-Notify-Min": String(notifyMinute ?? ""),
    };

    const user = await Register.findById(userId).select("email username");
    if (!user) return res.status(404).json({ error: "User not found" });

    const to = user.email;

    const info = await sendMail({ to, subject, text, html, headers });

    if (idempotencyKey) sentIdempotencyKeys.add(idempotencyKey);

    return res.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    console.error("notifyEmailController error:", err);
    return res.status(500).json({ error: "Email send failed" });
  }
}
