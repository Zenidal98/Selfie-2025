import Event from "../models/event.model.js";
import ical from "ical-generator";
import { parseISO } from "date-fns";

export const getEvents = async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user.id; // dal JWT

  if (!start || !end) {
    return res.status(400).json({ error: "Missing query parameters" });
  }

  try {
    // getEvents
    const events = await Event.find({
      userId,
      $or: [
        // existing manual/note non-recurring
        {
          type: { $in: ["manual", "note"] },
          date: { $gte: start, $lte: end },
          $or: [
            { "recurrence.frequency": null },
            { "recurrence.frequency": { $exists: false } },
          ],
        },
        // existing recurring
        {
          "recurrence.frequency": { $ne: null },
          date: { $lte: end },
          $or: [
            { "recurrence.endDate": null },
            { "recurrence.endDate": { $gte: start } },
          ],
        },
        // existing activities
        { type: "activity", isComplete: false, date: { $lte: end } },

        // 👉 NEW: Pomodoro events (non-recurring, same window)
        {
          isPomodoro: true,
          date: { $gte: start, $lte: end },
          $or: [
            { "recurrence.frequency": null },
            { "recurrence.frequency": { $exists: false } },
          ],
        },
        // 👉 NEW: Pomodoro recurring window
        {
          isPomodoro: true,
          "recurrence.frequency": { $ne: null },
          date: { $lte: end },
          $or: [
            { "recurrence.endDate": null },
            { "recurrence.endDate": { $gte: start } },
          ],
        },
      ],
    }).lean();

    res.json(events);
  } catch (err) {
    console.error("Failed to fetch the events", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// createEvent
export const createEvent = async (req, res) => {
  try {
    const { recurrence, ...eventData } = req.body;

    // 👉 Minimal Pomodoro validation (optional but helpful)
    if (eventData.isPomodoro) {
      const p = eventData.pomodoro || {};
      if (p.mode === "total") {
        if (typeof p.totalMinutes !== "number" || p.totalMinutes <= 0) {
          return res
            .status(400)
            .json({ error: "Invalid pomodoro.totalMinutes" });
        }
      } else {
        // mode 'fixed' or default
        const { studyMinutes, breakMinutes, cycles } = p;
        if (
          ![studyMinutes, breakMinutes, cycles].every(
            (n) => Number.isFinite(n) && n > 0
          )
        ) {
          return res.status(400).json({ error: "Invalid fixed pomodoro plan" });
        }
      }
      // Ensure state exists as object if client omitted it
      eventData.pomodoro = {
        mode: p.mode || "fixed",
        totalMinutes: p.totalMinutes ?? null,
        studyMinutes: p.studyMinutes ?? 30,
        breakMinutes: p.breakMinutes ?? 5,
        cycles: p.cycles ?? 5,
        state: p.state || {
          dayISO: null,
          phase: "study",
          cycleIndex: 0,
          secondsLeft: 0,
          lastRunAt: null,
        },
      };
    }

    const newEvent = new Event({
      ...eventData,
      userId: req.user.id,
    });

    if (recurrence && recurrence.frequency) {
      newEvent.recurrence = recurrence;
      await newEvent.save();
      newEvent.recurrenceId = newEvent._id;
      await newEvent.save();
    } else {
      await newEvent.save();
    }

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Event.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
    if (!deleted)
      return res.status(404).json({ error: "Event not found or not yours" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Failed to delete event", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
};

export const excludeOccurrence = async (req, res) => {
  const { id } = req.params;
  const { dateToExclude } = req.body;
  if (!dateToExclude)
    return res
      .status(400)
      .json({ error: "Missing exclusion date in request body" });

  try {
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ error: "Event series not found" });

    if (!event.exclusions.includes(dateToExclude)) {
      event.exclusions.push(dateToExclude);
      await event.save();
    }

    res
      .status(200)
      .json({ message: `successfully excluded date ${dateToExclude}`, event });
  } catch (error) {
    console.error("Failed to exclude occurrence", error);
    res.status(500).json({ error: "Failed to exclude occurrence " });
  }
};

export const toggleActivityCompletion = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.type !== "activity") {
      return res.status(404).json({ error: "Activity not found " });
    }
    event.isComplete = !event.isComplete;
    await event.save();
    res.status(200).json(event);
  } catch (error) {
    console.error("Failed to toggle activity:", error);
    res.status(500).json({ error: "Failed to toggle activity status" });
  }
};

export const exportIcal = async (req, res) => {
  const { userId } = req.query; // se vuoi esportare “per utente” da un pannello admin
  if (!userId) {
    return res.status(400).json({ error: "Missing User Id" });
  }

  try {
    const events = await Event.find({ userId }).lean();
    const calendar = ical({
      name: "Selfie - Calendar",
      timezone: "Europe/Rome",
    });

    events.forEach((event) => {
      let start, end;

      if (event.type === "activity") {
        start = new Date(`${event.dueDate}T${event.dueTime || "09:00"}:00`);
        end = new Date(start.getTime() + 60 * 60 * 1000);
      } else {
        start = new Date(`${event.date}T${event.time || "00:00"}:00`);
        end = event.endTime
          ? new Date(`${event.date}T${event.endTime}:00`)
          : new Date(start.getTime() + 60 * 60 * 1000);
      }

      const calEvent = {
        start,
        end,
        summary: event.text,
        description: `Type: ${event.type}`,
        location: event.location || "",
      };

      if (event.recurrence?.frequency) {
        calEvent.repeating = {
          freq: event.recurrence.frequency.toUpperCase(),
          interval: event.recurrence.interval,
          until: event.recurrence.endDate
            ? new Date(event.recurrence.endDate)
            : undefined,
          exclude: event.exclusions?.map((excludedDate) =>
            parseISO(excludedDate)
          ),
        };
      }

      calendar.createEvent(calEvent);
    });

    res.setHeader("Content-Type", "text/calendar;charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="selfieCalendar.ics"'
    );
    res.send(calendar.toString());
  } catch (error) {
    console.error("Failed to export calendar", error);
    res.status(500).json({ error: "Failed to export calendar" });
  }
};

export const getEventById = async (req, res) => {
  try {
    const ev = await Event.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();
    if (!ev) return res.status(404).json({ error: "Event not found" });
    res.json(ev);
  } catch (e) {
    console.error("Failed to fetch event", e);
    res.status(500).json({ error: "Failed to fetch event" });
  }
};

export const patchPomodoroState = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayISO, phase, cycleIndex, secondsLeft } = req.body;

    const ev = await Event.findOne({ _id: id, userId: req.user.id });
    if (!ev) return res.status(404).json({ error: "Event not found" });
    if (!ev.isPomodoro || !ev.pomodoro) {
      return res.status(400).json({ error: "Not a Pomodoro event" });
    }

    ev.pomodoro.state = {
      ...(ev.pomodoro.state || {}),
      dayISO: dayISO ?? ev.pomodoro.state?.dayISO ?? null,
      phase: phase ?? ev.pomodoro.state?.phase ?? "study",
      cycleIndex: Number.isFinite(cycleIndex)
        ? cycleIndex
        : ev.pomodoro.state?.cycleIndex ?? 0,
      secondsLeft: Number.isFinite(secondsLeft)
        ? secondsLeft
        : ev.pomodoro.state?.secondsLeft ?? 0,
      lastRunAt: new Date(),
    };

    await ev.save();
    res.json({ ok: true, eventId: ev._id, state: ev.pomodoro.state });
  } catch (e) {
    console.error("Failed to patch pomodoro state", e);
    res.status(500).json({ error: "Failed to update state" });
  }
};
