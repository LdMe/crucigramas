import Keyboard from "react-simple-keyboard";
import { useRef } from "react";
const KeyboardHandler = ({ children, onKeyDown }) => {
    const keyboardRef = useRef(null);
    

    const handleKeyboard = (e) => {
        console.log("event!!",e)
        if (!e.key) {
            if (e === "{bksp}") {
                e = "Backspace"
            }
            else if(e.length > 1){
                e = e[e.length - 1];
            }
            e = { key: e }

        }
        else {
            e.preventDefault();
        }
        onKeyDown(e.key);
        keyboardRef.current.clearInput();
    }
    return (
        <div onKeyDown={handleKeyboard}>
            {children}
            <Keyboard
                onChange={handleKeyboard}
                onKeyPress={handleKeyboard}
                keyboardRef={(r) => (keyboardRef.current = r)}
                layout={{
                    default: [
                        "q w e r t y u i o p",
                        "a s d f g h j k l",
                        "z x c v b n m {bksp}",
                    ],
                }}
            />
        </div>
    );
};

export default KeyboardHandler;