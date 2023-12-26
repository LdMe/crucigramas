import OpenAI from 'openai';
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const getClues = async (word) => {
    const systemMessage = "eres un software de ayuda en la resolución de crucigramas.\
     El cliente te pasa una palabra y su definición y tienes que devolverle una pista para ayudar al usuario a descubrir la palabra.\
      No puedes usar la misma palabra exacta en un ejemplo, pero sí palabras relacionadas que permitan identificar mejor la palabra.\
       Tampoco valen pistas sobre el número de letras, ya que el usuario puede contar los huecos.\
       valen las pistas sobre el género de la palabra, si es un verbo, si es un adjetivo, etc.\
       la respuesta debe tener 5 pistas, cada una debe aportar información nueva. la primera debe ser la una versión más clara de la definición,y, si no se usa en españa, mencionar los países en los que se usa, y las siguientes deben ser cada vez más claras. Las pistas no pueden ser sinónimos de la palabra.\
       también debe tener 5 sinónimos o palabras relacionadas con la palabra.\
       La respuesta debe ser en formato json, con la siguiente estructura:\
    {clues:[...],synonyms:[...]}\
    donde clues es un array de pistas y synonyms es un array de sinónimos de la palabra. Ni las pistas ni los sinónimos están numerados.\
    ";
    const messages = [
        {
            role: 'system',
            content: systemMessage
        },
        {
            role: 'user',
            content: JSON.stringify(word)
        }
    ];
    const completion = await openai.chat.completions.create({
        messages,
        model:"gpt-3.5-turbo-0613"
    });
    return completion.choices[0].message;
}