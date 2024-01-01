import { useEffect, useState, useRef } from 'react'
import './App.css'

import KeyboardHandler from './components/KeyboardHandler';
import WordInfo from './components/WordInfo';
import Board from './components/Board';

import "react-simple-keyboard/build/css/index.css";
import OptionsMenu from './components/Options';
import { FaArrowRotateRight } from 'react-icons/fa6';
function App() {

  const [layout, setLayout] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [isEnded,setIsEnded] = useState(false);

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
    if(!layout){
      return;
    }
    saveLayoutToLocalStorage();
    let ended = true;
    for(const word of layout.result){
      if(!word.correct){
        ended = false;
        break;
      }
    }
    if(ended && !isEnded) {
      setIsEnded(true);
      return;
    }
    if(!selectedCoordinates){
      handLeChangeSelectedWord(0);
    }
  }, [layout])
  useEffect(() => {
    //centerSelectedLetter();
  }, [selectedCoordinates])
  useEffect(()=>{
    if(isEnded){
      alert("este juego ha terminado")
      alert("mucho antes de empezar")
      setTimeout(()=>{
        getCrossword();
      },1000)
      return;
    }
  },[isEnded])
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
      const count = 3;
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
      }).filter(word => word.orientation !== "none")
      setLayout(data);

    }
    catch (err) {
      setLayout(null);
      console.error(err)
    }

  }

  const getWordsFromCoords = (x, y) => {
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
    const words = getWordsFromCoords(x, y);
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
    if (!layout) return;
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    const words = getWordsFromCoords(x, y);
    if (!words || words.length === 0) return;
    if (selectedCoordinates?.x === x && selectedCoordinates?.y === y) {
      if (words.length > 1) {
        const word = words.find((word) => word.word !== selectedWord?.word) || words[0];
        setSelectedWordIndex(layout.result.indexOf(word));
      }
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


  const getNewCoordinates = (key, layout, coords) => {
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
    const newCoords = { x: coords.x, y: coords.y };
    const direction = directions[key];
    if (direction !== undefined) {
      newCoords.x += direction.x;
      newCoords.y += direction.y;
    }
    return newCoords;
  }


  const handleMoveCoordinates = (key, layout) => {
    if (!layout) return;

    // get new coordinates, check if they belong to a word
    const newCoords = getNewCoordinates(key, layout, selectedCoordinates);
    const words = getWordsFromCoords(newCoords.x, newCoords.y);
    if (words.length === 0) return null;

    // get the word that is selected or the first word
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    const newWord = words.some((word) => word.word === selectedWord?.word) ? selectedWord : words[0];

    setSelectedWordIndex(layout.result.indexOf(newWord));
    setSelectedCoordinates(newCoords);
    return newCoords;
  }
  const handleCorrectWord = (word,layout) => {

    if(!checkWordIsCorrect(word)) return;
    const selectedWord = selectedWordIndex !== null ? layout.result[selectedWordIndex] : null;
    if(!selectedWord){
      return null;
    }
    const newLayout = {...layout};
    newLayout.result = newLayout.result.map((word) => {
      if (word.word === selectedWord.word) {
        word.correct = true;
      }
      return word;
    }
    );
    return newLayout;
  }

  const handleKeyboard = (event) => {
    if (!selectedCoordinates) return;

    if (!layout || selectedWordIndex === null) return;
    const selectedWord = layout.result[selectedWordIndex];
    let direction = event;
    let newLayout = { ...layout };
    if (event === "Backspace") {
      // si la letra forma parte de una palabra correcta, no borrarla, saltar a la anterior letra
      const words = getWordsFromCoords(selectedCoordinates.x, selectedCoordinates.y);
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
    else if(event === "Tab"){
      handLeChangeSelectedWord(1)
      return;
    }
    else if (event.length === 1) {
      //si es una letra, añadirla
      const words = getWordsFromCoords(selectedCoordinates.x, selectedCoordinates.y);
      const anyWordIsCorrect = words.some((word) => {
        if (word.correct) return true;
        const index = coordsToCharPosition(selectedCoordinates.x, selectedCoordinates.y, word);
        return word.clues?.includes(index);
      });

      if (!anyWordIsCorrect) {
        newLayout.table[selectedCoordinates.y - 1][selectedCoordinates.x - 1].value = event;
        const newLayoutWithCorrect = handleCorrectWord(selectedWord,newLayout);
        if(newLayoutWithCorrect) {
          newLayout = newLayoutWithCorrect;
        }
        setLayout(newLayout);
      }
      direction = selectedWord.orientation;

    }
    else{
      console.log("pressed key: ",event)
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

  const getIncorrectLetters = (word, layout) => {
    try {
      if (!layout || !word) return [];
      const { startx, starty, orientation, word: answer } = word;
      if(!orientation || orientation === "none"){
        return 0;
      }
      const table = layout.table;
      const incorrectLetters = [];
      const directions = {
        across: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
      }
      for (let i = 0; i < answer.length; i++) {
        const x = startx + i * directions[orientation].x;
        const y = starty + i * directions[orientation].y;
        if (table[y - 1][x - 1].correct !== table[y - 1][x - 1].value) incorrectLetters.push(i);
      }
      return incorrectLetters;
    }
    catch (err) {
      console.error("error", err)
      console.error(err);
      return [];
    }
  }

  const handleAddClue = () => {
    if (!layout || !selectedWordIndex) return;
    const selectedWord =layout.result[selectedWordIndex];
    if (!selectedWord) return;
    if (selectedWord.clues?.length >= selectedWord.maxClues) {
      alert("No puedes añadir más pistas a esta palabra");
      return;
    }
    const newLayout = { ...layout };
    const { startx, starty, orientation } = selectedWord;
    let incorrectLetters = getIncorrectLetters(selectedWord, layout);
    if (incorrectLetters.length < 2) return;
    const randomIndex = Math.floor(Math.random() * incorrectLetters.length);
    const index = incorrectLetters[randomIndex];
    const directions = {
      across: { x: 1, y: 0 },
      down: { x: 0, y: 1 },
    }
    newLayout.table[starty - 1 + index * directions[orientation].y][startx - 1 + index * directions[orientation].x].value = selectedWord.word[index];
    newLayout.result = newLayout.result.map((word) => {
      if (word.word === selectedWord.word) {
        if (!word.clues) word.clues = [];
        if (!word.clues.includes(index)){
          word.clues.push(index);
        }
      }
      return word;
    });
    setLayout(newLayout);

  }
  const handLeChangeSelectedWord = (direction) => {
    let newIndex = selectedWordIndex ? selectedWordIndex + direction : direction;
    newIndex = newIndex < 0 ? layout.result.length - 1 : newIndex;
    newIndex = newIndex >= layout.result.length ? 0 : newIndex;
    const newCoords = { x: layout.result[newIndex].startx, y: layout.result[newIndex].starty };
    setSelectedCoordinates(newCoords);
    setSelectedWordIndex(newIndex);
  }
  if (!layout) return <p>Cargando...</p>
  const newLayout = { ...layout };
  newLayout.result = newLayout.result.map((word) => {
    word.incorrectNum = getIncorrectLetters(word, layout).length;
    return word;
  });
  return (
    <>
      <KeyboardHandler onKeyDown={event => handleKeyboard(event)}>
        <div className="App">

          <Board
            layout={newLayout}
            selectedCoordinates={selectedCoordinates}
            onClick={selectWord}
            getClass={getSelectedLetterClass}
          />
          <WordInfo
            selectedWord={layout?.result[selectedWordIndex]}
            onClick={handleAddClue}
            onLeft={() => handLeChangeSelectedWord(-1)}
            onRight={() => handLeChangeSelectedWord(1)}
          />
          <section className="keyboard-section">



          </section>
        </div>
      </KeyboardHandler>
        <OptionsMenu
          options={[<FaArrowRotateRight/>]}
          onClick={handleRefresh}
        />
        
    </>
  )
}

export default App
