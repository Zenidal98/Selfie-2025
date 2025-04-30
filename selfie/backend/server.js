import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import registerRoutes from './routes/register.route.js'
import loginRoutes from "./routes/login.route.js";
import noteRoutes from "./routes/notes.routes.js"
import pomodoroRoutes from "./routes/pomodoro.route.js";
import eventRoutes from "./routes/event.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

app.use("/api/register", registerRoutes);

app.use("/api/login", loginRoutes);

app.use("/api/pomodoro", pomodoroRoutes);

app.use("/api/notes", noteRoutes);

app.use("/api/events", eventRoutes);
//console.log(process.env.MONGO_URI);

app.listen(PORT, () => {
    connectDB();
    console.log("Server attivato sulla porta " + PORT);
});


