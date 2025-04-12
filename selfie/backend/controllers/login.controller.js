import Register from "../models/register.model.js";
import bcrypt from "bcrypt";

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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password errata" });
    }

    // Rimuove la password dalla risposta
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error("Errore nel login:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
};
