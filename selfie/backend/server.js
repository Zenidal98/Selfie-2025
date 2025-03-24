import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { connectDB }from './config/db.js';
import Pluto from './models/test.model.js';

dotenv.config();

const app = express();

app.get("/", (req,res) => {
    res.send("Server pronto");
})

console.log(process.env.MONGO_URI);

app.post("/api/plutos", async (req,res) => {
    const pluto = req.body;

    if(!pluto.name || !pluto.pippo) {
        return res.status(400).json({ success: false, message: "Error: some fields are missing"});
    }

    const newPluto = new Pluto(pluto);
    try {
        await newPluto.save();
        res.status(201).json({ success: true, data: newPluto });
    } catch (error) {
        console.error("Error in creating product:", error.message);
        res.status(500).json({ success: false, message: "Server Error"});
    }
});


app.listen(5000, () => {
    connectDB();
    console.log("Server attivato sulla porta 5000");
});
