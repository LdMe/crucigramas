import Word from "../models/word.js";
import puppeteer from 'puppeteer';
import {getClues} from './chatGPTController.js';
import words from "../../assets/words.json" assert { type: "json" };
import fs from "fs";
import path from "path";

const __dirname = path.resolve();
console.log("dirname",__dirname);
const getWordInfo = async (word) => {
    try {
        const dbWord = await Word.findOne({ word });
        if (dbWord) {
            return dbWord;
        }
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:85.0) Gecko/20100101 Firefox/85.0');
        await page.goto(`https://dle.rae.es/${word}`);
        await page.waitForSelector('.j');
        let { definitions, synonyms } = await page.evaluate((word) => {
            let definition = document.querySelector('.j').innerText;
            // if definition contains the word, replace all occurrences with asterisks of the same length
            const regex = new RegExp(word, 'gi');
            definition = definition.replace(regex, '*'.repeat(word.length));
            const synonyms = document.querySelectorAll('.sinonimos li span.sin');

            return {
                definitions: [definition],
                synonyms: [...synonyms].map(synonym => synonym.innerText)
            }
        }, word);
        await browser.close();
        try {
            const clues = await getClues({ word, definitions, synonyms });
            const jsonClues = JSON.parse(clues.content);
            console.log("clues",jsonClues);
            definitions = [...definitions, ...jsonClues.clues];
            const lowerCaseGPTSynonyms = jsonClues.synonyms.map(synonym => synonym.toLowerCase());
            const lowerCaseSynonyms = synonyms.map(synonym => synonym.toLowerCase());
            synonyms = [...new Set([...lowerCaseSynonyms, ...lowerCaseGPTSynonyms])];

        }
        catch (error) {
            console.log(error);

        }
        await addWord({ word, definitions, synonyms });
        return { word, definitions, synonyms };

    }
    catch (error) {
        console.log(error);
        return { word, definitions: ['No se encontró la palabra'], synonyms: [] };
    }
}

const getWords = async () => {
    try {
        const words = await Word.find();
        return words;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const getRandomWord = async () => {
    try {
        const count = await Word.countDocuments();
        const randomIndex = Math.floor(Math.random() * count);
        const randomWord = await Word.findOne().skip(randomIndex);
        return randomWord;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const getRandomWords = async (count) => {
    try {
        const words = await Word.aggregate([{ $sample: { size: count } }]);
        return words;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const getWord = async (req, res) => {
    try {
        const word = req.params.word;
        const dbWord = await Word.findOne({ word });
        if (dbWord) {
            return res.json(dbWord);
        }
        const wordInfo = await getWordInfo(word);
        await addWord(wordInfo);
        res.json(wordInfo);
    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

const addWord = async (wordInfo) => {
    try {

        const newWord = new Word(wordInfo);
        await newWord.save();
        return newWord;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const getRandomWordFromWords = async() => {
    console.log("words",words.length)
    if(words.length===0){
        return await getRandomWord();
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    console.log("random word",randomWord);
    try{
        const wordInfo = await getWordInfo(randomWord);
        removeWordInWordsAndSave(randomWord);
        return(wordInfo);
    }
    catch(error){
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}
const removeWordInWordsAndSave = (word) => {
    const index = words.indexOf(word);
    words.splice(index, 1);
    fs.writeFileSync(path.join(__dirname, "./assets/words.json"), JSON.stringify(words));
}

export {
    addWord,
    getWordInfo,
    getWord,
    getRandomWord,
    getWords,
    getRandomWords,
    getRandomWordFromWords,
    removeWordInWordsAndSave

}