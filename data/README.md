# Data for ingestion

Put podcast transcripts (or other long-form text) here, then run:

```bash
npm run ingest-transcript -- data/transcript.txt
```

Optional flags:

- `--title "Episode title"` — display title (default: filename without extension)
- `--url "https://..."` — link to the episode
- `--summary "One sentence summary."` — short summary for the content record
- `--domain strategy` — one of: strategy, discovery, delivery, growth, leadership

Example:

```bash
npm run ingest-transcript -- data/my-podcast.txt --title "Building roadmaps" --url "https://example.com/ep1" --domain strategy
```

Requires `.env.local` with `OPENROUTER_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
