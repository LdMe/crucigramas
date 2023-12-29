import { useRef, useEffect } from "react";

const Board = ({ layout, selectedCoordinates, onClick, getClass }) => {

    const tableRef = useRef(null);
    const cellRef = useRef(null);
    useEffect(() => {
        centerBoard();
    }, [layout]);
    useEffect(() => {
        if (selectedCoordinates) {
            centerSelectedLetter();
        }
    }, [selectedCoordinates]);
    const centerSelectedLetter = () => {
        if (!cellRef.current) return;
        const offsetX = cellRef.current.offsetLeft - tableRef.current.parentElement.clientWidth / 2 + cellRef.current.clientWidth / 2;
        const offsetY = cellRef.current.offsetTop - tableRef.current.parentElement.clientHeight / 2 + cellRef.current.clientHeight / 2;
        tableRef.current.parentElement.scrollLeft = offsetX;
        tableRef.current.parentElement.scrollTop = offsetY
    }
    const centerBoard = () => {
        if (!tableRef.current) return;
        const offsetX = tableRef.current.clientWidth / 2 - tableRef.current.parentElement.clientWidth / 2;
        const offsetY = tableRef.current.clientHeight / 2 - tableRef.current.parentElement.clientHeight / 2;
        tableRef.current.parentElement.scrollLeft = offsetX;
        tableRef.current.parentElement.scrollTop = offsetY
        
    }
    const colNumbers = [];
    for (let i = 0; i < layout?.cols; i++) {
        colNumbers.push(i + 1);
    }
    return (
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
                                    className={(cell.correct === "-" ? "blank " : "") + getClass(indexX + 1, indexY + 1)}
                                    onClick={() => onClick(indexX + 1, indexY + 1)}
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
    )
}

export default Board;