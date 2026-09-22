import dayjs from "dayjs";

import PrintLayout from "../print/PrintLayout";
import PrintHeader from "../print/PrintHeader";
import PrintInfo from "../print/PrintInfo";
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
  currentBalance,
  statementTotals,
  statementBalance,
  rows,
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
      width: 140,
      render: (value) => (
        <span
          style={{
            display: "inline-block",
            minWidth: "90px",
            whiteSpace: "nowrap",
            wordBreak: "normal",
            overflowWrap: "normal",
          }}
        >
          {value}
        </span>
      ),
    },

    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          Transaction ID
        </span>
      ),
      dataIndex: "transactionId",
      width: 180,
      onHeaderCell: () => ({
        style: {
          whiteSpace: "nowrap",
        },
      }),
      render: (value) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {value || "-"}
        </span>
      ),
    },

    {
      title: (
        <span style={{ whiteSpace: "nowrap" }}>
          Transfer No
        </span>
      ),
      dataIndex: "transferNo",
      width: 150,
      align: "center",
      onHeaderCell: () => ({
        style: {
          whiteSpace: "nowrap",
        },
      }),
      render: (value) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {value || "-"}
        </span>
      ),
    },

    {
      title: "Description",
      dataIndex: "description",
      width: 220,
    },

    {
      title: "Debit",
      dataIndex: "debit",
      width: 100,
      align: "right",
      render: (value) =>
        value !== "" &&
        value !== null &&
        value !== undefined
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
        value !== "" &&
        value !== null &&
        value !== undefined
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
        value !== "" &&
        value !== null &&
        value !== undefined
          ? Number(value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "",
    },
  ];

  return (
    <PrintLayout
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
              value: dayjs().format(
                "DD/MM/YYYY hh:mm A"
              ),
            },
          ]}
        />
      }

      summary={
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "6px",
            padding: "8px 2px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Balance:
          </span>

          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color:
                Number(currentBalance) < 0
                  ? "#dc2626"
                  : "#334155",
            }}
          >
            {formatAmount(currentBalance)}
          </span>
        </div>
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

      footer={null}
    />
  );
};

export default AccountStatement;