# Firebase Genkit - PatientSeek Plugin

<h1 align="center">Firebase Genkit - PatientSeek Plugin</h1>

<h4 align="center">A Community Plugin for Google Firebase Genkit</h4>

**`genkitx-patientseek`** is a community plugin designed to integrate OpenAI APIs with [Firebase Genkit](https://github.com/firebase/genkit). Built and maintained by [**The Fire Company**](https://github.com/TheFireCo). 🔥

This plugin enables seamless interaction with OpenAI models through their official APIs, providing robust capabilities for medical-assistant tasks.

---

## 🚀 Features

- **Medical AI Integration**: Uses the DeepSeek R1 Distill Llama 8B model trained on extensive patient records.
- **Summarization & Hypothesis Testing**: Extracts and processes medical records with associative reasoning.
- **Seamless Genkit Compatibility**: Easily integrate with Firebase Genkit.
- **Secure API Handling**: Works with environment variables for API key management.

---

## 📦 Installation

Install the plugin in your project using your preferred package manager:

```sh
npm install genkitx-patientseek
```

```sh
yarn add genkitx-patientseek
```

```sh
pnpm add genkitx-patientseek
```

---

## 🔧 Usage

### 1️⃣ Initialize the Plugin

```typescript
import { PatientSeek, PatientSeekChat } from "genkitx-patientseek";
import { genkit } from "genkit";
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
```

### 2️⃣ Generate Medical Advice

```typescript
(async () => {
  const { text } = await ai.generate({
    prompt: "What should I do if I have a headache?",
    system:
      "You are a helpful Medical Assistant. Your task is to help patients find the best doctors and clinics.",
  });
  console.log(text);
})();
```

---

## 📖 About the Model

**Model Name**: DeepSeek R1 Distill Llama 8B  
**Developed by**: [whyhow.ai](https://unsloth.ai/blog/deepseek-r1)  
**Purpose**: Medical summarization, record extraction, and medical-legal reasoning  
**Repository**: [DeepSeek R1 Distill Llama 8B GGUF](https://huggingface.co/unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF)  
**Article**: [Introducing PatientSeek](https://medium.com/enterprise-rag/introducing-patientseek-the-first-open-source-med-legal-deepseek-reasoning-model-74f98e9608ae)  

---

## 🌟 Contributing

Want to contribute? We'd love your help! Check out our [Contribution Guidelines](https://github.com/TheFireCo/genkit-plugins/blob/main/CONTRIBUTING.md) to get started.

For support or feedback, contact us at **team@whyhow.ai**.

Happy coding! 🚀

