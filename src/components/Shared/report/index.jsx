import React from "react";
import dayjs from "dayjs";
import "./index.css";
import { Sunrise, Sun, Sunset, MoonStar } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import {
  Layout,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Button,
  Tabs,
  Input,
  DatePicker,
  Select,
  Badge,
  Tooltip,
} from "antd";

const { RangePicker } = DatePicker;
import {

  UserOutlined,
  SwapOutlined,
  PrinterOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  BellOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
const API_URL = import.meta.env.VITE_API_URL;
const myBrand = JSON.parse(localStorage.getItem("branding"));
const myLogo = `${import.meta.env.VITE_ENDPOINT}${myBrand?.data?.[0]?.logo || ""}`;
import HomeLayout from "../Layouts/HomeLayout";
import { http } from "../../Modules/http";
import { fetchTransaction } from "../../../redux/slices/transactionSlice";
import { fetchUsers } from "../../../redux/slices/customerSlice";
import { fetchCurrency } from "../../../redux/slices/currencySlice";
import { fetchBranch } from "../../../redux/slices/branchSlice";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

const { Content } = Layout;

const Dashboard = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("transaction");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currency, setCurrency] = useState("");

  const { transactions } = useSelector((state) => state.transactions);
  const { users } = useSelector((state) => state.users);
  const { currencies } = useSelector((state) => state.currencies);
  const { branches } = useSelector((state) => state.branches);

  useEffect(() => {
    dispatch(fetchTransaction());
    dispatch(fetchUsers());
    dispatch(fetchCurrency());
    dispatch(fetchBranch());
  }, [dispatch]);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const profileImage = userInfo?.profile
    ? `${import.meta.env.VITE_ENDPOINT}${userInfo.profile}`
    : null;

  const myBranch = userInfo?.branch;

  // Data

  const totalCustomers = users?.length || 0;
  const totalBranches = branches?.length || 0;

  const pendingTransactions =
    transactions?.filter(
      (t) => t.transaction === "transaction" && t.isPass === "false",
    ).length || 0;

  const pendingTransfers =
    transactions?.filter(
      (t) => t.transaction === "transfer" && t.isPass === "false",
    ).length || 0;

  const pendingExchanges =
    transactions?.filter(
      (t) => t.transaction === "exchange" && t.isPass === "false",
    ).length || 0;

  // Balance calcualtion
  const balances = {};

  transactions?.forEach((t) => {
    const currency = t.currency;
    const amount = Number(t.amount) || 0;

    if (!balances[currency]) {
      balances[currency] = 0;
    }

    if (t.transactionType === "credit") {
      balances[currency] += amount;
    } else if (t.transactionType === "debit") {
      balances[currency] -= amount;
    }
  });

  const gradients = [
    "from-cyan-500 to-blue-700",
    "from-emerald-500 to-green-700",
    "from-orange-500 to-red-600",
    "from-violet-500 to-purple-700",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
    "from-yellow-500 to-amber-600",
    "from-teal-500 to-emerald-700",
    "from-fuchsia-500 to-pink-700",
    "from-lime-500 to-green-600",
    "from-sky-500 to-cyan-600",
    "from-red-500 to-orange-700",
  ];

  const balanceCards = Object.entries(balances).map(
    ([currency, amount], index) => {
      const currencyInfo = currencies.find(
        (item) => item.currency === currency,
      );

      return {
        currency,
        amount,
        country: currencyInfo?.country,
        color: gradients[index % gradients.length],
      };
    },
  );
  // Chart data

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const displayOrder = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const weeklyCounts = {
    Sat: 0,
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
  };

  transactions?.forEach((t) => {
    const day = dayNames[new Date(t.createdAt).getDay()];
    weeklyCounts[day]++;
  });

  const chartData = displayOrder.map((day) => ({
    name: day,
    count: weeklyCounts[day],
  }));

  // Recent Transactions
  const filteredTransactions = (transactions || []).filter((t) => {
    // Filter by tab
    if (t.transaction !== activeTab) return false;

    // Search
    if (search) {
      const keyword = search.toLowerCase();

      const found = Object.values(t).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword),
      );

      if (!found) return false;
    }

    // From date
    if (fromDate && dayjs(t.createdAt).isBefore(fromDate, "day")) {
      return false;
    }

    // To date
    if (toDate && dayjs(t.createdAt).isAfter(toDate, "day")) {
      return false;
    }

    return true;
  });

  const columns = [
    {
      title: "S/N",
      key: "serial",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },

    {
      title: "Date",
      dataIndex: "createdAt",
      width: 110,
      render: (v) => (v ? dayjs(v).format("DD-MM-YYYY") : "—"),
    },

    {
      title: "TRX ID",
      dataIndex: "transactionId",
      width: 140,
      render: (v) => <span className="!font-medium !text-cyan-600">{v}</span>,
    },

    {
      title: "Customer",
      dataIndex: "fullname",
      width: 220,
      render: (_, record) => (
        <div className="!flex !items-center !gap-2">
          <Avatar
            src={
              record.image
                ? `${API_URL}/uploads/transactions/${record.image.split("/").pop()}`
                : undefined
            }
            icon={<UserOutlined />}
          />
          <div>
            <div className="!font-medium">{record.fullname}</div>
            <div className="!text-xs !text-gray-500">{record.accountNo}</div>
          </div>
        </div>
      ),
    },

    {
      title: "Details",
      dataIndex: "details",
      ellipsis: true,
    },

    {
      title: "Currency",
      dataIndex: "currency",
      width: 90,
      align: "center",
      render: (v) => <Tag color="blue">{v}</Tag>,
    },

    {
      title: "Debit",
      width: 120,
      align: "right",
      render: (_, record) =>
        record.transactionType === "debit" ? (
          <span className="!font-semibold !text-red-600">
            {Number(record.amount).toLocaleString()}
          </span>
        ) : (
          "—"
        ),
    },

    {
      title: "Credit",
      width: 120,
      align: "right",
      render: (_, record) =>
        record.transactionType === "credit" ? (
          <span className="!font-semibold !text-green-600">
            {Number(record.amount).toLocaleString()}
          </span>
        ) : (
          "—"
        ),
    },

    {
      title: "Status",
      dataIndex: "isPass",
      width: 100,
      align: "center",
      render: (v) =>
        String(v) === "true" || v === true ? (
          <Tag color="success">Passed</Tag>
        ) : (
          <Tag color="red">Pending</Tag>
        ),
    },
  ];

  // Print transaction statement
  const printTransactions = () => {
  // FILTERED DATA
  // These are the transactions that will appear in the statement.
  const filteredData = (transactions || []).filter((t) => {
    // Transaction tab
    if (t.transaction !== activeTab) {
      return false;
    }

    // Search
    if (search) {
      const keyword = search.toLowerCase();

      const found = Object.values(t).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword),
      );

      if (!found) {
        return false;
      }
    }

    // From date
    if (fromDate && dayjs(t.createdAt).isBefore(fromDate, "day")) {
      return false;
    }

    // To date
    if (toDate && dayjs(t.createdAt).isAfter(toDate, "day")) {
      return false;
    }

    // Currency
    if (currency && t.currency !== currency) {
      return false;
    }

    return true;
  });

  // Stop if there is no filtered data
  if (!filteredData.length) {
    toast.error("No transactions to print.");
    return;
  }

  // Sort oldest to newest
  const sortedFilteredData = [...filteredData].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  // GROUP FILTERED TRANSACTIONS BY CURRENCY
  const currencyGroups = {};

  sortedFilteredData.forEach((t) => {
    const cur = t.currency || "N/A";

    if (!currencyGroups[cur]) {
      currencyGroups[cur] = [];
    }

    currencyGroups[cur].push(t);
  });

  // BUILD CURRENCY SECTIONS
  const currencySections = Object.entries(currencyGroups)
    .map(([currencyName, currencyTransactions]) => {
      // FILTERED TOTALS
      // These use ONLY the transactions shown in this statement.
      let filteredDebit = 0;
      let filteredCredit = 0;

      currencyTransactions.forEach((t) => {
        const amount = Number(t.amount) || 0;

        if (t.transactionType === "debit") {
          filteredDebit += amount;
        }

        if (t.transactionType === "credit") {
          filteredCredit += amount;
        }
      });

      const filteredBalance = filteredCredit - filteredDebit;

      // CURRENT TOTALS
      // These use ALL transactions for this currency.
      // Date, search, and active-tab filters do NOT affect these values.
      const allCurrencyTransactions = (transactions || []).filter(
        (t) => t.currency === currencyName,
      );

      let currentCredit = 0;
      let currentDebit = 0;

      allCurrencyTransactions.forEach((t) => {
        const amount = Number(t.amount) || 0;

        if (t.transactionType === "credit") {
          currentCredit += amount;
        }

        if (t.transactionType === "debit") {
          currentDebit += amount;
        }
      });

      const currentBalance = currentCredit - currentDebit;

      // RUNNING BALANCE
      // This is ONLY for the rows displayed in this statement.
      let runningBalance = 0;

      const rowsHTML = currencyTransactions
        .map((t, index) => {
          const amount = Number(t.amount) || 0;

          if (t.transactionType === "credit") {
            runningBalance += amount;
          }

          if (t.transactionType === "debit") {
            runningBalance -= amount;
          }

          return `
            <tr>
              <td>${index + 1}</td>

              <td>
                ${dayjs(t.createdAt).format("DD-MM-YYYY")}
              </td>

              <td>
                ${t.transactionId || "-"}
              </td>

              <td class="details-cell">
                ${t.details || "-"}
              </td>

              <td class="right debit">
                ${
                  t.transactionType === "debit"
                    ? amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
              </td>

              <td class="right credit">
                ${
                  t.transactionType === "credit"
                    ? amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
              </td>

              <td class="right balance">
                ${runningBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="currency-section">

          <div class="currency-title">

            <div>
              <span class="currency-label">
                Currency
              </span>

              <span class="currency-name">
                ${currencyName}
              </span>
            </div>

            <!-- CURRENT BALANCE FROM ALL TRANSACTIONS -->
            <div class="currency-total">

              <span>
                Current Balance
              </span>

              <strong>
                ${currentBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                ${currencyName}
              </strong>

            </div>

          </div>

          <!-- FILTERED TOTALS -->
          <div class="summary">

            <div class="summary-card debit-card">
              <div class="summary-label">
                Total Debit
              </div>

              <div class="summary-value debit-text">
                ${filteredDebit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                ${currencyName}
              </div>

              <div class="summary-note">
                Filtered statement
              </div>
            </div>

            <div class="summary-card credit-card">
              <div class="summary-label">
                Total Credit
              </div>

              <div class="summary-value credit-text">
                ${filteredCredit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                ${currencyName}
              </div>

              <div class="summary-note">
                Filtered statement
              </div>
            </div>

            <div class="summary-card balance-card">
              <div class="summary-label">
                Total Balance
              </div>

              <div class="summary-value balance-text">
                ${currentBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                ${currencyName}
              </div>

              <div class="summary-note">
                Complete currency balance
              </div>
            </div>

          </div>

          <!-- TRANSACTION TABLE -->
          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Details</th>
                <th class="right">Debit</th>
                <th class="right">Credit</th>
                <th class="right">Balance</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHTML}
            </tbody>

            <!-- FILTERED TOTALS -->
            <tfoot>
              <tr>

                <td colspan="4">
                  Filtered Statement Totals
                </td>

                <td class="right debit">
                  ${filteredDebit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

                <td class="right credit">
                  ${filteredCredit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

                <td class="right balance">
                  ${filteredBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

              </tr>
            </tfoot>

          </table>

          <!-- CURRENT ACCOUNT TOTALS -->
          <div class="current-section">

            <div class="current-section-header">
              <div>
                <div class="current-section-title">
                  Current Account Position
                </div>

                <div class="current-section-subtitle">
                  Complete transaction history for ${currencyName}
                </div>
              </div>
            </div>

            <div class="current-summary">

              <div class="current-card current-credit-card">

                <span class="current-card-label">
                  Current Credit
                </span>

                <strong>
                  ${currentCredit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  ${currencyName}
                </strong>

              </div>

              <div class="current-card current-debit-card">

                <span class="current-card-label">
                  Current Debit
                </span>

                <strong>
                  ${currentDebit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  ${currencyName}
                </strong>

              </div>

              <div class="current-card current-balance-card">

                <span class="current-card-label">
                  Current Balance
                </span>

                <strong>
                  ${currentBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  ${currencyName}
                </strong>

              </div>

            </div>

            <div class="current-note">
              Current totals are calculated from all transactions for this currency.
              Date, search, and transaction-type filters do not affect these values.
            </div>

          </div>

        </section>
      `;
    })
    .join("");

  // OPEN PRINT WINDOW
  const printWindow = window.open(
    "",
    "_blank",
    "width=1200,height=800",
  );

  if (!printWindow) {
    toast.error("Please allow pop-ups to print the statement.");
    return;
  }

  // COMPANY INFORMATION
  const companyName =
    myBrand?.data?.[0]?.companyName || "Money Services";

  const companyAddress =
    myBrand?.data?.[0]?.address || "";

  const companyMobile =
    myBrand?.data?.[0]?.mobile || "";

  const companyEmail =
    myBrand?.data?.[0]?.email || "";

  // STATEMENT PERIOD
  const statementPeriod =
    fromDate || toDate
      ? `${fromDate ? fromDate.format("DD-MM-YYYY") : "Beginning"} → ${
          toDate ? toDate.format("DD-MM-YYYY") : "Present"
        }`
      : "All Dates";

  // PRINT HTML
  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <title>
          Transaction Statement
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f8fafc;
            color: #1e293b;
            font-family: Arial, Helvetica, sans-serif;
          }

          .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: white;
          }

          .header {
            text-align: center;
            padding: 25px 30px;
            border-bottom: 2px solid #e2e8f0;
          }

          .logo img {
            width: 100px;
            height: auto;
            object-fit: contain;
          }

          .brand-name {
            margin-top: 10px;
            font-size: 24px;
            font-weight: 700;
            color: #113b8a;
          }

          .brand-info {
            margin-top: 5px;
            font-size: 12px;
            color: #64748b;
          }

          .statement-title {
            display: inline-block;
            margin-top: 16px;
            padding: 8px 22px;
            border-radius: 20px;
            background: #113b8a;
            color: white;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .info-section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin: 22px 0;
          }

          .info-card {
            padding: 13px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            background: #f8fafc;
          }

          .info-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: .5px;
          }

          .info-value {
            margin-top: 5px;
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
          }

          .currency-section {
            margin-top: 35px;
          }

          .currency-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            border-radius: 10px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
          }

          .currency-label {
            display: block;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
          }

          .currency-name {
            display: block;
            margin-top: 3px;
            font-size: 18px;
            font-weight: 700;
            color: #113b8a;
          }

          .currency-total {
            text-align: right;
          }

          .currency-total span {
            display: block;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
          }

          .currency-total strong {
            display: block;
            margin-top: 3px;
            font-size: 18px;
            color: #1d4ed8;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin: 16px 0;
          }

          .summary-card {
            padding: 14px;
            border-radius: 9px;
            border: 1px solid;
            text-align: center;
          }

          .debit-card {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .credit-card {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }

          .balance-card {
            background: #eff6ff;
            border-color: #bfdbfe;
          }

          .summary-label {
            font-size: 11px;
            color: #64748b;
          }

          .summary-value {
            margin-top: 4px;
            font-size: 18px;
            font-weight: 700;
          }

          .summary-note {
            margin-top: 4px;
            font-size: 9px;
            color: #94a3b8;
          }

          .debit-text {
            color: #dc2626;
          }

          .credit-text {
            color: #16a34a;
          }

          .balance-text {
            color: #2563eb;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            table-layout: fixed;
          }

          th {
            padding: 10px;
            background: #113b8a;
            color: white;
            border: 1px solid #113b8a;
            font-size: 11px;
            text-align: left;
          }

          td {
            padding: 9px 10px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            vertical-align: top;
          }

          th:nth-child(1),
          td:nth-child(1) {
            width: 5%;
            text-align: center;
          }

          th:nth-child(2),
          td:nth-child(2) {
            width: 11%;
            white-space: nowrap;
          }

          th:nth-child(3),
          td:nth-child(3) {
            width: 15%;
          }

          th:nth-child(4),
          td:nth-child(4) {
            width: 39%;
          }

          th:nth-child(5),
          td:nth-child(5),
          th:nth-child(6),
          td:nth-child(6),
          th:nth-child(7),
          td:nth-child(7) {
            width: 10%;
          }

          .details-cell {
            word-break: break-word;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .right {
            text-align: right;
          }

          .debit {
            color: #dc2626;
            font-weight: 600;
          }

          .credit {
            color: #16a34a;
            font-weight: 600;
          }

          .balance {
            color: #334155;
            font-weight: 700;
            text-align: right;
          }

          tfoot td {
            background: #eaf0f7;
            font-weight: 700;
            border-top: 2px solid #cbd5e1;
          }

          .current-section {
            margin-top: 20px;
            padding: 18px;
            border: 1px solid #dbe3ec;
            border-radius: 10px;
            background: #ffffff;
          }

          .current-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }

          .current-section-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: .5px;
          }

          .current-section-subtitle {
            margin-top: 3px;
            font-size: 10px;
            color: #94a3b8;
          }

          .current-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .current-card {
            padding: 14px 15px;
            border-radius: 8px;
            border: 1px solid;
          }

          .current-card-label {
            display: block;
            margin-bottom: 5px;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: .4px;
          }

          .current-card strong {
            display: block;
            font-size: 17px;
          }

          .current-credit-card {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }

          .current-credit-card strong {
            color: #15803d;
          }

          .current-debit-card {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .current-debit-card strong {
            color: #dc2626;
          }

          .current-balance-card {
            background: #eff6ff;
            border-color: #bfdbfe;
          }

          .current-balance-card strong {
            color: #1d4ed8;
          }

          .current-note {
            margin-top: 10px;
            font-size: 10px;
            color: #94a3b8;
          }

          @media print {

            body {
              padding: 0;
              background: white;
            }

            .container {
              max-width: none;
            }

            thead {
              display: table-header-group;
            }

            .currency-section {
              page-break-inside: auto;
            }

            .current-section {
              page-break-inside: avoid;
            }

          }

          @media screen and (max-width: 800px) {

            body {
              padding: 10px;
            }

            .info-section {
              grid-template-columns: 1fr 1fr;
            }

            .summary {
              grid-template-columns: 1fr;
            }

            .current-summary {
              grid-template-columns: 1fr;
            }

          }

        </style>

      </head>

      <body>

        <div class="container">

          <div class="header">

            <div class="logo">
              <img
                src="${myLogo}"
                alt="Company Logo"
              />
            </div>

            <div class="brand-name">
              ${companyName}
            </div>

            <div class="brand-info">
              ${companyAddress}
              ${companyAddress && myBranch ? " • " : ""}
              ${myBranch || ""}
            </div>

            <div class="brand-info">
              ${companyMobile}
              ${companyMobile && companyEmail ? " • " : ""}
              ${companyEmail}
            </div>

            <div class="statement-title">
              TRANSACTION STATEMENT
            </div>

          </div>

          <div class="info-section">

            <div class="info-card">
              <div class="info-label">
                Transaction Type
              </div>

              <div class="info-value">
                ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </div>
            </div>

            <div class="info-card">
              <div class="info-label">
                Currency
              </div>

              <div class="info-value">
                ${currency || "All Currencies"}
              </div>
            </div>

            <div class="info-card">
              <div class="info-label">
                Statement Period
              </div>

              <div class="info-value">
                ${statementPeriod}
              </div>
            </div>

            <div class="info-card">
              <div class="info-label">
                Filtered Records
              </div>

              <div class="info-value">
                ${sortedFilteredData.length}
              </div>
            </div>

          </div>

          ${currencySections}

        </div>

      </body>

    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 700);
};
  // greetings
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        text: "Good Morning",
        icon: <Sunrise className="!h-7 !w-7 !text-amber-400" />,
      };
    }

    if (hour >= 12 && hour < 17) {
      return {
        text: "Good Afternoon",
        icon: <Sun className="!h-7 !w-7 !text-yellow-400" />,
      };
    }

    if (hour >= 17 && hour < 21) {
      return {
        text: "Good Evening",
        icon: <Sunset className="!h-7 !w-7 !text-orange-400" />,
      };
    }

    return {
      text: "Good Night",
      icon: <MoonStar className="!h-7 !w-7 !text-indigo-400" />,
    };
  };
  const greeting = getGreeting();

  // badge for pending transactions
  const notificationCount =
    pendingTransactions + pendingTransfers + pendingExchanges;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-2xl border border-cyan-500/20 bg-[#162235]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-cyan-400" />

          <span className="text-slate-300">Transactions</span>

          <span className="ml-auto text-xl font-bold text-white">
            {payload[0].value}
          </span>
        </div>
      </div>
    );
  };

  return (
    <HomeLayout>
      <Layout className="!relative !min-h-screen !overflow-hidden !bg-gradient-to-br !from-[#07111F] !via-[#0C1628] !to-[#111827]">
        {/* Background Glow */}
        <div className="!absolute !-top-32 !-left-32 !w-[420px] !h-[420px] !rounded-full !bg-cyan-500/10 !blur-[130px]"></div>

        <div className="!absolute !bottom-0 !right-0 !w-[420px] !h-[420px] !rounded-full !bg-emerald-500/10 !blur-[130px]"></div>

        <Content className="!relative !z-10 !mx-auto !w-full !max-w-[1700px] !p-6 md:!p-8">
          {/* HEADER */}
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="!flex !items-center !gap-4">
              <div className="!flex !h-14 !w-14 !items-center !justify-center !rounded-2xl !border !border-cyan-500/20 !bg-cyan-500/10 !backdrop-blur-md">
                {greeting.icon}
              </div>

              <div>
                <p className="!text-xl !font-semibold !text-white">
                  {greeting.text}
                </p>

                <p className="!text-sm !text-slate-400">
                  Welcome back! Here's what's happening today.
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="!flex !items-center !gap-4">
              <div className="!hidden md:!flex !items-center !gap-2 !rounded-2xl !border !border-white/10 !bg-white/5 !px-4 !py-3 !backdrop-blur-md">
                <CalendarOutlined className="!text-cyan-400" />

                <span className="!text-slate-300">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <Badge
                count={notificationCount}
                overflowCount={99}
                styles={{
                  indicator: {
                    minWidth: 22,
                    height: 22,
                    lineHeight: "22px",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 0 0 2px #0f172a",
                  },
                }}
              >
                <button className="!flex !h-12 !w-12 !items-center !justify-center !rounded-2xl !border !border-red-500/20 !bg-red-500/10 !backdrop-blur-md !transition-all !duration-300 hover:!bg-red-500/20 hover:!scale-105">
                  <BellOutlined className="!text-xl !text-red-400" />
                </button>
              </Badge>

              <Tooltip title={userInfo?.fullname}>
                <span className="!inline-flex">
                  <Avatar
                    size={52}
                    src={profileImage}
                    icon={<UserOutlined />}
                    className="!cursor-pointer !bg-cyan-600"
                  />
                </span>
              </Tooltip>
            </div>
          </div>

          {/* BALANCE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {balanceCards.map((item) => (
              <div
                key={item.currency}
                className="!group !relative !overflow-hidden !rounded-3xl !border !border-white/10 !bg-white/5 !backdrop-blur-2xl !shadow-[0_10px_40px_rgba(0,0,0,0.25)] !min-h-[230px] !p-7 !transition-all !duration-500 hover:!-translate-y-2 hover:!scale-[1.02] hover:!border-cyan-400/30 hover:!shadow-[0_20px_60px_rgba(6,182,212,0.25)]"
              >
                {/* Background Glow */}
                <div className="!absolute !-top-16 !-right-16 !h-44 !w-44 !rounded-full !bg-cyan-400/10 !blur-3xl !transition-all !duration-500 group-hover:!scale-125" />

                {/* Bottom Gradient */}
                <div className="!absolute !bottom-0 !left-0 !h-1 !w-full !bg-gradient-to-r !from-cyan-400 !via-blue-500 !to-purple-500" />

                <div className="!relative !z-10 !flex !h-full !flex-col !justify-between">
                  {/* Header */}
                  <div className="!flex !items-start !justify-between">
                    <div>
                      <p className="!text-xs !font-semibold !uppercase !tracking-[0.25em] !text-slate-500">
                        Available Balance
                      </p>

                      <h3 className="!mt-3 !text-3xl !font-bold !tracking-wide !text-white">
                        {item.currency}
                      </h3>
                    </div>

                    <div className="!flex !h-16 !w-16 !items-center !justify-center !rounded-2xl !border !border-white/10 !bg-white/10 !backdrop-blur-md">
                      <ReactCountryFlag
                        countryCode={item.country?.toUpperCase()}
                        svg
                        style={{
                          width: "34px",
                          height: "34px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="!mt-8">
                    <h2 className="!text-4xl !font-extrabold !tracking-tight !text-white">
                      {Number(item.amount).toLocaleString()}
                    </h2>

                    <p className="!mt-2 !text-sm !text-slate-400">
                      Current account balance
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="!mt-8 !flex !items-center !justify-between">
                    <span className="!text-sm !text-slate-400">
                      Updated just now
                    </span>

                    <span className="!rounded-full !border !border-emerald-500/20 !bg-emerald-500/10 !px-3 !py-1 !text-xs !font-semibold !text-emerald-400">
                      ● Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FINANCIAL OVERVIEW */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">
            {/* CHART */}
            <div className="xl:col-span-2 rounded-[30px] bg-[#162235] border border-slate-700 p-7 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Transaction Activity ddd
                  </h2>

                  <p className="text-zinc-400">
                    Transactions completed over the last 7 days
                  </p>
                </div>

                <SwapOutlined className="text-cyan-400 text-2xl" />
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#1f2937"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <ChartTooltip
                    cursor={{ stroke: "#06b6d4", strokeWidth: 1 }}
                    content={<CustomTooltip />}
                  />

                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* QUICK STATS */}
            <div className="space-y-5">
              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-zinc-400">Pending Transactions</p>

                    <h2 className="text-5xl font-black text-white mt-3">
                      {pendingTransactions}
                    </h2>
                  </div>

                  <div className="bg-cyan-500/20 p-4 rounded-2xl">
                    <ClockCircleOutlined className="text-3xl text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-zinc-400">Pending Transfer</p>

                    <h2 className="text-5xl font-black text-white mt-3">
                      {pendingTransfers}
                    </h2>
                  </div>

                  <div className="bg-emerald-500/20 p-4 rounded-2xl">
                    <SyncOutlined className="text-3xl text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-zinc-400">Pending Exchange</p>

                    <h2 className="text-5xl font-black text-white mt-3">
                      {pendingExchanges}
                    </h2>
                  </div>

                  <div className="bg-orange-500/20 p-4 rounded-2xl">
                    <SwapOutlined className="text-3xl text-orange-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="!mt-8 !rounded-[30px] !bg-white !border !border-slate-200 !shadow-lg !overflow-hidden">
            {/* Header */}
            <div className="!px-8 !py-6 !border-b !border-slate-700/50">
              <h2 className="!text-3xl !font-bold !text-slate-500">
                Transaction Activity
              </h2>

              <p className="!mt-2 !text-slate-400">
                Search, filter and manage all customer transactions.
              </p>
            </div>

            {/* Search */}
            <div className="!p-8">
              <div className="!flex !flex-wrap !items-center !gap-4 !mb-8">
                <Input
                  placeholder="🔍 Search customer, account or transaction..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 320 }}
                  className="!h-12 !rounded-xl"
                />

                <DatePicker
                  placeholder="From Date"
                  onChange={setFromDate}
                  className="!h-12 !rounded-xl"
                />

                <DatePicker
                  placeholder="To Date"
                  onChange={setToDate}
                  className="!h-12 !rounded-xl"
                />

                <Select
                  placeholder="Currency"
                  allowClear
                  value={currency}
                  onChange={setCurrency}
                  style={{ width: 180 }}
                  className="!h-12 !rounded-xl"
                  options={(currencies || []).map((item) => ({
                    label: item.currency,
                    value: item.currency,
                  }))}
                />

                <Button
                  size="large"
                  className=""
                  onClick={printTransactions}
                  icon={<PrinterOutlined className="!text-xl" />}
                />
              </div>

              {/* Tabs */}

              <Tabs
                className="!mb-6"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "transaction",
                    label: `Transactions (${
                      transactions.filter(
                        (t) => t.transaction === "transaction",
                      ).length
                    })`,
                  },
                  {
                    key: "transfer",
                    label: `Transfers (${
                      transactions.filter((t) => t.transaction === "transfer")
                        .length
                    })`,
                  },
                  {
                    key: "exchange",
                    label: `Exchanges (${
                      transactions.filter((t) => t.transaction === "exchange")
                        .length
                    })`,
                  },
                ]}
              />

              {/* Table */}

              <div className="!overflow-x-auto !rounded-2xl !border !border-slate-700/60 !bg-white !shadow-inner">
                <Table
                  columns={columns}
                  dataSource={filteredTransactions}
                  rowKey="_id"
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    responsive: true,
                  }}
                  scroll={{ x: 1200 }}
                  className="custom-dark-table"
                />
              </div>
            </div>
          </div>
        </Content>
      </Layout>
    </HomeLayout>
  );
};

export default Dashboard;
