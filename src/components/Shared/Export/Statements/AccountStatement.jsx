import dayjs from "dayjs";

import PrintLayout from "../print/PrintLayout";
import PrintHeader from "../print/PrintHeader";
import PrintInfo from "../print/PrintInfo";
import PrintSummary from "../print/PrintSummary";
import PrintTable from "../print/PrintTable";
import PrintFooter from "../print/PrintFooter";

const AccountStatement = ({
  logo,
  brand,
  branch,
  account,
  accountHolder,
  currency,
  fromDate,
  toDate,
  overallTotals,
  currentBalance,
  statementTotals,
  statementBalance,
  rows,
}) => {
  const formatAmount = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

 const columns = [
  {
    title: "#",
    dataIndex: "no",
    width: 40,
    align: "center",
  },
  {
    title: "Date",
    dataIndex: "date",
    width: 90,
  },
  {
    title: "Transaction No",
    dataIndex: "transactionNo",
    width: 150,
  },
  {
    title: "Description",
    dataIndex: "description",
    width: 250,
  },
  {
    title: "Debit",
    dataIndex: "debit",
    width: 100,
    align: "right",
  },
  {
    title: "Credit",
    dataIndex: "credit",
    width: 100,
    align: "right",
  },
  {
    title: "Balance",
    dataIndex: "balance",
    width: 120,
    align: "right",
  },
];
 const topSummary = [
  {
    title: "Total Debit",
    value: formatAmount(overallTotals?.debit),
    className: "text-red-600",
  },
  {
    title: "Total Credit",
    value: formatAmount(overallTotals?.credit),
    className: "text-green-600",
  },
  {
    title: "Current Balance",
    value: formatAmount(currentBalance),
    className: currentBalance < 0
      ? "text-red-600"
      : "text-slate-700",
  },
];

const bottomSummary = [
  {
    title: "Statement Debit",
    value: formatAmount(statementTotals?.debit),
    className: "text-red-600",
  },
  {
    title: "Statement Credit",
    value: formatAmount(statementTotals?.credit),
    className: "text-green-600",
  },
  {
    title: "Statement Balance",
    value: formatAmount(statementBalance),
    className: statementBalance < 0
      ? "text-red-600"
      : "text-slate-700",
  },
];
  return (
    <PrintLayout
      header={
        <PrintHeader
          logo={logo}
          company={brand}
          branch={branch}
          title="ACCOUNT STATEMENT"
        />
      }
      info={
        <PrintInfo
          items={[
            {
              label: "Account Holder",
              value: accountHolder,
            },
            {
              label: "Account Number",
              value: account,
            },
            {
              label: "Currency",
              value: currency || "All",
            },
            {
              label: "Branch",
              value: branch,
            },
            {
              label: "Statement Period",
              value: `${
                fromDate ? dayjs(fromDate).format("DD/MM/YYYY") : "-"
              } → ${toDate ? dayjs(toDate).format("DD/MM/YYYY") : "-"}`,
            },
            {
              label: "Printed On",
              value: dayjs().format("DD/MM/YYYY hh:mm A"),
            },
          ]}
        />
      }
      summary={<PrintSummary variant="top" items={topSummary} />}
      table={
        <PrintTable
          columns={columns}
          data={rows}
          footerRow={{
            debit: formatAmount(statementTotals?.debit),
            credit: formatAmount(statementTotals?.credit),
            balance: formatAmount(statementBalance),
          }}
        />
      }
      footer={<PrintFooter />}
    />
  );
};

export default AccountStatement;
