import Pluto from "../models/test.model.js";
import mongoose from "mongoose";

export const getPlutos = async(req,res) => {
    try {
        const plutos = await Pluto.find({});
    res.status(200).json({ success:true, data: plutos});
    } catch (error) {
        console.log("Error in fetching plutos", error.message);
        res.status(500).json({ success:false, message: "Server Error"});
    }

};

export const createPlutos = async (req,res) => {
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
};

export const updatePlutos = async (req,res) => {
    const { id } = req.params;

    const pluto = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ success:false, message: "Invalid Pluto id" });
    }

    try {
        const updatedPluto = await Pluto.findByIdAndUpdate(id, pluto, {new: true});
        res.status(200).json({ success:true, data: updatedPluto});
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error"});
    }
};

export const deletePlutos = async (req,res) => {
    const {id} =req.params;
    console.log("delete pluto with id:",id);

    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ success:false, message: "Invalid Pluto id" });
    }

    try {
        await Pluto.findByIdAndDelete(id);
        res.status(200).json({ success:true, message: "Pluto deleted"});
    } catch (error) {
        console.error("Error in deleting pluto", error.message);
        res.status(404).json({ success:false, message: "Pluto not found"});
    }
};

export const getPlutoByID = async (req,res) => {
    const {id} = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({ success:false, message: "Invalid Pluto id" });
    }

    try {
        const pluto = await Pluto.findById(id);
        res.status(200).json({ success: true, data: pluto});
    } catch (error) {
        console.error(`Error in fetching pluto with id: ${id} `, error.message);
        res.status(404).json({ success: false, message:"Error: pluto not found"});
        return 
    }
}
