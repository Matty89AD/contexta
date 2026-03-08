export default function AdminSources() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Content Sources
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Define monitored sources so new content is automatically scraped and queued
          for ingestion. Not yet active — coming in a future release.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              <th className="text-left px-4 py-3">Source name</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">URL</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Schedule</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Last checked</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={6}
                className="px-4 py-12 text-center text-zinc-400 text-sm"
              >
                No content sources configured yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button
          disabled
          title="Coming soon"
          className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-400 text-sm font-medium cursor-not-allowed"
        >
          + Add source (coming soon)
        </button>
      </div>
    </div>
  );
}
