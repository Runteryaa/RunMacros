# RunMacros

An Express/EJS application for tracking meals and calories. It also generates recipes using the DeepSeek R1 model through the HuggingFace inference API.

## Usage

Install dependencies and start the server:

```bash
npm install
node server.js
```

Set the environment variable `HF_TOKEN` with a valid HuggingFace access token to enable recipe generation.
