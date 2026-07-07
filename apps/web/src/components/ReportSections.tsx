import type { ReportSection } from "@/lib/reports";

/** Generic renderer for a report's section tables (Prediction, Team Comparison, ...). */
export default function ReportSections({ sections }: { sections?: ReportSection[] }) {
  if (!sections || sections.length === 0) return null;
  return (
    <>
      {sections.map((s) => (
        <div key={s.name}>
          <h2>{s.name}</h2>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {s.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      // Always one <td> per cell: skipping nulls would shift
                      // later cells into the wrong team's column.
                      <td key={j} className={j === 0 ? "cell-label" : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
