import { useEffect, useState, useRef } from 'react'
import './App.css'

import KeyboardHandler from './components/keyboardHandler';
import WordInfo from './components/wordInfo';

import "react-simple-keyboard/build/css/index.css";
function App() {

  const [layout, setLayout] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const tableRef = useRef(null);
  const cellRef = useRef(null);
  useEffect(() => {
    const newLayout = getLayoutFromLocalStorage();
    if (newLayout) {
      setLayout(newLayout);
      return;
    }
    getCrossword();
  }
    , []);
  useEffect(() => {
    saveLayoutToLocalStorage();
  }, [layout])
  useEffect(() => {
    centerSelectedLetter();
  }, [selectedCoordinates])

  const saveLayoutToLocalStorage = () => {
    localStorage.setItem("layout", JSON.stringify(layout));
  }
  const getLayoutFromLocalStorage = () => {
    const layout = localStorage.getItem("layout");
    if (!layout) return null;
    return JSON.parse(layout);
  }
  const getCrossword = async () => {
    try {
      const count = 20;
      const res = await fetch(`https://api.crucigramas.lafuentedanel.com/api/crossword?count=${count}`)
      const data = await res.json()
      data.table = data.table.map((row) => {
        return row.map((cell) => {
          return { correct: cell, value: "" }
        })
      });
      data.result = data.result.map((word) => {
        word.correct = false;
        word.clues = [];
        word.maxClues = word.word.length / 2;
        word.maxPoints = word.maxClues * 2;
        return word;
      });
      console.log("result names", data.result.map((word) => word.word))
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

    if (!layout || !selectedCoordinates) return "";
    const words = letterBelongsToWords(x, y);
    if (!words) return "";
    let result = "";
    const anyWordIsCorrect = words.some((word) => {
      if (word.correct) return true;
      const index = coordsToCharPosition(x, y, word);
      return word.clues?.includes(index);
    });
    if (anyWordIsCorrect) result = "correct-letter ";
    if (selectedWordIndex === null) return "";
    const selectedWord = layout.result[selectedWordIndex];
    const isSelectedWord = words.some((word) => word.word === selectedWord.word);
    if (isSelectedWord) {

      if (selectedCoordinates?.x === x && selectedCoordinates?.y === y) {
        return result + "selected-letter"
      }
      return result + "selected-word"
    }
    return result;
  }
  const selectWord = (x, y) => {
    console.log("selectWord", x, y)
    if (!layout) return;
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    const words = letterBelongsToWords(x, y);
    if (!words || words.length === 0) return;
    if (selectedCoordinates?.x === x && selectedCoordinates?.y === y) {
      if (words.length > 1) {
        const word = words.find((word) => word.word !== selectedWord?.word) || words[0];
        setSelectedWordIndex(layout.result.indexOf(word));
        
      }
      return;
    }
    else {
      const word = words.some((word) => word.word === selectedWord?.word) ? selectedWord : words[0];
      setSelectedWordIndex(layout.result.indexOf(word));
      setSelectedCoordinates({ x, y });
    }

  }
  const coordsToCharPosition = (x, y, word) => {
    if (!layout) return null;
    const { startx, starty, orientation } = word;
    if (orientation === "across") {
      return x - startx;
    }
    return y - starty;
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


  const centerSelectedLetter = () => {
    if (!cellRef.current) return;
    const offsetX = cellRef.current.offsetLeft - tableRef.current.parentElement.clientWidth / 2 + cellRef.current.clientWidth / 2;
    const offsetY = cellRef.current.offsetTop - tableRef.current.parentElement.clientHeight / 2 + cellRef.current.clientHeight / 2;
    tableRef.current.parentElement.scrollLeft = offsetX;
    tableRef.current.parentElement.scrollTop = offsetY
  }

  const handleMoveCoordinates = (key, layout) => {
    const directions = {
      "ArrowUp": { x: 0, y: -1 },
      "ArrowDown": { x: 0, y: 1 },
      "ArrowLeft": { x: -1, y: 0 },
      "ArrowRight": { x: 1, y: 0 },
      "across": { x: 1, y: 0 },
      "down": { x: 0, y: 1 },
      "reverse-across": { x: -1, y: 0 },
      "reverse-down": { x: 0, y: -1 },
    }

    if (!layout) return;
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    const newCoords = { x: selectedCoordinates.x, y: selectedCoordinates.y };
    const direction = directions[key];
    console.log("direction", key)
    if (direction !== undefined) {
      newCoords.x += direction.x;
      newCoords.y += direction.y;
    }
    const words = letterBelongsToWords(newCoords.x, newCoords.y);
    if (words.length === 0) return null;
    const newWord = words.some((word) => word.word === selectedWord?.word) ? selectedWord : words[0];
    const incorrectLetters = getIncorrectLetters(selectedWord, layout);
    newWord.incorrectNum = incorrectLetters.length;
    setSelectedWordIndex(layout.result.indexOf(newWord));
    const newLayout = { ...layout };
    newLayout.result = newLayout.result.map((word) => {
      if (word.word === newWord?.word) {
        return newWord;
      }
      return word;
    });
    setLayout(newLayout);
    setSelectedCoordinates(newCoords);
    return newCoords;
  }
  const handleKeyboard = (event) => {
    if (!selectedCoordinates) return;

    if (!layout || selectedWordIndex === null) return;
    const selectedWord =  layout.result[selectedWordIndex];
    let direction = event;
    const newLayout = { ...layout };
    if (event === "Backspace") {
      // si la letra forma parte de una palabra correcta, no borrarla, saltar a la anterior letra
      const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
      const anyWordIsCorrect = words.some((word) => {
        if (word.correct) return true;
        const index = coordsToCharPosition(selectedCoordinates.x, selectedCoordinates.y, word);
        return word.clues?.includes(index);
      });

      if (!anyWordIsCorrect) {
        const newLayout = { ...layout };
        newLayout.table[selectedCoordinates.y - 1][selectedCoordinates.x - 1].value = "";
        setLayout(newLayout);
      }
      direction = "reverse-" + selectedWord.orientation;
    }
    else if (event.length === 1) {
      const words = letterBelongsToWords(selectedCoordinates.x, selectedCoordinates.y);
      const anyWordIsCorrect = words.some((word) => {
        if (word.correct) return true;
        const index = coordsToCharPosition(selectedCoordinates.x, selectedCoordinates.y, word);
        return word.clues?.includes(index);
      });

      if (!anyWordIsCorrect) {

        newLayout.table[selectedCoordinates.y - 1][selectedCoordinates.x - 1].value = event;
        const isWordCorrect = checkWordIsCorrect(selectedWord);
        if (isWordCorrect) {
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
      direction = selectedWord.orientation;
      console.log("directiond", selectedWordIndex)

    }
    handleMoveCoordinates(direction, newLayout);

  }
  const handleRefresh = () => {
    if (window.confirm("¿Estás seguro de que quieres empezar un nuevo crucigrama?")) {
      getCrossword();
      setSelectedCoordinates(null);
      setSelectedWordIndex(null);
    }
  }

  /**
   * si le quedan pistas, escoge un índice al azar de las letras no correctas de la palabra seleccionada y la marca como correcta
   */

  const getIncorrectLetters = (word, layout) => {
    try {
      if (!layout || !word) return [];
      const { startx, starty, orientation, word: answer } = word;
      const table = layout.table;
      const incorrectLetters = [];
      if (orientation === "across") {
        for (let i = 0; i < answer.length; i++) {
          if (table[starty - 1][startx + i - 1].correct !== table[starty - 1][startx + i - 1].value) incorrectLetters.push(i);
        }
      }
      else {
        for (let i = 0; i < answer.length; i++) {
          if (table[starty + i - 1][startx - 1].correct !== table[starty - 1][startx + i - 1].value) incorrectLetters.push(i);
        }
      }
      console.log("incorrectLetters", incorrectLetters)
      return incorrectLetters;
    }
    catch (err) {
      console.log("error", err)
      console.error(err);
      return [];
    }
  }
  const handleAddClue = () => {
    if (!layout) return;
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    if (!selectedWord) return;
    console.log("selectedWord")
    if (selectedWord.clues?.length >= selectedWord.maxClues) {
      alert("No puedes añadir más pistas a esta palabra");
      return;
    }
    console.log("selectedWord", selectedWord)
    const newLayout = { ...layout };
    const word = selectedWord;
    const { startx, starty, orientation } = word;
    let incorrectLetters = getIncorrectLetters(selectedWord, layout);
    console.log("incorrectLetters", incorrectLetters)
    if (incorrectLetters.length < 2) return;
    const randomIndex = Math.floor(Math.random() * incorrectLetters.length);
    const index = incorrectLetters[randomIndex];
    if (orientation === "across") {
      newLayout.table[starty - 1][startx + index - 1].value = word.word[index];
    }
    else {
      newLayout.table[starty + index - 1][startx - 1].value = word.word[index];
    }

    newLayout.result = newLayout.result.map((word) => {
      if (word.word === selectedWord.word) {
        word.clues.push(index);
      }
      return word;
    });
    incorrectLetters = getIncorrectLetters(selectedWord, newLayout);
    word.incorrectNum = incorrectLetters.length;
    console.log("newWord", word)
    setLayout(newLayout);
    setSelectedWordIndex(layout.result.indexOf(word));

  }

  if (!layout) return <p>Cargando...</p>
  return (
    <>
      <KeyboardHandler onKeyDown={event => handleKeyboard(event)}>
        <div className="App">
          <div className="board" tabIndex={0}>
            <table ref={tableRef}>
              <thead>
                <tr>
                  <td className="blank"></td>
                  <td className="blank"></td>
                  {colNumbers.map((col) => {
                    return <td
                      className={"blank " + (selectedCoordinates?.x === col ? "selected-letter" : "")}
                      key={col}>
                      {col}
                    </td>
                  })}
                  <td className="blank"></td>

                </tr>
                <tr>
                  {colNumbers.map((col) => {
                    return <td
                      className="blank"
                      key={col}>
                      &nbsp;
                    </td>
                  })}
                </tr>
              </thead>
              <tbody>
                {layout?.table.map((row, indexY) => {
                  return <tr key={indexY}>
                    <td
                      className={"blank " + (selectedCoordinates?.y === indexY + 1 ? "selected-letter" : "")}
                    >
                      {indexY + 1}
                    </td>
                    <td className="blank"></td>
                    {row.map((cell, indexX) => {
                      return <td
                        ref={selectedCoordinates?.x === indexX + 1 && selectedCoordinates?.y === indexY + 1 ? cellRef : null}
                        key={indexX}
                        className={(cell.correct === "-" ? "blank " : "") + getSelectedLetterClass(indexX + 1, indexY + 1)}
                        onClick={() => selectWord(indexX + 1, indexY + 1)}
                      >
                        {cell.correct !== "-" && cell.value}
                      </td>
                    })}
                    <td className="blank"></td>
                  </tr>
                })}
                <tr>
                  {colNumbers.map((col) => {
                    return <td
                      className="blank"
                      key={col}>
                      &nbsp;
                    </td>
                  })}
                </tr>
              </tbody>
            </table>

          </div>
          <WordInfo
            selectedWord={layout?.result[selectedWordIndex]}
            onClick={handleAddClue}
          />
          <section className="keyboard-section">



          </section>
        </div>
      </KeyboardHandler>
      <button onClick={handleRefresh}>Nuevo crucigrama</button>
    </>
  )
}

export default App
