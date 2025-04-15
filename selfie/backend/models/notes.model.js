import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  markdown: { type: String, required: true },
  tags: { type: [String] },
  createdAt: { type: Date, default: Date.now },
  lastEdited: { type: Date, default: Date.now },
});

export default noteSchema;
