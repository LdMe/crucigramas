import express from 'express';
import cors from 'cors';
import clg from "crossword-layout-generator"
import { getWordInfo, addWord, getWords, getRandomWords,getRandomWordFromWords,convertTxtToJson } from './controllers/wordController.js';
import { getClues } from './controllers/chatGPTController.js';

const app = express();
app.use(cors());
/* 
convertTxtToJson(); */
app.get('/api/words', async (req, res) => {
    const filter = req.query.filter;
    try {
        const words = await getWords();
        if (filter) {
            const filteredWords = words.filter(word => word.includes(filter));
            return res.json(filteredWords);
        }
        res.json(words);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

app.get('/api/words/random', async (req, res) => {
    const count = req.query.count || 1;
    if (count > 1) {
        const words = await getRandomWords(parseInt(count));
        return res.json(words);
    }
    
    const randomWord = await getRandomWordFromWords();
    res.json(randomWord);
    
    
    
});

app.get('/api/words/:word', async (req, res) => {
    const word = req.params.word;
    const wordInfo= await getWordInfo(word);
    res.json(wordInfo);

});

app.get('/api/crossword', async (req, res) => {
    getRandomWordFromWords();
    const count = req.query.count || 20;
    const words = await getRandomWords(parseInt(count));
    const normalizedWords = words.map((word)=>{
        // remove accents and special characters
        const normalizedWord = word.word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return {
            ...word,
            word:normalizedWord
        }
    });
    const crossword = clg.generateLayout(normalizedWords.map((word)=>{
        return {"answer":word.word,"clue":word.definition}
      }));
    const mappedCrosswordResults = crossword.result.map((result)=>{
        const word = normalizedWords.find((word)=>word.word===result.answer);
        return {
            ...word,
            startx:result.startx,
            starty:result.starty,
            orientation:result.orientation,
            position:result.position
        }
    })
    crossword.result = mappedCrosswordResults;
    res.json(crossword);
});

app.listen(3000, () => console.log('Server listening on port 3000'));

