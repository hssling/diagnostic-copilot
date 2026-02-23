# Deployment & Integration Documentation

**Multi-Modal Diagnostic Co-Pilot Frontend**

This application serves as the user-facing clinical interface that orchestrates multimodal medical inputs (patient history, vitals, medical imaging/diagnostics, and dictation audio).

This frontend is designed to natively connect to either public API models (like Google's Gemini Pro/Flash) OR completely private, custom-fine-tuned Multi-Modal Vision Language Models (like Qwen2-VL) hosted on Hugging Face Spaces.

## Ecosystem Architecture

The Diagnostic Co-Pilot utilizes a 3-tier continuous intelligence pipeline:

1. **Frontend (React/Vite):** This repository. Captures multimodal clinical arrays and tunnels them to an AI endpoint via API keys or Gradio's websocket client.
2. **Kaggle Training Pipeline:** A continuous-learning backend notebook that pulls raw datasets and trains PEFT/LoRA modules on top of foundation vision models safely within a free T4x2 GPU limitation.
3. **Hugging Face Inference Endpoint:** An automated Gradio space that hosts the continuously trained LoRA weights.

## How to Deploy the Frontend (Netlify)

Because `netlify.toml` is included in the project root, deployment is a 1-click process:

1. Go to your **[Netlify Dashboard](https://app.netlify.com/start)**.
2. Click **Import from GitHub** and select your `hssling/diagnostic-copilot` repository.
3. Click **Deploy**. Netlify will automatically detect the Vite build settings and launch your serverless domain (e.g., `diagnostic-copilot.netlify.app`).

## Connecting to the Hugging Face AI Backend

Once you have trained the custom vision model in Kaggle (refer to the `diagnostic-copilot-model` documentation):

1. Open this React Web App locally by running `npm run dev` or navigate to your Netlify deployment URL.
2. Click the **Configuration / Settings** (Gear icon) button on the sidebar.
3. Under the **Inference Target** dropdown, select `Custom Hugging Face Space Endpoint`.
4. Under the newly revealed **Hugging Face Space ID** field, type exactly your Space repository string: `hssling/diagnostic-copilot-api`.
5. _(Optional, but recommended)_: Paste your Hugging Face Token (starts with `hf_...`) into the API Key box at the top to ensure secure communication and bypass any public rate-limiting.
6. Click **Save & Close**.

Your React interface is now securely tied directly into your custom-trained Multimodal Vision AI endpoint!

## Running Locally for Development

1. Clone this repository down to your machine.
2. Ensure you have Node +18 installed.
3. Run `npm install`
4. Run `npm run dev`
5. Visit `http://localhost:5173` in your browser.
