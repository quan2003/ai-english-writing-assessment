# Writing Assessment

Next.js App Router web app for university English writing assessment. Lecturers paste a writing task and student essay, then the server-side API calls OpenAI and returns a structured JSON score.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

3. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Push the repository to GitHub, import it into Vercel, and add `OPENAI_API_KEY` to the Vercel environment variables. `OPENAI_MODEL` is optional and defaults to `gpt-5-mini`.

## Notes

- The API key is used only in `app/api/grade/route.ts`.
- Session history lives only in React state and is cleared when the page reloads.
- The AI response is constrained with a JSON schema and validated again on the server before it reaches the browser.
