import React from "react";

const TransactionPrint = ({
  brand,
  branch,
  transactions,
  totals,
  currency,
  activeTab,
  fromDate,
  toDate,
}) => {
  return (
   <div className="grid grid-cols-3 gap-4 mb-8">

  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
    <p className="text-sm text-gray-500">Total Debit</p>
    <h2 className="text-2xl font-bold text-red-600">
      {Number(totals?.debit || 0).toLocaleString()}
    </h2>
  </div>

  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
    <p className="text-sm text-gray-500">Total Credit</p>
    <h2 className="text-2xl font-bold text-green-600">
      {Number(totals?.credit || 0).toLocaleString()}
    </h2>
  </div>

  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
    <p className="text-sm text-gray-500">Closing Balance</p>
    <h2 className="text-2xl font-bold text-blue-600">
      {Number((totals?.credit || 0) - (totals?.debit || 0)).toLocaleString()}
    </h2>
  </div>

</div>
  );
};

export default TransactionPrint;