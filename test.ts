import PatientSeek, { PatientSeekChat } from "./src/index";
import { genkit } from "genkit";

const ai = genkit({
  plugins: [
    PatientSeek(),
  ],
  model: PatientSeekChat,
});

(async () => {
  const { text } = await ai.generate("hello");
console.log(text);
})();
