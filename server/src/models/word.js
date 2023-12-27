import mongoose, { Schema } from "mongoose";
import connection from "../config/db.js";

const wordSchema = new Schema({
    word: {
        type: String,
        required: true,
        unique: true
    },
    definitions: [String],
    synonyms: [String],
    ranking: {
        type: Number,
        default: 0
    }
});

const Word = mongoose.model('Word', wordSchema);

export default Word;