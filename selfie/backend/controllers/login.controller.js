import Register from "../models/register.model.js";   //usa lo stesso schema modello di register tanto sono sempre quelli i campi
import bcrypt from "bcryptjs";

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Inserisci username e password" });
  }

  try {
    const user = await Register.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utente non trovato" });
    }

    // Confronta la password in chiaro con quella crittografata
    const isMatch = await bcrypt.compare(password, user.password); // Usa bcrypt per confrontare la password

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password errata" });
    }

    res.status(200).json({ success: true, message: "Login riuscito", data: user });
    
  } catch (err) {
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
