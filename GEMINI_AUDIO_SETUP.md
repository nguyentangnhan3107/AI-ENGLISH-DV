# Gemini microphone transcription — updated fix

This patch changes the conversation microphone to capture PCM samples with the Web Audio API and create a WAV file directly. It no longer relies on `MediaRecorder` producing a WebM/MP4 file that `AudioContext.decodeAudioData` might fail to decode. The WAV is sent to Gemini for transcription.

The microphone needs Chrome/Edge, permission to use the mic, and a secure context (localhost or HTTPS). A valid Gemini API key must also be configured in `.env` in the project root.

## Apply this patch

Extract this ZIP into the project root (the folder containing `package.json`) and replace these files:
- `pages/Practice.tsx`
- `services/geminiService.ts`

Keep `.env` private; do not upload it or put it in screenshots. Restart Vite after replacing files: stop with `Ctrl+C`, then run `npm run dev`.

## Microphone use

1. Click the microphone and speak for a second or two.
2. Click the microphone again to finish.
3. Wait for the transcript to appear in the chat box, then press Send.

This patch has syntax-transpilation checks only; it has not been run against a physical microphone in the user's browser.
