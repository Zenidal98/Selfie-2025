import Register from "../models/register.model.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  const { nome, cognome, username, password, dataNascita, foto } = req.body;

  if (!nome || !cognome || !username || !password) {
    return res.status(400).json({ success: false, message: "Campi mancanti" });
  }

  const exists = await Register.findOne({ username });
  if (exists) {
    return res.status(409).json({ success: false, message: "Username già in uso" });
  }

  // crittografia della password con bcrypt
  const salt = await bcrypt.genSalt(10);   // valore casuale che si mischia alla password prima di crittarla
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const newUser = new Register({ nome, cognome, username, password:hashedPassword, dataNascita, foto });
    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
