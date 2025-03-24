import mongoose from "mongoose";

const plutoSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    pippo:{
        type: Number,
        required: true
    }
}, {
    timestamps: true // tempo di creazione e update, per debug
});

const Pluto = mongoose.model('Pluto', plutoSchema);

export default Pluto;