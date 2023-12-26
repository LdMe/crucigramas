import mongoose, { Schema } from "mongoose";
import connection from "../config/db.js";

const wordSchema = new Schema({
    word: {
        type: String,
        required: true,
        unique: true
    },
    definitions: [{
        type: String,
        required: true
    }],
    synonyms: [String]
});

const Word = mongoose.model('Word', wordSchema);

export default Word;