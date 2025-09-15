import api from "./api.js";

export async function sendEmailReminder({
  event,
  eventDateStr,
  eventTimeStr,
  thisNotifyMin,
}) {
  const idempotencyKey = `${event._id}-${eventDateStr}-${thisNotifyMin}`;

  const payload = {
    eventId: event._id,
    userId: event.userId,
    subject: event.type === "activity" ? "Activity Due" : "Event Reminder",
    text: `${event.text} at ${eventTimeStr} (${eventDateStr})`,
    html: `<p><strong>${event.text}</strong> at ${eventTimeStr} (${eventDateStr})</p>`,
    eventDateStr,
    eventTimeStr,
    notifyMinute: thisNotifyMin,
  };

  const res = await api.post("/notify-email", payload, {
    // if your backend uses cookies/sessions, keep withCredentials true
    withCredentials: true,
    headers: {
      "x-idempotency-key": idempotencyKey,
    },
  });

  return res.data; // e.g. { ok: true }
}

export default sendEmailReminder;
