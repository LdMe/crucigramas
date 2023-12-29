import { useState } from "react"
import { FaGear } from "react-icons/fa6";
const OptionsMenu = ({ options, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!isOpen) {
        return (
            <div className="options-menu">
                <div className="icon-button p0" onClick={() => setIsOpen(true)}>
                    <FaGear />
                </div>
            </div>
        )
    }
    return (
        <div className={"options-menu-background " + (isOpen ? "options-menu-background-open" : "")} onClick={() => setIsOpen(false)}>
            <div className={"options-menu" + (isOpen && " selected")}>
                <div className="options-menu-content">
                    {options.map((option, index) => {
                        return <div className="options-menu-item" key={index} onClick={() => onClick(option)}>
                            {option}
                        </div>
                    })}
                </div>
            </div>
        </div>
    )
}

export default OptionsMenu