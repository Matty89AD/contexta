import { NEWS_POST_TYPES } from "@/lib/db/types";
import type { NewsPostType, NewsPostStatus } from "@/lib/db/types";

export function NewsPostFields({
  type, setType,
  title, setTitle,
  description, setDescription,
  publishedDate, setPublishedDate,
  postStatus, setPostStatus,
  sortOrder, setSortOrder,
}: {
  type: NewsPostType; setType: (v: NewsPostType) => void;
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  publishedDate: string; setPublishedDate: (v: string) => void;
  postStatus: NewsPostStatus; setPostStatus: (v: NewsPostStatus) => void;
  sortOrder: string; setSortOrder: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NewsPostType)}
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          {NEWS_POST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Display date <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={publishedDate}
          onChange={(e) => setPublishedDate(e.target.value)}
          placeholder="e.g. Mar 2026"
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={postStatus}
          onChange={(e) => setPostStatus(e.target.value as NewsPostStatus)}
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Sort order{" "}
          <span className="font-normal text-zinc-400">(lower = shown first)</span>
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-32 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        />
      </div>
    </>
  );
}
