import { PatientSeek, PatientSeekChat } from "./src/index";
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
    prompt: "what should i do if i have a headache",
    system:
      "You are a helpful assistant Medical Assistant. Your task is to help patients find the best doctors and clinics.",
  });
  console.log(text);
})();
