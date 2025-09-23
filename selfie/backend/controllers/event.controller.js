import Event from "../models/event.model.js";
import ical from "ical-generator";
import { addDays } from "date-fns";
import { parseISO } from "date-fns";
//import { RRule } from "rrule";

import { getNow, applyOffset } from "../utils/timemachine.util.js";

// fetch degli eventi in una finestra di tempo (specificata in query, usata mese per mese)
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
        // eventi non ricorrenti
        {
          type: { $in: ["manual", "note"] },
          date: { $gte: start, $lte: end },
          $or: [
            { "recurrence.frequency": null },
            { "recurrence.frequency": { $exists: false } },
          ],
        },
        // eventi ricorrenti
        {
          "recurrence.frequency": { $ne: null },
          date: { $lte: end },
          $or: [
            { "recurrence.endDate": null },
            { "recurrence.endDate": { $gte: start } },
          ],
        },
        // attivita'
        { type: "activity", isComplete: false, date: { $lte: end } },

        // eventi pomodoro
        {
          isPomodoro: true,
          date: { $gte: start, $lte: end },
          $or: [
            { "recurrence.frequency": null },
            { "recurrence.frequency": { $exists: false } },
          ],
        },
        // finestra di ricorrenza degli eventi pomodoro
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
    }).lean(); // lean perche' usa Plain old Javascript Objects e non documenti Mongoose, rendendo piu' snelle le query

    res.json(events);
  } catch (err) {
    console.error("Failed to fetch the events", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// crea un evento
export const createEvent = async (req, res) => {
  try {
    const { recurrence, ...eventData } = req.body;

    // controlli di validazione per pomodoro per controllare un minimo che le cose siano ok
    if (eventData.isPomodoro) {
      const p = eventData.pomodoro || {};
      if (p.mode === "total") {
        if (typeof p.totalMinutes !== "number" || p.totalMinutes <= 0) {
          return res
            .status(400)
            .json({ error: "Invalid pomodoro.totalMinutes" });
        }
      } else {
        // modalità base oppure fissata
        const { studyMinutes, breakMinutes, cycles } = p;
        if (
          ![studyMinutes, breakMinutes, cycles].every(
            (n) => Number.isFinite(n) && n > 0
          )
        ) {
          return res.status(400).json({ error: "Invalid fixed pomodoro plan" });
        }
      }
      // ci assicuriamo che esista lo stato come oggetto nel caso il cliente l abbia dimenticato
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
      createdAt: getNow(),
      updatedAt: getNow(),
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

//cancella un evento
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

// gestice l'esclusione di una istanza ricorrente lato db
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

// gestisce il toggle del completamento attivita' lato db
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

// esporta il calendario di un utente come formato iCalendar (.ics) per essere usato su servizi di terze parti
export const exportIcal = async (req, res) => {
  const userId = req.user.id;
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
        start = applyOffset(
          new Date(`${event.dueDate}T${event.dueTime || "09:00"}:00`)
        );
        end = applyOffset(new Date(start.getTime() + 60 * 60 * 1000));
      } else {
        start = applyOffset(
          new Date(`${event.date}T${event.time || "00:00"}:00`)
        );
        end = event.endTime
          ? applyOffset(new Date(`${event.date}T${event.endTime}:00`))
          : applyOffset(new Date(start.getTime() + 60 * 60 * 1000));
      }

      if (event.spanningDays && event.spanningDays > 1) {
        end = addDays(end, event.spanningDays - 1);
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
            ? applyOffset(new Date(event.recurrence.endDate))
            : undefined,
        };

        if (event.exclusions?.length) {
          calEvent.exdate = event.exclusions.map(
            (d) => new Date(`${d}T${event.time || "00:00"}:00`)
          );
        }
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
      lastRunAt: getNow(),
    };

    await ev.save();
    res.json({ ok: true, eventId: ev._id, state: ev.pomodoro.state });
  } catch (e) {
    console.error("Failed to patch pomodoro state", e);
    res.status(500).json({ error: "Failed to update state" });
  }
};

// crea la preview attivita' per la homepage
export const getCalendarReport = async (req, res) => {
  //console.log("user in getCalendarReport:", req.user); // debug

  const userId = req.user.id;

  try {
    const activities = await Event.find({
      userId,
      type: "activity",
      isComplete: false,
      dueDate: { $ne: null },
    })
      .sort({ dueDate: 1, dueTime: 1 })
      .limit(3)
      .lean();

    res.json({ activities });
  } catch (error) {
    console.error(" Error fetching calendar report:", error);
    res.status(500).json({ error: "Failed to fetch calendar report" });
  }
};

// modifica un evento preesistente
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { recurrence, ...updates } = req.body;

    const event = await Event.findOne({ _id: id, userId: req.user.id });
    if (!event) {
      return res.status(404).json({ error: "Event not found or not yours" });
    }

    // check di sicurezza
    if (event.recurrence) {
      return res
        .status(400)
        .json({ error: "Recurring events cannot be edited" });
    }

    if (updates.isPomodoro) {
      const p = updates.pomodoro || {};
      if (p.mode === "total") {
        if (typeof p.totalMinutes !== "number" || p.totalMinutes <= 0) {
          return res
            .status(400)
            .json({ error: "Invalid pomodoro.totalMinutes" });
        }
      } else {
        const { studyMinutes, breakMinutes, cycles } = p;
        if (
          ![studyMinutes, breakMinutes, cycles].every(
            (n) => Number.isFinite(n) && n > 0
          )
        ) {
          return res.status(400).json({ error: "Invalid fixed pomodoro plan" });
        }
      }
      updates.pomodoro = {
        mode: p.mode || "fixed",
        totalMinutes: p.totalMinutes ?? null,
        studyMinutes: p.studyMinutes ?? 30,
        breakMinutes: p.breakMinutes ?? 5,
        cycles: p.cycles ?? 5,
        state: p.state ||
          event.pomodoro?.state || {
            dayISO: null,
            phase: "study",
            cycleIndex: 0,
            secondsLeft: 0,
            lastRunAt: null,
          },
      };
    }

    if (recurrence) {
      updates.recurrence = recurrence;
    }

    Object.assign(event, updates, { updatedAt: getNow() });
    await event.save();

    res.json(event);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
};
