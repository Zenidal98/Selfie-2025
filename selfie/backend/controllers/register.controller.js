import Register from "../models/register.model.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  const { nome, cognome, username, password, conferma, dataNascita, foto } = req.body;

  // Verifica che tutti i campi obbligatori siano presenti
  if (!nome || !cognome || !username || !password || !conferma) {
    return res.status(400).json({ success: false, message: "Campi mancanti" });
  }

  // Verifica che le due password coincidano
  if (password !== conferma) {
    return res.status(400).json({ success: false, message: "Le password non coincidono" });
  }

  // Verifica che l'username non esista già
  const exists = await Register.findOne({ username });
  if (exists) {
    return res.status(409).json({ success: false, message: "Username già in uso" });
  }

  // Hash della password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const newUser = new Register({nome, cognome, username, password: hashedPassword, dataNascita, foto,});

    await newUser.save();

    // Non restituiamo la password al frontend. Forse inutile ? Vediamo piu avanti intanto lo lascio
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error("Errore nella registrazione:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
