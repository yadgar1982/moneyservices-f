import dayjs from "dayjs";

const PrintHeader = ({
  logo,
  company,
  branch,
  title,
  currency,
  fromDate,
  toDate,
}) => {
  return (
    <div className="border-b border-gray-300 pb-6 mb-6">

      {/* Logo + Company */}
      <div className="flex flex-col items-center text-center">

        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="w-28 h-auto object-contain mb-4"
          />
        )}

        <h1 className="text-3xl font-bold text-blue-900">
          {company?.companyName}
        </h1>

        <p className="text-gray-600 mt-1">
          {company?.address} • {branch} Branch
        </p>

        <p className="text-gray-500">
          {company?.mobile} | {company?.email}
        </p>

        <div className="mt-4 inline-block rounded-full bg-blue-900 px-6 py-2 text-white font-semibold tracking-wide">
          {title}
        </div>
      </div>

      {/* Statement Information */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

        <div className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs text-gray-500 uppercase">
            Currency
          </p>

          <h3 className="font-semibold">
            {currency || "All"}
          </h3>
        </div>

        <div className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs text-gray-500 uppercase">
            Branch
          </p>

          <h3 className="font-semibold">
            {branch}
          </h3>
        </div>

        <div className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs text-gray-500 uppercase">
            Date Range
          </p>

          <h3 className="font-semibold">
            {fromDate
              ? dayjs(fromDate).format("DD/MM/YYYY")
              : "--"}{" "}
            -{" "}
            {toDate
              ? dayjs(toDate).format("DD/MM/YYYY")
              : "--"}
          </h3>
        </div>

        <div className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs text-gray-500 uppercase">
            Printed
          </p>

          <h3 className="font-semibold">
            {dayjs().format("DD/MM/YYYY hh:mm A")}
          </h3>
        </div>

      </div>

    </div>
  );
};

export default PrintHeader;