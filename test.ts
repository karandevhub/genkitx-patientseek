import deepseek from "./src/index";
import { genkit } from "genkit";


const ai = genkit({
  plugins: [
    deepseek({
      baseURL:
        "https://sjp8h5vzufpc6woi.us-east-1.aws.endpoints.huggingface.cloud/v1/",
      
    }),
  ],
  model: "whyhow-ai/PatientSeek",
});

(async () => {
  const { text } = await ai.generate("Tell me a joke!");
  console.log(text);
})();
