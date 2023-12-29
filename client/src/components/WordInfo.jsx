import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaMagnifyingGlass } from "react-icons/fa6";
const WordInfo = ({ selectedWord, onClick, onLeft, onRight }) => {
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
        clickedRef.current = true;
        setIsClicked(true);
        onClick(e);
    }
    if (!selectedWord) {
        return <div className="selected-word-section" ref={startRef} />

    }
    const disabledWhenOnlyOneIncorrect = selectedWord.incorrectNum && selectedWord.incorrectNum === 1;
    return (
        <div className="selected-word-section" ref={startRef}>
            <div className="action-buttons">
                <div className="icon-button" onClick={onLeft}>
                    <FaArrowLeft  />
                </div>
                {selectedWord.correct || selectedWord.clues?.length >= selectedWord.maxClues || disabledWhenOnlyOneIncorrect || isClicked ?
                    <div className="icon-button disabled" >
                        <FaMagnifyingGlass  />
                    </div>
                    :
                    <div className="icon-button" onClick={handleClick}>
                        <FaMagnifyingGlass />
                    </div>
                }
                <div className="icon-button" onClick={onRight}>
                    <FaArrowRight  />
                </div>
            </div>
            {selectedWord?.definitions.map((definition, index) => {

                return <p key={index}>{definition}</p>

            })}
            {selectedWord?.synonyms.length > 0 && <p>Palabras relacionadas: <b>{selectedWord?.synonyms.join(", ")}</b></p>}
        </div>
    )
}

export default WordInfo;