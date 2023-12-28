import { useEffect, useRef,useState } from "react";

const WordInfo = ({ selectedWord, onClick }) => {
    const startRef = useRef(null);
    const clickedRef = useRef(false);
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        if (startRef.current) {
            startRef.current.scrollTop = 0;
        }
        
    }, [selectedWord])
    useEffect(() => {
        clickedRef.current = false;
        setIsClicked(false);
    }, [selectedWord])
    const handleClick = (e) => {
        if (clickedRef.current) {
            return;
        }
        console.log("clicked", clickedRef.current);
        clickedRef.current = true;
        setIsClicked(true);
        onClick(e);
    }
    if (!selectedWord) {
        return <div className="selected-word-section" ref={startRef}/>

    }
    const disabledWhenOnlyOneIncorrect = selectedWord.incorrectNum && selectedWord.incorrectNum === 1;
    return (
        <div className="selected-word-section" ref={startRef}>
            <button
                onClick={handleClick}
                disabled={ selectedWord.correct || selectedWord.clues?.length >= selectedWord.maxClues  || disabledWhenOnlyOneIncorrect || isClicked }
            >
                Pista
            </button>
            {selectedWord?.definitions.map((definition, index) => {

                return <p key={index}>{definition}</p>

            })}
            {selectedWord?.synonyms.length > 0 && <p>Palabras relacionadas: <b>{selectedWord?.synonyms.join(", ")}</b></p>}
        </div>
    )
}

export default WordInfo;