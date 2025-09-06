import Pomodoro from "../models/pomodoro.model.js";
import mongoose from "mongoose";
// crea nuova sessione pomodoro ad analizzare
export const createPomodoroSession = async (req, res) => {
  try {
    const authUserId = req.user.id; // from JWT

    const session = new Pomodoro({
      ...req.body,
      userId: new mongoose.Types.ObjectId(authUserId), // enforce ownership
    });

    const saved = await session.save();

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("createPomodoroSession error:", err);
    res.status(500).json({
      success: false,
      message: "Errore nel salvataggio",
      error: err.message,
    });
  }
};

// ottieni l'ultima sessione di un utente
export const getLastPomodoroByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const last = await Pomodoro.findOne({ userId }).sort({ createdAt: -1 });
    if (!last) {
      return res
        .status(404)
        .json({ success: false, message: "Nessuna sessione trovata" });
    }
    res.status(200).json({ success: true, data: last });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Errore nel recupero",
      error: err.message,
    });
  }
};
