const PrintSummary = ({
  items = [],
  variant = "top",
}) => {
  // Top summary
  if (variant === "top") {
    return (
      <div className="flex justify-center items-center gap-14 border-y border-gray-300 py-3 my-5">
        {items.map((item, index) => (
          <div key={index} className="text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {item.title}
            </p>

            <p className={`mt-1 text-2xl font-bold ${item.className}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Bottom summary
  return (
    <div className="mt-6 border-t border-gray-300 pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Statement Summary
      </h3>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between text-sm"
          >
            <span className="font-medium text-gray-600">
              {item.title}
            </span>

            <span className={`font-bold ${item.className}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintSummary;