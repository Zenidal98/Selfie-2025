import Event from "../models/event.model.js";

export const getEvents = async (req, res) => {
  const { userId, start, end } = req.query;

  if (!userId || !start || !end) {
    return res.status(400).json({ error: "Missing query parameters"});
  }

  try {
    const events = await Event.find({ 
      userId,
      
      $or: [
        // eventi non ricorrenti e NON attivita' (pena double fetching)
        { date: { $gte: start, $lte: end }, recurrence: { frequency: null }, type: { $in: ['manual', 'note']} },          // eventi ricorrenti     
        { 'recurrence.frequency': {$ne: null}, 
          date: {$lte: end}, 
          $or: [
            { 'recurrence.endDate': null},
            { 'recurrence.endDate': {$gte: start} }
          ]
        },
        // attivita' in corso
        { type: 'activity', isComplete: false, date: { $lte: end}}
      ]
    }).lean();

    // lean restituisce un oggetto js anziche' un mongoose document (rende le cose MOLTO piu' veloci su query grandi)
    res.json(events);
  } catch (err) {
    console.error('Failed to fetch the events', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { recurrence, ...eventData } = req.body;
    const newEvent = new Event(eventData);

    if (recurrence && recurrence.frequency) {
      newEvent.recurrence = recurrence;
      await newEvent.save(); // prima volta per creare l'id
      newEvent.recurrenceId = newEvent._id;
      await newEvent.save(); 
    } else {
      await newEvent.save();
    }

    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event'});
  }
};


export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Event not found'});
    res.status(200).json({ message: "Event deleted successfully"});
  } catch (err) {
    console.error('Failed to delete event', err);
    res.status(500).json({ error: "Failed to delete event"})
  }
};

export const excludeOccurrence = async (req,res) => {
  const { id } = req.params;
  const { dateToExclude } = req.body;

  if (!dateToExclude) {
    return res.status(400).json({ error: 'Missing exclusion date in request body' });
  }
  
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event series not found' });
    }

    if (!event.exclusions.includes(dateToExclude)) {
      event.exclusions.push(dateToExclude);
      await event.save();
    }

    res.status(200).json({ message: `successfully excluded date ${dateToExclude}`, event});
  } catch (error) {
    console.error('Failed to exclude occurrence', error);
    res.status(500).json({ error: 'Failed to exclude occurrence '});
  }

};

export const toggleActivityCompletion = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.type !== 'activity') {
      return res.status(404).json({ error: 'Activity not found '});
    }
    event.isComplete = !event.isComplete;
    await event.save();
    res.status(200).json(event);
  } catch (error) {
    console.error('Failed to toggle activity:', error);
    res.status(500).json({ error: 'Failed to toggle activity status'});
  }
};
