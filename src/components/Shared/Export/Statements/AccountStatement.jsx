import dayjs from "dayjs";

import PrintLayout from "../print/PrintLayout";
import PrintHeader from "../print/PrintHeader";
import PrintInfo from "../print/PrintInfo";
import PrintSummary from "../print/PrintSummary";
import PrintTable from "../print/PrintTable";

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

  // IMPORTANT:
  // Parent can now tell this component
  // whether the statement is landscape.
  landscape = false,
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
      width: 300,
    },
    {
      title: "Transaction-Id",
      dataIndex: "transactionId",
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
  render: (value) =>
    value !== "" && value !== null && value !== undefined
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "",
},

{
  title: "Credit",
  dataIndex: "credit",
  width: 100,
  align: "right",
  render: (value) =>
    value !== "" && value !== null && value !== undefined
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "",
},

{
  title: "Balance",
  dataIndex: "balance",
  width: 120,
  align: "right",
  render: (value) =>
    value !== "" && value !== null && value !== undefined
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "",
},
  ];

  const topSummary = [
    {
      title: "Total Debit",
      value: formatAmount(overallTotals?.debit),
      className: "text-black-600",
    },
    {
      title: "Total Credit",
      value: formatAmount(overallTotals?.credit),
      className: "text-green-600",
    },
    {
      title: "Current Balance",
      value: formatAmount(currentBalance),
      className:
        Number(currentBalance) < 0
          ? "text-red-600"
          : "text-slate-700",
    },
  ];

  return (
    <PrintLayout
      /*
       * THIS WAS MISSING.
       *
       * Now PrintLayout knows whether
       * this statement is landscape.
       */
      landscape={landscape}

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
                fromDate
                  ? dayjs(fromDate).format("DD/MM/YYYY")
                  : "-"
              } → ${
                toDate
                  ? dayjs(toDate).format("DD/MM/YYYY")
                  : "-"
              }`,
            },
            {
              label: "Printed On",
              value: dayjs().format("DD/MM/YYYY hh:mm A"),
            },
          ]}
        />
      }

      summary={
        <PrintSummary
          variant="top"
          items={topSummary}
        />
      }

      table={
        <PrintTable
          columns={columns}
          data={rows}
          footerRow={{
            debit: formatAmount(
              statementTotals?.debit
            ),
            credit: formatAmount(
              statementTotals?.credit
            ),
            balance: formatAmount(
              statementBalance
            ),
          }}
        />
      }

      /*
       * You said you do NOT need anything
       * in the footer.
       */
      footer={null}
    />
  );
};

export default AccountStatement;