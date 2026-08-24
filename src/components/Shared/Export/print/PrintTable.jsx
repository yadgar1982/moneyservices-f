const PrintTable = ({
  columns = [],
  data = [],
  footerRow,
}) => {
  const getNumericValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    return Number(String(value).replace(/,/g, "")) || 0;
  };

  const getAmountClass = (value) => {
    return getNumericValue(value) < 0
      ? "text-rose-600"
      : "text-slate-700";
  };

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
            {columns.map((column, colIndex) => {
              const value = row[column.dataIndex];

              const isBalance =
                column.dataIndex === "balance";

              return (
                <td
                  key={colIndex}
                  className={`border border-gray-300 px-3 py-2 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${
                    isBalance
                      ? getAmountClass(value)
                      : ""
                  }`}
                >
                  {column.render
                    ? column.render(
                        value,
                        rowIndex,
                        row
                      )
                    : value}
                </td>
              );
            })}
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
                      className="border border-gray-300 px-3 py-2 text-right text-slate-700"
                    >
                      Total
                    </td>
                  );

                case "debit":
                  return (
                    <td
                      key={index}
                      className={`border border-gray-300 px-3 py-2 text-right ${getAmountClass(
                        footerRow.debit
                      )}`}
                    >
                      {footerRow.debit}
                    </td>
                  );

                case "credit":
                  return (
                    <td
                      key={index}
                      className={`border border-gray-300 px-3 py-2 text-right ${getAmountClass(
                        footerRow.credit
                      )}`}
                    >
                      {footerRow.credit}
                    </td>
                  );

                case "balance":
                  return (
                    <td
                      key={index}
                      className={`border border-gray-300 px-3 py-2 text-right ${getAmountClass(
                        footerRow.balance
                      )}`}
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