import Event from "../models/event.model.js";

export const getEvents = async (req, res) => {
  const { userId, start, end } = req.query;

  if (!userId || !start || !end) {
    return res.status(400).json({ error: "Missing query arguments" });
  }

  try {
    const events = await Event.find({ 
      userId,
      date: { $gte: start, $lte: end } 
    }).lean();
// lean restituisce un oggetto js anziche' un mongoose document (rende le cose MOLTO piu' veloci su query grandi)
    res.json(events.map(e => ({
      _id: e._id,
      date: e.date,
      type: e.type,
      text: e.text
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const createEvent = async (req, res) => {
  const { userId, date, text } = req.body;
  if (!date || !text || !userId) return res.status(400).json({ error: 'Missing mandatory fields'});
  
  try {
    const newEvent = new Event({ 
      userId,
      date,
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

export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const updated = await Event.findByIdAndUpdate(id, { text }, { new: true });
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
