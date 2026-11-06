const SHOWN = 8

export function FilesRead({ files, omitted }: { files: string[] | null; omitted: string[] }) {
  return (
    <section aria-labelledby="files-h" className="flex min-w-0 flex-col gap-3">
      <h2 id="files-h" className="mb-1 text-title-3 font-medium">
        Files read
      </h2>
      {!files && <p className="text-[12px] text-ink-3">Choosing which files to read…</p>}
      {files && (
        <ul className="flex flex-col gap-1.5 font-mono text-[12px] leading-[18px] break-all text-ink-2">
          {files.slice(0, SHOWN).map((path) => (
            <li key={path}>{path}</li>
          ))}
          {files.length > SHOWN && (
            <li>
              <details>
                <summary className="cursor-pointer text-ink-3">and {files.length - SHOWN} more</summary>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {files.slice(SHOWN).map((path) => (
                    <li key={path}>{path}</li>
                  ))}
                </ul>
              </details>
            </li>
          )}
        </ul>
      )}
      {omitted.length > 0 && (
        <p className="text-[12px] leading-[18px] text-ink-3">
          Left out to stay within the context limit: {omitted.join(', ')}
        </p>
      )}
    </section>
  )
}
