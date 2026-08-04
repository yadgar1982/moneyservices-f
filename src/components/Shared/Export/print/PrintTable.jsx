const PrintTable = ({
  columns = [],
  data = [],
  footerRow,
}) => {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-emerald-700 text-white">
          {columns.map((column, index) => (
            <th
              key={index}
              className="border border-gray-300 px-3 py-2 text-left"
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className="even:bg-gray-50"
          >
            {columns.map((column, colIndex) => (
              <td
                key={colIndex}
                className={`border border-gray-300 px-3 py-2 ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {column.render
                  ? column.render(row[column.dataIndex], rowIndex, row)
                  : row[column.dataIndex]}
              </td>
            ))}
          </tr>
        ))}

        {footerRow && (
          <tr className="bg-slate-100 font-bold border-t-2 border-slate-500">
            {columns.map((column, index) => {
              switch (column.dataIndex) {
                case "description":
                  return (
                    <td
                      key={index}
                      className="border border-gray-300 px-3 py-2 text-right"
                    >
                      TOTAL
                    </td>
                  );

                case "debit":
                  return (
                    <td
                      key={index}
                      className="border border-gray-300 px-3 py-2 text-right text-red-600"
                    >
                      {footerRow.debit}
                    </td>
                  );

                case "credit":
                  return (
                    <td
                      key={index}
                      className="border border-gray-300 px-3 py-2 text-right text-green-600"
                    >
                      {footerRow.credit}
                    </td>
                  );

                case "balance":
                  return (
                    <td
                      key={index}
                      className={`border border-gray-300 px-3 py-2 text-right ${
                        Number(
                          String(footerRow.balance).replace(/,/g, "")
                        ) < 0
                          ? "text-red-600"
                          : "text-slate-700"
                      }`}
                    >
                      {footerRow.balance}
                    </td>
                  );

                default:
                  return (
                    <td
                      key={index}
                      className="border border-gray-300"
                    />
                  );
              }
            })}
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default PrintTable;