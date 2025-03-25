import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { connectDB }from './config/db.js';
import Pluto from './models/test.model.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req,res) => {
    res.send("Server pronto");
})

//console.log(process.env.MONGO_URI);
app.get("/api/plutos", async(req,res) => {
    try {
        const plutos = await Pluto.find({});
        res.status(200).json({ success:true, data: plutos});
    } catch (error) {
        console.log("Error in fetching plutos", error.message);
        res.status(500).json({ success:false, message: "Server Error"});
    }

})
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
        console.error("Error in creating pluto:", error.message);
        res.status(500).json({ success: false, message: "Server Error"});
    }
});

app.delete("/api/plutos/:id", async (req,res) => {
    const {id} =req.params;
    console.log("delete pluto with id:",id);

    try {
        await Pluto.findByIdAndDelete(id);
        res.status(200).json({ success:true, message: "Pluto deleted"});
    } catch (error) {
        console.error("Error in deleting plutos", error.message);
        res.status(404).json({ success:false, message: "Pluto not found"});
    }
})

app.listen(5000, () => {
    connectDB();
    console.log("Server attivato sulla porta 5000");
});
