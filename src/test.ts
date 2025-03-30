import { PatientSeek, PatientSeekChat } from "./index.js";
import { genkit} from "genkit";
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
    prompt: "hi",
    system:
      "You are a helpful assistant."
  });
  console.log(text);
})();
