import { interval } from "date-fns";
import Event from "../models/event.model.js";

export const getEvents = async (req, res) => {
  const { userId, start, end } = req.query;

  if (!userId || !start || !end) {
    return res.status(400).json({ error: "Missing query arguments" });
  }

  try {
    const events = await Event.find({ 
      userId,
      
      $or: [
        { date: { $gte: start, $lte: end } },
        // eventi che spannano oltre la fine
        {
          spanningDays: {$gt: 1},
          date: { $lte: end}
        },
        
        {
          'recurrence.frequency': {$ne: null},
          date: {$lte: end},
          $or: [
            { 'recurrence.endDate': null},
            { 'recurrence.endDate': {$gte: start} }
          ]
        }
      ]
    }).lean();
    // lean restituisce un oggetto js anziche' un mongoose document (rende le cose MOLTO piu' veloci su query grandi)
    res.json(events.map(e => ({
      _id: e._id,
      date: e.date,
      time: e.time,
      endTime: e.endTime,
      type: e.type,
      text: e.text,
      recurrence: e.recurrence
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const createEvent = async (req, res) => {
  let { userId, date, text, time, endTime, spanningDays, recurrence } = req.body;
  if (!date || !text || !userId) return res.status(400).json({ error: 'Missing mandatory fields'});
  // check della validita', default a 00:00 li piazza in cima alla lista del modale
  time = time && /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  endTime = endTime && /^\d{2}:\d{2}$/.test(endTime) ? endTime : '00:00';
  spanningDays = Number(spanningDays) >= 1 ? Number(spanningDays) : 1;    // il cast a number e' pignolo, ma gestisce meglio i falsy
  
  recurrence = recurrence && recurrence.frequency ? {
    frequency: recurrence.frequency,
    interval: Number(recurrence.interval) >= 1 ? Number(recurrence.interval) : 1,
    endDate: recurrence.endDate || null
  } : { 
    frequency: null,
    interval: 1,
    endDate: null 
  };

  try {
    const newEvent = new Event({ 
      userId,
      date,
      time,
      endTime,
      spanningDays,
      recurrence,
      text,
      type: 'manual',
      noteId: null
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event'});
  }
};

// per ora non la sto usando, ma non si sa mai
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const tempEv = {};
  const { date, time, endTime, spanningDays, text, recurrence } = req.body;

  if (date) tempEv.date = date;
  tempEv.time = time && /^\d{2}:\d{2}$/.test(time) ? time : '00:00'; 
  tempEv.endTime = endTime && /^\d{2}:\d{2}$/.test(endTime) ? endTime : '00:00';
  tempEv.days = Number(spanningDays) >= 1 ? Number(spanningDays) : 1;

  if (recurrence) {
    tempEv.recurrence = {
      frequency: ['DAILY','WEEKLY','MONTHLY'].includes(recurrence.frequency) ? recurrence.frequency : null,
      interval: Number(recurrence.interval) >= 1 ? Number (recurrence.interval) : 1,
      endDate: recurrence.endDate || null
    }
  }

  try {
    const updated = await Event.findByIdAndUpdate(id, tempEv, { new: true }).lean();
    if(!updated) return res.status(404).json({ error: 'Event not found'});
    res.json({ message: "Updated event successfully", event: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event'});
  }
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Event not found'});
    res.status(200).json({ message: "Event deleted succesfully"});
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event"})
  }
}
