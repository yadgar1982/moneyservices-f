const PrintHeader = ({
  logo,
  company,
  branch,
  title,
}) => {
  return (
    <div className="border-b border-gray-300 pb-5 mb-5">
      <div className="flex flex-col items-center text-center">

        {logo && (
          <img
            src={logo}
            alt="Company Logo"
            className="w-30 h-auto object-contain mb-0"
          />
        )}

        <h1 className="text-3xl font-bold text-blue-900 leading-tight">
          {company?.companyName}
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          {company?.address} • {branch} Branch
        </p>

        <p className="text-sm text-gray-500">
          {company?.mobile} | {company?.email}
        </p>

        <div className="mt-4">
          <h2 className="text-xl font-bold uppercase tracking-[0.25em] text-blue-900">
            {title}
          </h2>

          <div className="w-24 h-[2px] bg-blue-900 mx-auto mt-2" />
        </div>

      </div>
    </div>
  );
};

export default PrintHeader;