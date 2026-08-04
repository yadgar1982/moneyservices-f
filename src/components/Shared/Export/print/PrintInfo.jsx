const PrintInfo = ({ items = [] }) => {
  return (
    <div className="mb-5 text-sm">
      {Array.from({ length: Math.ceil(items.length / 2) }).map((_, index) => {
        const left = items[index * 2];
        const right = items[index * 2 + 1];

        return (
          <div
            key={index}
            className="grid grid-cols-2 gap-12 py-1"
          >
            <div>
              <span className="font-semibold text-gray-600">
                {left?.label} :
              </span>{" "}
              <span className="font-bold text-black">
                {left?.value || "-"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-600">
                {right?.label} :
              </span>{" "}
              <span className="font-bold text-black">
                {right?.value || "-"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrintInfo;