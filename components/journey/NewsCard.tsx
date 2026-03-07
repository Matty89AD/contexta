type NewsItemType = "podcast" | "artifact" | "article";

interface NewsItem {
  id: string;
  type: NewsItemType;
  title: string;
  description: string;
  date: string;
}

const TYPE_LABELS: Record<NewsItemType, string> = {
  podcast: "Podcast",
  artifact: "Artifact",
  article: "Article",
};

const TYPE_STYLES: Record<NewsItemType, string> = {
  podcast: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  artifact: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  article: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
};

// Mock data — to be replaced by Admin UI managed content
const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    type: "podcast",
    title: "Lenny's Podcast — How to run continuous discovery with Teresa Torres",
    description: "Teresa Torres shares her opportunity solution tree method and how PMs can build a habit of weekly customer touchpoints.",
    date: "Mar 2026",
  },
  {
    id: "2",
    type: "artifact",
    title: "New: CIRCLES Framework",
    description: "A structured method for answering product design questions, covering Comprehend, Identify, Report, Cut, List, Evaluate, and Summarise.",
    date: "Feb 2026",
  },
  {
    id: "3",
    type: "podcast",
    title: "The Product Podcast — Shape Up in practice at Basecamp",
    description: "Ryan Singer walks through how Basecamp uses six-week cycles, shaping, and betting tables to decide what gets built.",
    date: "Feb 2026",
  },
  {
    id: "4",
    type: "artifact",
    title: "New: Jobs-to-be-Done Framework",
    description: "A lens for understanding why customers hire a product, focusing on the progress they are trying to make rather than features.",
    date: "Jan 2026",
  },
  {
    id: "5",
    type: "article",
    title: "Product strategy — Silicon Valley Product Group",
    description: "Marty Cagan's overview of what real product strategy looks like and why most companies confuse it with a roadmap.",
    date: "Dec 2025",
  },
];

export function NewsCard() {
  return (
    <aside className="lg:sticky lg:top-20 self-start">
      <div className="bg-card rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            What&apos;s New
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
            Knowledge base updates
          </p>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {NEWS_ITEMS.map((item) => (
            <li key={item.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${TYPE_STYLES[item.type]}`}
                >
                  {TYPE_LABELS[item.type]}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                  {item.date}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                {item.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
