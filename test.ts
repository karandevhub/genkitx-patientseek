import PatientSeek, { PatientSeekChat } from "./src/index";
import { genkit, z } from "genkit";
import * as dotenv from "dotenv";

dotenv.config();

const ai = genkit({
  plugins: [
    PatientSeek({
      apiKey: process.env.PATIENT_SEEK_API_KEY,
    }),
  ],
  model: PatientSeekChat,
});

(async () => {
  const { text } = await ai.generate({
    system: "You are a helpful assistant. use tools to give answer",
    prompt: "hi",
  });
  console.log(text);
})();
