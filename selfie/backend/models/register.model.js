import mongoose from "mongoose";

const registerSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dataNascita: { type: Date },
  foto: { type: String }, // magari il path o un link
  email: { type: String, required: true, unique: true }, 
  isVerified: { type: Boolean, default: false }, // serve per verificare che sia verificato, se si allora permette il login
  verificationToken: { type: String }, 
}, { timestamps: true });

const Register = mongoose.model("Register", registerSchema);
export default Register;
