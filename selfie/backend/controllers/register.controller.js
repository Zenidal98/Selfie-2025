import Register from "../models/register.model.js";

export const registerUser = async (req, res) => {
  const { nome, cognome, username, password, dataNascita, foto } = req.body;

  if (!nome || !cognome || !username || !password) {
    return res.status(400).json({ success: false, message: "Campi mancanti" });
  }

  const exists = await Register.findOne({ username });
  if (exists) {
    return res.status(409).json({ success: false, message: "Username già in uso" });
  }

  try {
    const newUser = new Register({ nome, cognome, username, password, dataNascita, foto });
    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
