import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import clg from "crossword-layout-generator"
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
function App() {

  const [layout, setLayout] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  useEffect(() => {
    getCrossword()
  }
    , [])

  const getCrossword = async () => {
    try {
      const count = 20;
      const res = await fetch(`http://192.168.43.250:3007/api/crossword?count=${count}`)
      const data = await res.json()
      /* data.result = data.result.map((word) => {
        // replace all accents
        word.word = word.word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return word;
      }); */
      data.table = data.table.map((row) => {
        return row.map((cell) => {
          return { correct: cell, value: "" }
        })
      });
      setLayout(data);

    }
    catch (err) {
      setLayout(null);
      console.error(err)
    }

  }
  const colNumbers = [];
  for (let i = 0; i < layout?.cols; i++) {
    colNumbers.push(i + 1);
  }
  const letterBelongsToWords = (x, y) => {
    if (!layout || !layout.result) return false;
    const results = layout.result.filter((result) => {
      if (result.orientation === "across") {
        return result.starty === y && result.startx <= x && result.startx + result.word.length > x;
      }
      return result.startx === x && result.starty <= y && result.starty + result.word.length > y;
    });
    return results;
  }
  const getSelectedLetterClass = (x, y) => {
    

    const words = letterBelongsToWords(x, y);
    if (!words) return "";
    if (words.some((word) => word.correct)) return "correct-letter";
    if (!selectedWord) return "";
    const isSelectedWord = words.some((word) => word.word === selectedWord.word);
    if (isSelectedWord) {

      if (selectedCoordinates?.x === x && selectedCoordinates?.y === y) {
        return "selected-letter"
      }
      return "selected-word"
    }
    return "";
  }
  const selectWord = (x, y) => {
    const words = letterBelongsToWords(x, y);
    if (!words || words.length === 0) return;
    if (selectedCoordinates?.x === x && selectedCoordinates?.y === y) {
      if (words.length > 1 && selectedWord?.word === words[0].word) {
        setSelectedWord(words[1]);
        setSelectedCoordinates({ x, y });
        return;
      }
      setSelectedWord(null);
      setSelectedCoordinates(null);
      return;
    }
    else {

      const word = words.some((word) => word.word === selectedWord?.word) ? selectedWord : words[0];
      setSelectedWord(word);
      console.log(word)
      setSelectedCoordinates({ x, y });
    }

  }
  const getResultsByOrientation = (orientation) => {
    if (!layout || !layout.result) return [];
    const results = layout.result.filter((result) => {
      return result.orientation === orientation;
    });
    const sortedResults = results.sort((a, b) => {
      if (orientation === "across") {
        if (a.starty === b.starty) {
          return a.startx - b.startx;
        }
        return a.starty - b.starty;
      }
      if (a.startx === b.startx) {
        return a.starty - b.starty;
      }
      return a.startx - b.startx;
    });
    const sortedWords = sortedResults.map((result) => {
      return {
        answer: result.word,
        clue: result.definitions[1],
        synonims: result.synonims,
        startx: result.startx,
        starty: result.starty,
        orientation: result.orientation,
      }
    });
    return sortedWords;
  }

  const checkWordIsCorrect = (word) => {
    if (!layout) return false;
    const { startx, starty, orientation, word: answer } = word;
    const table = layout.table;
    if (orientation === "across") {
      for (let i = 0; i < answer.length; i++) {
        if (table[starty - 1][startx + i - 1].value !== answer[i]) return false;
      }
    }
    else {
      for (let i = 0; i < answer.length; i++) {
        if (table[starty + i - 1][startx - 1].value !== answer[i]) return false;
      }
    }
    return true;
  }
  const moveCoordinates = (key) => {
    const { x, y } = selectedCoordinates;
    const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrows.includes(key)) return;
    const orientationCondition = key === "ArrowUp" || key === "ArrowDown" ? "down" : "across";
  }
  const handleKeyboard = (e) => {
    if (!selectedWord) return;
    console.log("key", e)
    if (!e.key) {
      if (e === "{bksp}") {
        e = "Backspace"
      }
      e = { key: e }

    }
    if (e.key === "ArrowUp") {
      if (selectedWord.orientation === "down") {
        if (selectedCoordinates.y === selectedWord.starty) return;
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y - 1 });
      }
      else {
        const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
        console.log(words)
        if (words.length > 1 && selectedWord?.word === words[0].word) {
          setSelectedWord(words[1]);
          if (selectedCoordinates.y === words[1].starty) return;
          setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y - 1 });
          return;
        }
        setSelectedWord(words[0]);
        if (selectedCoordinates.y === words[0].starty) return;
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y - 1 });

      }
    }
    else if (e.key === "ArrowDown") {
      if (selectedWord.orientation === "down") {
        if (selectedCoordinates.y === selectedWord.starty + selectedWord.word.length - 1) return;
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y + 1 });
      }
      else {
        const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
        if (words.length > 1 && selectedWord?.word === words[0].word) {
          setSelectedWord(words[1]);
          if (selectedCoordinates.y === words[1].starty + words[1].word.length - 1) return;
          setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y + 1 });
          return;
        }
        setSelectedWord(words[0]);
        if (selectedCoordinates.y === words[0].starty + words[0].word.length - 1) return;
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y + 1 });
      }
    }
    else if (e.key === "ArrowLeft") {
      if (selectedWord.orientation === "across") {
        if (selectedCoordinates.x === selectedWord.startx) return;
        setSelectedCoordinates({ x: selectedCoordinates.x - 1, y: selectedCoordinates.y });
      }
      else {
        const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
        if (words.length > 1 && selectedWord?.word === words[0].word) {
          setSelectedWord(words[1]);
          if (selectedCoordinates.x === words[1].startx) return;
          setSelectedCoordinates({ x: selectedCoordinates.x - 1, y: selectedCoordinates.y });
          return;
        }
        setSelectedWord(words[0]);
        if (selectedCoordinates.x === words[0].startx) return;
        setSelectedCoordinates({ x: selectedCoordinates.x - 1, y: selectedCoordinates.y });
      }
    }
    else if (e.key === "ArrowRight") {
      if (selectedWord.orientation === "across") {
        if (selectedCoordinates.x === selectedWord.startx + selectedWord.word.length - 1) return;
        setSelectedCoordinates({ x: selectedCoordinates.x + 1, y: selectedCoordinates.y });
      }
      else {
        const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
        if (words.length > 1 && selectedWord?.word === words[0].word) {
          setSelectedWord(words[1]);
          if (selectedCoordinates.x === words[1].startx + words[1].word.length - 1) return;
          setSelectedCoordinates({ x: selectedCoordinates.x + 1, y: selectedCoordinates.y });
          return;
        }
        setSelectedWord(words[0]);
        if (selectedCoordinates.x === words[0].startx + words[0].word.length - 1) return;
        setSelectedCoordinates({ x: selectedCoordinates.x + 1, y: selectedCoordinates.y });
      }
    }
    else if (e.key === "Backspace") {
      if (!selectedCoordinates) return;
      // if it can go back, go back
      const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
      const anyWordIsCorrect = words.some((word) => word.correct);
      if (!anyWordIsCorrect) {
        const newLayout = { ...layout };
        newLayout.table[selectedCoordinates.y - 1][selectedCoordinates.x - 1].value = "";
        setLayout(newLayout);
      }

      if (selectedCoordinates.x === selectedWord.startx && selectedCoordinates.y === selectedWord.starty) return;
      if (selectedWord.orientation === "across") {
        setSelectedCoordinates({ x: selectedCoordinates.x - 1, y: selectedCoordinates.y });
      }
      else {
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y - 1 });
      }
    }
    else {
      console.log(e.key)
      //if not a letter, do nothing
      if (e.key.length > 1) return;
      const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
      const anyWordIsCorrect = words.some((word) => word.correct);
      if (!anyWordIsCorrect) {
        const newLayout = { ...layout };
        newLayout.table[selectedCoordinates.y - 1][selectedCoordinates.x - 1].value = e.key;

        if (checkWordIsCorrect(selectedWord)) {
          alert("correct")
          console.log("new layout", newLayout)
          // add "correct:true" to the word in the layout
          newLayout.result = newLayout.result.map((word) => {
            if (word.word === selectedWord.word) {
              word.correct = true;
            }
            return word;
          });
        }
        setLayout(newLayout);
      }
      if (selectedWord.orientation === "across") {
        // si es la última letra de la palabra, no hacer nada
        if (selectedCoordinates.x === selectedWord.startx + selectedWord.word.length - 1) return;

        setSelectedCoordinates({ x: selectedCoordinates.x + 1, y: selectedCoordinates.y });
      }
      else {
        // si es la última letra de la palabra, no hacer nada
        if (selectedCoordinates.y === selectedWord.starty + selectedWord.word.length - 1) return;
        setSelectedCoordinates({ x: selectedCoordinates.x, y: selectedCoordinates.y + 1 });
      }
    }
  }
  if (!layout) return <p>Cargando...</p>
  return (
    <>

      <div className="board" onKeyDown={handleKeyboard} tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              {colNumbers.map((col) => {
                return <th key={col}>{col}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {layout?.table.map((row, indexY) => {
              return <tr key={indexY}><td>{indexY + 1}</td>{row.map((cell, indexX) => {
                return <td
                  key={indexX}
                  className={(cell.correct === "-" ? "blank " : "") + (getSelectedLetterClass(indexX + 1, indexY + 1))}
                  onClick={() => selectWord(indexX + 1, indexY + 1)}
                >
                  {cell.correct !== "-" && cell.value}
                </td>
              })}</tr>
            })}
          </tbody>
        </table>
      </div>


      {selectWord && <div className="selected-word-section">
        {selectedWord?.definitions.map((definition, index) => {
          if (index !== 0) {
            return <p key={index}>{definition}</p>
          }

        })}
        {selectedWord?.synonyms.length > 0 && <p>Palabras relacionadas: <b>{selectedWord?.synonyms.join(", ")}</b></p>}
      </div>}
      <section className="keyboard-section">


        <Keyboard
          //onChange={handleKeyboard}
          onKeyPress={handleKeyboard}
          layout={{
            default: [
              "q w e r t y u i o p",
              "a s d f g h j k l",
              "z x c v b n m {bksp}",
            ],
          }}
        />
      </section>
    </>
  )
}

export default App
