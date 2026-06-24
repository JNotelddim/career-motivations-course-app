import cn from "classnames";

// Fixed-grid control: rows (fixed labels) × columns. Each cell is a free-text input —
// columns in the content model carry both text asks ("Examples", "Gut reaction") and
// numeric-as-text asks ("Rank", "Score (1–10)"), so the flexible cell type is `string`.
//
// Cells are keyed `${rowIndex}::${columnId}` into a flat record. The grid is fixed
// (rows/columns come from the const), so positional row keys are stable enough here.
//
// NOTE for wiring: this emits `Record<string, string>`. The placeholder
// `MatrixAnswer.value: Record<string, number>` in answerStateProvider.tsx will need to
// become `Record<string, string>` to match (already flagged as a placeholder in TASKS).

type MatrixColumn = { id: string; label: string };

export const Matrix: React.FC<{
  rows: string[];
  columns: MatrixColumn[];
  value: Record<string, string>;
  onChange: (newValue: Record<string, string>) => void;
  className?: string;
}> = ({ rows, columns, value, onChange, className }) => {
  console.log("Matrix value:", value, columns, rows);
  const cellKey = (rowIndex: number, columnId: string) =>
    `${rowIndex}::${columnId}`;

  const handleCellChange = (
    rowIndex: number,
    columnId: string,
    cellValue: string,
  ) => {
    onChange({ ...value, [cellKey(rowIndex, columnId)]: cellValue });
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      {!rows?.length && !columns?.length && (
        <p className="text-md sm:text-lg">
          Error: No rows or columns defined for this matrix.
        </p>
      )}
      {/* {!value && (
        <p className="text-md sm:text-lg">
          Error: No value provided for this matrix.
        </p>
      )} */}

      {rows.length > 0 && columns.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b p-2 text-left font-medium text-gray-700" />
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="border-b p-2 text-left font-medium text-gray-700"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th
                  scope="row"
                  className="border-b p-2 text-left font-normal align-top"
                >
                  {row}
                </th>
                {columns.map((column) => (
                  <td key={column.id} className="border-b p-2 align-top">
                    <input
                      type="text"
                      value={value[cellKey(rowIndex, column.id)] ?? ""}
                      onChange={(e) =>
                        handleCellChange(rowIndex, column.id, e.target.value)
                      }
                      className="w-full border rounded p-2"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
