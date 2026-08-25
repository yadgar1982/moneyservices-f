import dayjs from "dayjs";

import PrintLayout from "../print/PrintLayout";
import PrintHeader from "../print/PrintHeader";
import PrintFooter from "../print/PrintFooter";

const TransactionReceipt = ({
  logo,
  brand,
  branch,
  transaction,
  exchangeRate,
}) => {
  const debit = transaction?.debit;
  const credit = transaction?.credit;

  const isNormal = transaction?.transaction === "transaction";
  const isTransfer = transaction?.transaction === "transfer";
  const isExchange = transaction?.transaction === "exchange";

  const isCredit = transaction?.transactionType === "credit";

  const totalDebit = isCredit ? 0 : Number(transaction?.amount || 0);

  const totalCredit = isCredit ? Number(transaction?.amount || 0) : 0;

  const balance = totalCredit - totalDebit;

  const formatAmount = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <PrintLayout
      compact
      header={
        <PrintHeader
          logo={logo}
          company={brand}
          branch={branch}
          title={
            isExchange
              ? "EXCHANGE RECEIPT"
              : isTransfer
                ? "TRANSFER RECEIPT"
                : "TRANSACTION RECEIPT"
          }
        />
      }
      info={
        <div className="max-w-[160mm] mx-auto text-[12px]">
          {/* Receipt Information */}
          <table className="w-full mb-6">
            <tbody>
              <tr>
                <td className="text-gray-500 py-1">Transaction No</td>

                <td className="font-semibold">
                  : {transaction?.transactionNo}
                </td>

                <td className="text-gray-500">Date</td>

                <td className="font-semibold text-right">
                  {dayjs(transaction?.createdAt).format("DD MMM YYYY hh:mm A")}
                </td>
              </tr>

              <tr>
                <td className="text-gray-500 py-1">Reference ID</td>

                <td className="font-semibold">
                  : {transaction?.transactionId}
                </td>

                <td className="text-gray-500">Status</td>

                <td
                  className={`font-semibold text-right ${
                    transaction?.isPass === "true"
                      ? "!text-green-600"
                      : "!text-orange-500"
                  }`}
                >
                  {transaction?.isPass === "true" ? "Approved" : "Pending"}
                </td>
              </tr>

              {(isTransfer || isExchange) && (
                <tr>
                  <td className="text-gray-500 py-1">Exchange Rate</td>

                  <td className="font-semibold">: {exchangeRate}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Sender Account */}
          {(isTransfer || isExchange) && (
            <>
              <h3 className="font-bold text-blue-900 mb-2 uppercase">
                Sender Account Details
              </h3>

              <table className="w-full mb-6">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-1">Account Holder</td>

                    <td className="font-semibold text-right">
                      {transaction?.fullname}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">Account Number</td>

                    <td className="font-semibold text-right">
                      {transaction?.accountNo}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">
                      {isExchange ? "Exchange Amount" : "Transfer Amount"}
                    </td>

                    <td className="font-semibold text-right text-red-600">
                      {formatAmount(transaction?.amount)}{" "}
                      {transaction?.currency}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold text-blue-900 mb-2 uppercase">
                Beneficiary Account Details
              </h3>

              <table className="w-full mb-6">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-1">Account Holder</td>

                    <td className="font-semibold text-right">
                      {credit?.fullname || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">Account Number</td>

                    <td className="font-semibold text-right">
                      {credit?.accountNo || transaction?.to}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">
                      {isExchange ? "Amount Exchanged" : "Amount Received"}
                    </td>

                    <td className="font-semibold text-right text-green-600">
                      {Number(
                        credit?.amount || transaction?.finalAmount || 0,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {credit?.currency || ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Normal Customer */}
          {isNormal && (
            <>
              <h3 className="font-bold text-blue-900 mb-2 uppercase">
                Customer Details
              </h3>

              <table className="w-full mb-6">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-1">Customer Name</td>

                    <td className="font-semibold text-right">
                      {transaction?.fullname}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">Account Number</td>

                    <td className="font-semibold text-right">
                      {transaction?.accountNo}
                    </td>
                  </tr>

                  <tr>
                    <td className="text-gray-500 py-1">Currency</td>

                    <td className="font-semibold text-right">
                      {transaction?.currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Transaction Table */}

          {/* Transaction Table */}

          <h3 className="font-bold text-blue-900 mb-2 uppercase">
            Transaction Details
          </h3>

          {isTransfer || isExchange ? (
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-3">{transaction?.details}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="text-left px-3 py-2">Description</th>

                  <th className="text-right px-3 py-2">Debit</th>

                  <th className="text-right px-3 py-2">Credit</th>

                  <th className="text-right px-3 py-2">Balance</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-3">{transaction?.details}</td>

                  <td className="text-right px-3 text-red-600 font-semibold">
                    {transaction?.transactionType === "debit"
                      ? formatAmount(transaction?.amount)
                      : "-"}
                  </td>

                  <td className="text-right px-3 text-green-600 font-semibold">
                    {transaction?.transactionType === "credit"
                      ? formatAmount(transaction?.amount)
                      : "-"}
                  </td>

                  <td className="text-right px-3 font-semibold">
                    {balance.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Signature */}
          {(isTransfer || isExchange) && (
            <div className="mt-10">
              <p className="font-semibold">Account Holder Signature</p>

              <div className="mt-8 border-b border-gray-400 w-52"></div>
            </div>
          )}
        </div>
      }
      footer={
        <div className="mt-6 text-center text-xs text-gray-500">
          <p className="font-semibold text-slate-700">
            Thank you for choosing {brand?.companyName}
          </p>

          <p className="mt-1">Please keep this receipt for your records.</p>
        </div>
      }
    />
  );
};

export default TransactionReceipt;
