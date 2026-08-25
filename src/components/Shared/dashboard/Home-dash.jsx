import dayjs from "dayjs";
import * as XLSX from "xlsx";
import "./home-dash.css";

import { Sunrise, Sun, Sunset, MoonStar } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import React, { useEffect, useState, useRef, useMemo } from "react";
import AccountStatement from "../../Shared/Export/Statements/AccountStatement";
import {
  Layout,
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
  Empty,
  message,
  Modal,
} from "antd";

const { RangePicker } = DatePicker;
import {
  UserOutlined,
  SwapOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  BellOutlined,
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
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

const { Content } = Layout;

const Dashboard = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("transaction");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currency, setCurrency] = useState("");
  // statement states
  const [customerStatementModalOpen, setCustomerStatementModalOpen] =
    useState(false);
  const [stAcc, setStAcc] = useState(null);
  const [customerStatementCurrency, setCustomerStatementCurrency] =
    useState(null);
  const [customerStatementFromDate, setCustomerStatementFromDate] =
    useState(null);
  const [customerStatementToDate, setCustomerStatementToDate] = useState(null);
  const [customerStatementData, setCustomerStatementData] = useState(null);
  // const [stName, setStName] = useState("");
  const [currencyBalanceModalOpen, setCurrencyBalanceModalOpen] =
    useState(false);
  const [customerIdReportModalOpen, setCustomerIdReportModalOpen] =
    useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerIdReport, setCustomerIdReport] = useState(null);

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

  // Filter transactions for the dashboard table
  const filteredTransactions = (transactions || []).filter((t) => {
    // Transaction type
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

  // Build the exact statement data used by both Print and Excel
  const getStatementData = () => {
    const filteredData = (transactions || []).filter((t) => {
      // Transaction type
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

    const sortedFilteredData = [...filteredData].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    const currencyGroups = {};

    sortedFilteredData.forEach((t) => {
      const currencyName = t.currency || "N/A";

      if (!currencyGroups[currencyName]) {
        currencyGroups[currencyName] = [];
      }

      currencyGroups[currencyName].push(t);
    });

    const statements = Object.entries(currencyGroups).map(
      ([currencyName, currencyTransactions]) => {
        // Totals from the filtered statement only
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

        // Current totals from ALL transactions for this currency.
        // Search, dates, and the filtered statement do not affect these values.
        const allCurrencyTransactions = (transactions || []).filter(
          (t) => t.currency === currencyName,
        );

        let currentDebit = 0;
        let currentCredit = 0;

        allCurrencyTransactions.forEach((t) => {
          const amount = Number(t.amount) || 0;

          if (t.transactionType === "debit") {
            currentDebit += amount;
          }

          if (t.transactionType === "credit") {
            currentCredit += amount;
          }
        });

        const currentBalance = currentCredit - currentDebit;

        // Running balance belongs only to the rows displayed in this statement.
        let runningBalance = 0;

        const rows = currencyTransactions.map((t, index) => {
          const amount = Number(t.amount) || 0;

          if (t.transactionType === "credit") {
            runningBalance += amount;
          }

          if (t.transactionType === "debit") {
            runningBalance -= amount;
          }

          return {
            index: index + 1,
            date: t.createdAt ? dayjs(t.createdAt).format("DD-MM-YYYY") : "-",
            accountNo: t.accountNo || "-",
            transactionId: t.transactionId || "-",
            transactionNo: t.transactionNo || "-",
            customer: t.fullname || "-",
            details: t.details || "-",
            currency: t.currency || currencyName,
            debit: t.transactionType === "debit" ? amount : null,
            credit: t.transactionType === "credit" ? amount : null,
            balance: runningBalance,
          };
        });

        return {
          currencyName,
          rows,
          filteredDebit,
          filteredCredit,
          filteredBalance,
          currentDebit,
          currentCredit,
          currentBalance,
        };
      },
    );

    return {
      filteredData,
      sortedFilteredData,
      statements,
    };
  };

  // Print transactions statement
  const printTransactions = () => {
    const { filteredData, statements } = getStatementData();

    if (!filteredData.length) {
      message.warning("No transactions found for the selected filters.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      message.error(
        "Please allow pop-ups in your browser to print the statement.",
      );
      return;
    }

    const companyName = myBrand?.data?.[0]?.companyName || "Money Services";

    const companyAddress = myBrand?.data?.[0]?.address || "";

    const companyMobile = myBrand?.data?.[0]?.mobile || "";

    const companyEmail = myBrand?.data?.[0]?.email || "";

    const statementPeriod =
      fromDate || toDate
        ? `${fromDate ? fromDate.format("DD-MM-YYYY") : "Beginning"} → ${
            toDate ? toDate.format("DD-MM-YYYY") : "Present"
          }`
        : "All Dates";

    const currencySections = statements
      .map((statement) => {
        const {
          currencyName,
          rows,
          filteredDebit,
          filteredCredit,
          filteredBalance,
          currentDebit,
          currentCredit,
          currentBalance,
        } = statement;

        // ==========================================
        // TRANSACTION ROWS
        // ==========================================

        const rowsHTML = rows
          .map(
            (row) => `
            <tr>

              <td>
                ${row.index}
              </td>

              <td>
                ${row.date}
              </td>

              <td>
                ${row.accountNo}
              </td>

              <td>
                ${row.transactionId}
              </td>

              <td>
                ${row.transactionNo}
              </td>

              <td class="details-cell">
                ${row.details}
              </td>

              <td class="right debit">
                ${
                  row.debit !== null
                    ? Number(row.debit).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"
                }
              </td>

              <td class="right credit">
                ${
                  row.credit !== null
                    ? Number(row.credit).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"
                }
              </td>

              <td
                class="right balance ${
                  Number(row.balance) < 0 ? "negative-balance" : ""
                }"
              >
                ${Number(row.balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>

            </tr>
          `,
          )
          .join("");

        // ==========================================
        // ONE CURRENCY SECTION
        // ==========================================

        return `
        <section class="currency-section">

          <!-- Currency Header -->
          <div class="currency-header">

            <div class="currency-heading">

              <div>
                <div class="currency-label">
                  Currency
                </div>

                <div class="currency-name">
                  ${currencyName}
                </div>
              </div>

            </div>

            <!-- Current Currency Position -->
            <div class="current-section">

              <div class="current-title">
                Current Currency Position
              </div>

              <div class="current-grid">

                <!-- Current Credit -->
                <div class="current-card credit-current">

                  <span>
                    Current Credit
                  </span>

                  <strong>
                    ${Number(currentCredit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ${currencyName}
                  </strong>

                </div>

                <!-- Current Debit -->
                <div class="current-card debit-current">

                  <span>
                    Current Debit
                  </span>

                  <strong>
                    ${Number(currentDebit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ${currencyName}
                  </strong>

                </div>

                <!-- Current Balance -->
                <div class="current-card balance-current">

                  <span>
                    Current Balance
                  </span>

                  <strong
                    class="${
                      Number(currentBalance) < 0
                        ? "negative-current-balance"
                        : ""
                    }"
                  >
                    ${Number(currentBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    ${currencyName}
                  </strong>

                </div>

              </div>

              <div class="current-note">
                Current totals are calculated from all transactions for this currency.
              </div>

            </div>

          </div>

          <!-- ======================================
               TRANSACTION TABLE
          ======================================= -->

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Acc-No</th>
                <th>Transaction ID</th>
                <th>Tran-No</th>
                <th>Details</th>
                <th class="right">Debit</th>
                <th class="right">Credit</th>
                <th class="right">Running Balance</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHTML}
            </tbody>

          </table>

          <!-- ======================================
               TOTALS
          ======================================= -->

          <div class="statement-total-row">

            <div class="statement-total-label">
              Totals
            </div>

            <div class="statement-total debit">
              ${Number(filteredDebit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div class="statement-total credit">
              ${Number(filteredCredit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div
              class="statement-total balance ${
                Number(filteredBalance) < 0 ? "negative-balance" : ""
              }"
            >
              ${Number(filteredBalance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

          </div>

        </section>
      `;
      })
      .join("");

    // ==========================================
    // PRINT HTML
    // ==========================================

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

          /* =========================
             HEADER
          ========================= */

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

          /* =========================
             INFORMATION SECTION
          ========================= */

          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr;
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
            letter-spacing: 0.5px;
          }

          .info-value {
            margin-top: 5px;
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
          }

          .date-range-card {
            min-width: 0;
          }

          .date-range-value {
            white-space: nowrap;
            font-size: 13px;
          }

          /* =========================
             CURRENCY SECTION
          ========================= */

          .currency-section {
            margin-top: 18px;
            page-break-inside: auto;
            break-inside: auto;
          }

          .currency-header {
            padding: 14px;
            border: 1px solid #dbe3ec;
            border-radius: 10px;
            background: #f1f5f9;
          }

          .currency-heading {
            display: flex;
            align-items: center;
          }

          .currency-label {
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

          /* =========================
             CURRENT CURRENCY POSITION
          ========================= */

          .current-section {
            margin-top: 14px;
            padding: 14px;
            border: 1px solid #dbe3ec;
            border-radius: 10px;
            background: #ffffff;
          }

          .current-title {
            margin-bottom: 14px;
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .current-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .current-card {
            padding: 14px 15px;
            border-radius: 8px;
            border: 1px solid;
          }

          .current-card span {
            display: block;
            margin-bottom: 5px;
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
          }

          .current-card strong {
            display: block;
            font-size: 17px;
          }

          .credit-current {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }

          .credit-current strong {
            color: #15803d;
          }

          .debit-current {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .debit-current strong {
            color: #dc2626;
          }

          .balance-current {
            background: #eff6ff;
            border-color: #bfdbfe;
          }

          .balance-current strong {
            color: #1d4ed8;
          }

          .current-note {
            margin-top: 10px;
            font-size: 10px;
            color: #94a3b8;
          }

          /* =========================
             TABLE
          ========================= */

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

          /* =========================
             COLUMN WIDTHS
          ========================= */

          th:nth-child(1),
          td:nth-child(1) {
            width: 4%;
            text-align: center;
          }

          th:nth-child(2),
          td:nth-child(2) {
            width: 9%;
            white-space: nowrap;
          }

          th:nth-child(3),
          td:nth-child(3) {
            width: 10%;
            white-space: nowrap;
          }

          th:nth-child(4),
          td:nth-child(4) {
            width: 14%;
            white-space: nowrap;
          }

          th:nth-child(5),
          td:nth-child(5) {
            width: 8%;
            white-space: nowrap;
          }

          th:nth-child(6),
          td:nth-child(6) {
            width: 19%;
            overflow-wrap: anywhere;
          }

          th:nth-child(7),
          td:nth-child(7) {
            width: 12%;
            min-width: 95px;
            white-space: nowrap;
            text-align: right;
          }

          th:nth-child(8),
          td:nth-child(8) {
            width: 12%;
            min-width: 95px;
            white-space: nowrap;
            text-align: right;
          }

          th:nth-child(9),
          td:nth-child(9) {
            width: 12%;
            min-width: 105px;
            white-space: nowrap;
            text-align: right;
          }

          .details-cell {
            word-break: break-word;
            white-space: normal;
          }

          /* =========================
             TABLE ROWS
          ========================= */

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          /* =========================
             ALIGNMENT
          ========================= */

          .right {
            text-align: right;
          }

          /* =========================
             DEBIT / CREDIT / BALANCE
          ========================= */

          .debit {
            color: #dc2626;
            font-weight: 600;
            white-space: nowrap;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .credit {
            color: #16a34a;
            font-weight: 600;
            white-space: nowrap;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .balance {
            color: #334155;
            font-weight: 700;
            white-space: nowrap;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .negative-balance {
            color: #dc2626 !important;
          }

          .negative-current-balance {
            color: #dc2626 !important;
          }

          /* =========================
             FINAL TOTALS
          ========================= */

          .statement-total-row {
            display: grid;

            grid-template-columns:
              4%
              9%
              10%
              14%
              8%
              19%
              12%
              12%
              12%;

            width: 100%;

            padding: 9px 10px;

            background: #eaf0f7;

            border-top: 2px solid #cbd5e1;

            font-size: 11px;

            font-weight: 700;

            page-break-inside: avoid;

            break-inside: avoid;
          }

          .statement-total-label {
            grid-column: 1 / 7;
            text-align: right;
            padding-right: 10px;
          }

          .statement-total {
            text-align: right;
          }

          .statement-total.debit {
            color: #dc2626;
          }

          .statement-total.credit {
            color: #16a34a;
          }

          .statement-total.balance {
            color: #334155;
          }

          /* =========================
             PRINT
          ========================= */

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

            tbody tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .current-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .statement-total-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }

          }

          /* =========================
             RESPONSIVE
          ========================= */

          @media screen and (max-width: 800px) {

            body {
              padding: 10px;
            }

            .info-section {
              grid-template-columns: 1fr 1fr;
            }

            .date-range-card {
              grid-column: 1 / -1;
            }

            .date-range-value {
              white-space: normal;
            }

            .current-grid {
              grid-template-columns: 1fr;
            }

          }

        </style>

      </head>

      <body>

        <div class="container">

          <!-- =========================
               COMPANY HEADER
          ========================= -->

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

          <!-- =========================
               STATEMENT INFORMATION
          ========================= -->

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

            <div class="info-card date-range-card">

              <div class="info-label">
                Statement Period
              </div>

              <div class="info-value date-range-value">
                ${statementPeriod}
              </div>

            </div>

          </div>

          <!-- Currency statements -->
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
  // Export the exact filtered statement to Excel
  const exportTransactionsToExcel = () => {
    const { filteredData, statements } = getStatementData();

    if (!filteredData.length) {
      message.warning("No transactions found for the selected filters.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const statementPeriod =
      fromDate || toDate
        ? `${fromDate ? fromDate.format("DD-MM-YYYY") : "Beginning"} → ${
            toDate ? toDate.format("DD-MM-YYYY") : "Present"
          }`
        : "All Dates";

    const companyName = myBrand?.data?.[0]?.companyName || "Money Services";

    statements.forEach((statement) => {
      const {
        currencyName,
        rows,
        filteredDebit,
        filteredCredit,
        filteredBalance,
        currentDebit,
        currentCredit,
        currentBalance,
      } = statement;

      const sheetData = [
        // Report title
        ["TRANSACTION STATEMENT"],

        [companyName],

        [],

        // Statement information
        ["Transaction Type", activeTab],

        ["Currency", currencyName],

        ["Statement Period", statementPeriod],

        [],

        // Current currency position
        ["CURRENT CURRENCY POSITION"],

        ["Current Credit", currentCredit],

        ["Current Debit", currentDebit],

        ["Current Balance", currentBalance],

        [],

        // Filtered statement totals
        ["FILTERED STATEMENT TOTALS"],

        ["Filtered Debit", filteredDebit],

        ["Filtered Credit", filteredCredit],

        ["Filtered Balance", filteredBalance],

        [],

        // Transaction table header
        [
          "#",
          "Date",
          "Account No",
          "Transaction ID",
          "Transaction No",
          "Customer",
          "Details",
          "Currency",
          "Debit",
          "Credit",
          "Running Balance",
        ],
      ];

      // Add filtered transaction rows only
      rows.forEach((row) => {
        sheetData.push([
          row.index,
          row.date,
          row.accountNo || "-",
          row.transactionId || "-",
          row.transactionNo || "-",
          row.customer || "-",
          row.details || "-",
          row.currency || currencyName,
          row.debit !== null && row.debit !== undefined ? row.debit : null,
          row.credit !== null && row.credit !== undefined ? row.credit : null,
          row.balance,
        ]);
      });

      // Bottom filtered totals
      sheetData.push([]);

      sheetData.push([
        "FILTERED TOTALS",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        filteredDebit,
        filteredCredit,
        filteredBalance,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths
      worksheet["!cols"] = [
        { wch: 7 }, // #
        { wch: 15 }, // Date
        { wch: 16 }, // Account No
        { wch: 21 }, // Transaction ID
        { wch: 24 }, // Customer
        { wch: 45 }, // Details
        { wch: 12 }, // Currency
        { wch: 16 }, // Debit
        { wch: 16 }, // Credit
        { wch: 18 }, // Running Balance
      ];

      // Merge report title
      worksheet["!merges"] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 9 },
        },
        {
          s: { r: 1, c: 0 },
          e: { r: 1, c: 9 },
        },
        {
          s: { r: 7, c: 0 },
          e: { r: 7, c: 9 },
        },
        {
          s: { r: 12, c: 0 },
          e: { r: 12, c: 9 },
        },
      ];

      // Freeze transaction header
      // Row 18 is the transaction header.
      worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: 18,
      };

      // Format all monetary cells
      for (let row = 0; row < sheetData.length; row++) {
        [7, 8, 9].forEach((column) => {
          const cellAddress = XLSX.utils.encode_cell({
            r: row,
            c: column,
          });

          if (worksheet[cellAddress]) {
            worksheet[cellAddress].z = "#,##0.00";
          }
        });
      }

      // Format the current currency totals
      const currentTotalRows = [8, 9, 10];

      currentTotalRows.forEach((rowIndex) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: 1,
        });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = "#,##0.00";
        }
      });

      // Format filtered totals
      const filteredTotalRows = [13, 14, 15];

      filteredTotalRows.forEach((rowIndex) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: 1,
        });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = "#,##0.00";
        }
      });

      // Make sure bottom filtered totals are numeric
      const bottomTotalsRow = sheetData.length - 1;

      [7, 8, 9].forEach((column) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: bottomTotalsRow,
          c: column,
        });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = "#,##0.00";
        }
      });

      // Safe worksheet name
      const safeSheetName =
        String(currencyName)
          .replace(/[\\/?*[\]:]/g, "")
          .substring(0, 31) || "Statement";

      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });

    const datePart = dayjs().format("YYYY-MM-DD_HH-mm");

    XLSX.writeFile(workbook, `Transaction_Statement_${datePart}.xlsx`);

    message.success("Filtered transaction statement exported to Excel.");
  };

  // Print All Accounts Statement
  const printallAccounts = () => {
    const printWindow = window.open("", "", "width=1100,height=800");

    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this website.");
      return;
    }

    // LOGO
    const logoUrl = myLogo || "";

    // GET BALANCES PER ACCOUNT
    const getBalancesByAccount = (accountNo) => {
      const balances = {};

      (transactions || []).forEach((t) => {
        if (Number(t.accountNo) !== Number(accountNo)) {
          return;
        }

        const currency = t.currency;
        const amount = Number(t.amount) || 0;

        if (!currency) return;

        if (!balances[currency]) {
          balances[currency] = 0;
        }

        if (t.transactionType === "credit") {
          balances[currency] += amount;
        }

        if (t.transactionType === "debit") {
          balances[currency] -= amount;
        }
      });

      return balances;
    };

    // FORMAT MONEY
    const formatAmount = (value) =>
      Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // GENERATE ROWS
    const rowsHTML = (users || [])
      .filter((user) => user.accountNo !== undefined && user.accountNo !== null)
      .map((user, index) => {
        const balances = getBalancesByAccount(user.accountNo);

        const balanceHTML =
          Object.entries(balances)
            .map(([currency, balance]) => {
              const amountClass =
                balance < 0 ? "balance-negative" : "balance-positive";

              return `
                <div class="balance-item">
                  <span class="currency">
                    ${currency}
                  </span>

                  <span class="${amountClass}">
                    ${formatAmount(balance)}
                  </span>
                </div>
              `;
            })
            .join("") ||
          `<span class="no-balance">
          No balance
        </span>`;

        return `
        <tr>

          <td class="number">
            ${index + 1}
          </td>

          <td>
            <div class="customer-name">
              ${user.fullname || "-"}
            </div>
          </td>

          <td>
            <span class="account-number">
              ${user.accountNo || "-"}
            </span>
          </td>

          <td>
            <div class="balances">
              ${balanceHTML}
            </div>
          </td>

        </tr>
      `;
      })
      .join("");

    // PRINT DOCUMENT
    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <title>
          All Accounts Report
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            margin: 0;
            padding: 24px;
            background: #f1f5f9;
            color: #1e293b;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .report {
            width: 100%;
            max-width: 1050px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }

          .header {
            padding: 30px 35px 25px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }

          .logo-wrapper {
            width: 78px;
            height: 78px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-wrapper img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
          }

          .company-name {
            margin: 0;
            color: #173b70;
            font-size: 24px;
            font-weight: 700;
          }

          .company-address {
            margin-top: 6px;
            color: #64748b;
            font-size: 12px;
          }

          .company-contact {
            margin-top: 4px;
            color: #94a3b8;
            font-size: 11px;
          }

          .report-title {
            margin-top: 20px;
            color: #173b70;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .title-line {
            width: 65px;
            height: 3px;
            margin: 9px auto 0;
            background: #2563eb;
            border-radius: 999px;
          }

          .meta {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
          }

          .meta-item {
            padding: 12px 20px;
            border-right: 1px solid #e2e8f0;
          }

          .meta-item:last-child {
            border-right: none;
          }

          .meta-label {
            display: block;
            margin-bottom: 3px;
            color: #94a3b8;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }

          .meta-value {
            color: #334155;
            font-size: 12px;
            font-weight: 600;
          }

          .table-section {
            padding: 25px 30px;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }

          thead {
            display: table-header-group;
          }

          thead th {
            padding: 11px 12px;
            background: #173b70;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            text-align: left;
            text-transform: uppercase;
          }

          tbody td {
            padding: 11px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #475569;
            font-size: 11px;
            vertical-align: middle;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .number {
            width: 45px;
            color: #94a3b8;
            text-align: center;
          }

          .customer-name {
            color: #1e293b;
            font-weight: 600;
          }

          .account-number {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 5px;
            background: #eff6ff;
            color: #2563eb;
            font-size: 10px;
            font-weight: 600;
          }

          .balances {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }

          .balance-item {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            background: #ffffff;
          }

          .currency {
            color: #64748b;
            font-size: 9px;
            font-weight: 700;
          }

          .balance-positive {
            color: #15803d;
            font-size: 10px;
            font-weight: 700;
          }

          .balance-negative {
            color: #dc2626;
            font-size: 10px;
            font-weight: 700;
          }

          .no-balance {
            color: #94a3b8;
            font-size: 10px;
            font-style: italic;
          }

          .footer {
            padding: 18px 30px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
          }

          .footer strong {
            color: #64748b;
          }

          @media print {

            body {
              padding: 0;
              background: #ffffff;
            }

            .report {
              max-width: none;
              border: none;
              border-radius: 0;
            }

            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .no-print {
              display: none !important;
            }

          }

        </style>

      </head>

      <body>

        <div class="report">

          <div class="header">

            ${
              logoUrl
                ? `
                  <div class="logo-wrapper">
                    <img
                      src="${logoUrl}"
                      alt="Company Logo"
                    />
                  </div>
                `
                : ""
            }

            <h1 class="company-name">
              ${myBrand?.data?.[0]?.companyName || "Company Name"}
            </h1>

            <div class="company-address">
              ${myBrand?.data?.[0]?.address || ""}
            </div>

            <div class="company-contact">
              ${myBrand?.data?.[0]?.email || ""}

              ${
                myBrand?.data?.[0]?.email && myBrand?.data?.[0]?.mobile
                  ? " • "
                  : ""
              }

              ${myBrand?.data?.[0]?.mobile || ""}
            </div>

            <div class="report-title">
              All Accounts Report
            </div>

            <div class="title-line"></div>

          </div>


          <div class="meta">

            <div class="meta-item">

              <span class="meta-label">
                Total Customers
              </span>

              <span class="meta-value">
                ${
                  (users || []).filter(
                    (user) =>
                      user.accountNo !== undefined && user.accountNo !== null,
                  ).length
                }
              </span>

            </div>


            <div class="meta-item">

              <span class="meta-label">
                Report Date
              </span>

              <span class="meta-value">
                ${new Date().toLocaleDateString()}
              </span>

            </div>


            <div class="meta-item">

              <span class="meta-label">
                Generated
              </span>

              <span class="meta-value">
                ${new Date().toLocaleTimeString()}
              </span>

            </div>

          </div>


          <div class="table-section">

            <table>

              <thead>

                <tr>
                  <th>#</th>
                  <th>Customer Name</th>
                  <th>Account Number</th>
                  <th>Account Balances</th>
                </tr>

              </thead>

              <tbody>

                ${
                  rowsHTML ||
                  `
                    <tr>
                      <td
                        colspan="4"
                        style="
                          text-align:center;
                          padding:30px;
                        "
                      >
                        No customer accounts found
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

          </div>


          <div class="footer">

            Generated on
            ${new Date().toLocaleString()}

            <br />

            Powered by

            <strong>
              ${myBrand?.data?.[0]?.companyName || "Your Company"}
            </strong>

          </div>

        </div>

      </body>

    </html>
  `);

    printWindow.document.close();

    const images = printWindow.document.images;

    if (images.length === 0) {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      return;
    }

    let loaded = 0;

    const finishPrint = () => {
      loaded++;

      if (loaded === images.length) {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    };

    Array.from(images).forEach((img) => {
      if (img.complete) {
        finishPrint();
      } else {
        img.onload = finishPrint;
        img.onerror = finishPrint;
      }
    });
  };
  //  Export All Accounts to Excel
  const exportAllAccountsToExcel = () => {
    const getBalancesByAccount = (accountNo) => {
      const balances = {};

      (transactions || []).forEach((t) => {
        if (Number(t.accountNo) !== Number(accountNo)) {
          return;
        }

        const currency = t.currency;
        const amount = Number(t.amount) || 0;

        if (!currency) return;

        if (!balances[currency]) {
          balances[currency] = 0;
        }

        if (t.transactionType === "credit") {
          balances[currency] += amount;
        } else if (t.transactionType === "debit") {
          balances[currency] -= amount;
        }
      });

      return balances;
    };

    const currenciesList = [
      ...new Set((transactions || []).map((t) => t.currency).filter(Boolean)),
    ].sort();

    const excelData = (users || [])
      .filter((user) => user.accountNo !== undefined && user.accountNo !== null)
      .map((user, index) => {
        const balances = getBalancesByAccount(user.accountNo);

        const row = {
          "#": index + 1,
          "Customer Name": user.fullname || "",
          "Account Number": user.accountNo || "",
          Email: user.email || "",
          Mobile: user.mobile || "",
          Country: user.country || "",
          Address: user.address || "",
        };

        currenciesList.forEach((currency) => {
          row[currency] = Number(balances[currency] || 0);
        });

        return row;
      });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },

      ...currenciesList.map(() => ({
        wch: 16,
      })),
    ];

    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      for (let row = 1; row <= range.e.r; row++) {
        for (let col = 7; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: row,
            c: col,
          });

          const cell = worksheet[cellAddress];

          if (cell && typeof cell.v === "number") {
            cell.z = "#,##0.00";
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "All Accounts");

    const date = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(workbook, `All_Accounts_${date}.xlsx`);
  };

  // Print Customer Statement
  const statementAccountOptions = useMemo(() => {
    return [
      ...new Set(
        (transactions || [])
          .map((t) => String(t.accountNo || "").trim())
          .filter(Boolean),
      ),
    ].map((accountNo) => {
      const customer = (users || []).find(
        (user) => String(user.accountNo) === String(accountNo),
      );

      return {
        value: accountNo,
        label: `${accountNo} - ${customer?.fullname || ""}`,
      };
    });
  }, [transactions, users]);

  const statementCurrencyOptions = useMemo(() => {
    if (!stAcc) return [];

    return [
      ...new Set(
        (transactions || [])
          .filter((t) => String(t.accountNo || "") === String(stAcc))
          .map((t) => String(t.currency || "").trim())
          .filter(Boolean),
      ),
    ];
  }, [transactions, stAcc]);

  const generateCustomerStatement = () => {
    if (!stAcc) {
      message.warning("Please select an account.");
      return;
    }

    if (!customerStatementCurrency) {
      message.warning("Please select a currency.");
      return;
    }

    if (
      customerStatementFromDate &&
      customerStatementToDate &&
      customerStatementFromDate.isAfter(customerStatementToDate, "day")
    ) {
      message.warning("From Date cannot be after To Date.");
      return;
    }

    // ALL transactions for this account + selected currency
    const accountTransactions = (transactions || [])
      .filter((t) => String(t.accountNo || "") === String(stAcc))
      .filter(
        (t) =>
          !customerStatementCurrency ||
          String(t.currency || "").toUpperCase() ===
            String(customerStatementCurrency).toUpperCase(),
      );

    // CURRENT ACCOUNT TOTALS
    // No date filter is applied here.
    let currentDebit = 0;
    let currentCredit = 0;

    accountTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      if (t.transactionType === "debit") {
        currentDebit += amount;
      }

      if (t.transactionType === "credit") {
        currentCredit += amount;
      }
    });

    const currentBalance = currentCredit - currentDebit;

    // TRANSACTIONS FOR THE SELECTED STATEMENT PERIOD
    const filteredTransactions = accountTransactions
      .filter(
        (t) =>
          !customerStatementFromDate ||
          !dayjs(t.createdAt).isBefore(customerStatementFromDate, "day"),
      )
      .filter(
        (t) =>
          !customerStatementToDate ||
          !dayjs(t.createdAt).isAfter(customerStatementToDate, "day"),
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (!filteredTransactions.length) {
      message.warning("No transactions found for the selected filters.");
      return;
    }

    // STATEMENT ROWS
    const statementRows = [];
    let runningBalance = 0;

    filteredTransactions.forEach((t, index) => {
      const amount = Number(t.amount) || 0;

      if (t.transactionType === "credit") {
        runningBalance += amount;
      }

      if (t.transactionType === "debit") {
        runningBalance -= amount;
      }

      statementRows.push({
        no: index + 1,

        date: t.createdAt ? dayjs(t.createdAt).format("DD-MM-YYYY") : "-",

        accountNo: t.accountNo || "-",

        transactionId: t.transactionId || "-",

        transactionNo: t.transactionNo || t.transactionNoId || t.transNo || "-",

        description: t.details || "-",

        transactionType: t.transactionType || "-",

        debit: t.transactionType === "debit" ? amount : "",

        credit: t.transactionType === "credit" ? amount : "",

        balance: runningBalance,

        currency: t.currency || "-",

        fullname: t.fullname || "-",
      });
    });

    // SELECTED STATEMENT PERIOD TOTALS
    const statementDebit = filteredTransactions
      .filter((t) => t.transactionType === "debit")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const statementCredit = filteredTransactions
      .filter((t) => t.transactionType === "credit")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const statementBalance = statementCredit - statementDebit;

    // FIND CUSTOMER
    const selectedCustomer = (users || []).find(
      (user) => String(user.accountNo) === String(stAcc),
    );

    const accountHolder =
      selectedCustomer?.fullname || filteredTransactions[0]?.fullname || "-";

    // PREPARE STATEMENT
    const preparedCustomerStatement = {
      account: stAcc,

      accountHolder,

      branch: myBranch,

      currency: customerStatementCurrency,

      fromDate: customerStatementFromDate || null,

      toDate: customerStatementToDate || null,

      rows: statementRows,

      // CURRENT ACCOUNT TOTALS
      // These are NOT affected by date range.
      overallTotals: {
        debit: currentDebit,
        credit: currentCredit,
      },

      currentDebit,

      currentCredit,

      currentBalance,

      // SELECTED DATE-RANGE TOTALS
      statementTotals: {
        debit: statementDebit,
        credit: statementCredit,
      },

      statementDebit,

      statementCredit,

      statementBalance,
    };

    setCustomerStatementModalOpen(false);

    setCustomerStatementData(preparedCustomerStatement);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  // export customer statement to excel
  const exportCustomerStatementToExcel = () => {
    if (!stAcc) {
      message.warning("Please select an account.");
      return;
    }

    if (!customerStatementCurrency) {
      message.warning("Please select a currency.");
      return;
    }

    if (
      customerStatementFromDate &&
      customerStatementToDate &&
      customerStatementFromDate.isAfter(customerStatementToDate, "day")
    ) {
      message.warning("From Date cannot be after To Date.");
      return;
    }

    // ALL transactions for this account + currency
    const accountTransactions = (transactions || [])
      .filter((t) => String(t.accountNo || "") === String(stAcc))
      .filter(
        (t) =>
          String(t.currency || "").toUpperCase() ===
          String(customerStatementCurrency).toUpperCase(),
      );

    if (!accountTransactions.length) {
      message.warning("No transactions found for this account and currency.");
      return;
    }

    // CURRENT ACCOUNT TOTALS
    let currentDebit = 0;
    let currentCredit = 0;

    accountTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      if (t.transactionType === "debit") {
        currentDebit += amount;
      }

      if (t.transactionType === "credit") {
        currentCredit += amount;
      }
    });

    const currentBalance = currentCredit - currentDebit;

    // TRANSACTIONS FOR SELECTED DATE RANGE
    const filteredTransactions = accountTransactions
      .filter(
        (t) =>
          !customerStatementFromDate ||
          !dayjs(t.createdAt).isBefore(customerStatementFromDate, "day"),
      )
      .filter(
        (t) =>
          !customerStatementToDate ||
          !dayjs(t.createdAt).isAfter(customerStatementToDate, "day"),
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (!filteredTransactions.length) {
      message.warning("No transactions found for the selected date range.");
      return;
    }

    // STATEMENT ROWS
    const statementRows = [];
    let runningBalance = 0;

    filteredTransactions.forEach((t, index) => {
      const amount = Number(t.amount) || 0;

      if (t.transactionType === "credit") {
        runningBalance += amount;
      }

      if (t.transactionType === "debit") {
        runningBalance -= amount;
      }

      statementRows.push([
        index + 1,
        t.createdAt ? dayjs(t.createdAt).format("DD-MM-YYYY") : "-",
        t.accountNo || "-",
        t.transactionId || "-",
        t.transactionNo || t.transactionNoId || t.transNo || "-",
        t.details || "-",
        t.transactionType || "-",
        t.transactionType === "debit" ? amount : "",
        t.transactionType === "credit" ? amount : "",
        runningBalance,
      ]);
    });

    // STATEMENT PERIOD TOTALS
    const statementDebit = filteredTransactions
      .filter((t) => t.transactionType === "debit")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const statementCredit = filteredTransactions
      .filter((t) => t.transactionType === "credit")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const statementBalance = statementCredit - statementDebit;

    // ACCOUNT HOLDER
    const selectedCustomer = (users || []).find(
      (user) => String(user.accountNo) === String(stAcc),
    );

    const accountHolder =
      selectedCustomer?.fullname || filteredTransactions[0]?.fullname || "-";

    // EXCEL DATA
    const excelRows = [
      ["CUSTOMER ACCOUNT STATEMENT"],
      [],

      ["ACCOUNT INFORMATION"],
      ["Account No", stAcc],
      ["Account Holder", accountHolder],
      ["Branch", myBranch || "-"],
      ["Currency", customerStatementCurrency],
      [
        "From Date",
        customerStatementFromDate
          ? dayjs(customerStatementFromDate).format("DD-MM-YYYY")
          : "All",
      ],
      [
        "To Date",
        customerStatementToDate
          ? dayjs(customerStatementToDate).format("DD-MM-YYYY")
          : "All",
      ],

      [],

      ["CURRENT ACCOUNT TOTALS"],
      ["Current Debit", currentDebit],
      ["Current Credit", currentCredit],
      ["Current Balance", currentBalance],

      [],

      ["STATEMENT TOTALS"],
      ["Statement Debit", statementDebit],
      ["Statement Credit", statementCredit],
      ["Statement Balance", statementBalance],

      [],

      [
        "No",
        "Date",
        "Account No",
        "Transaction ID",
        "Transaction No",
        "Description",
        "Type",
        "Debit",
        "Credit",
        "Balance",
      ],

      ...statementRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 },
      { wch: 35 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];

    // MERGES
    worksheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 9 },
      },
      {
        s: { r: 2, c: 0 },
        e: { r: 2, c: 9 },
      },
      {
        s: { r: 10, c: 0 },
        e: { r: 10, c: 9 },
      },
      {
        s: { r: 15, c: 0 },
        e: { r: 15, c: 9 },
      },
    ];

    // BOLD LABELS
    [1, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21].forEach(
      (rowNumber) => {
        const cell = worksheet[`A${rowNumber}`];

        if (cell) {
          cell.s = {
            font: {
              bold: true,
            },
            alignment: {
              horizontal: "left",
              vertical: "center",
            },
          };
        }
      },
    );

    // LEFT ALIGN ACCOUNT VALUES
    [4, 5, 6, 7, 8, 9].forEach((rowNumber) => {
      const cell = worksheet[`B${rowNumber}`];

      if (cell) {
        cell.s = {
          alignment: {
            horizontal: "left",
            vertical: "center",
          },
        };
      }
    });

    // TRANSACTION HEADER
    const transactionHeaderRow = 21;

    for (let col = 0; col < 10; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: transactionHeaderRow - 1,
        c: col,
      });

      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: {
            bold: true,
          },
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        };
      }
    }

    // LEFT ALIGN TRANSACTION TEXT
    for (let row = transactionHeaderRow; row <= excelRows.length; row++) {
      [0, 1, 2, 3, 4, 5, 6].forEach((col) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: row - 1,
          c: col,
        });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            alignment: {
              horizontal: "left",
              vertical: "center",
            },
          };
        }
      });
    }

    // NUMBER FORMATTING
    for (let row = transactionHeaderRow; row <= excelRows.length; row++) {
      [7, 8, 9].forEach((col) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: row - 1,
          c: col,
        });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = "#,##0.00";
        }
      });
    }

    // SUMMARY NUMBER FORMATTING
    [12, 13, 14, 17, 18, 19].forEach((rowNumber) => {
      const cell = worksheet[`B${rowNumber}`];

      if (cell) {
        cell.z = "#,##0.00";
      }
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Statement");

    const account = String(stAcc || "account").replace(/[^\w-]/g, "_");

    const currency = String(customerStatementCurrency || "currency").replace(
      /[^\w-]/g,
      "_",
    );

    XLSX.writeFile(workbook, `Customer-Statement-${account}-${currency}.xlsx`);
  };
  // clearning form after statement
  const resetStatementForm = () => {
    setStAcc(null);
    setCustomerStatementCurrency(null);
    setCustomerStatementFromDate(null);
    setCustomerStatementToDate(null);
    setCustomerStatementData(null);
  };

  // Currency Statement
  const currencyBalanceData = useMemo(() => {
    const balances = {};

    (transactions || []).forEach((t) => {
      const currency = String(t.currency || "")
        .trim()
        .toUpperCase();

      if (!currency) return;

      if (!balances[currency]) {
        balances[currency] = {
          currency,
          debit: 0,
          credit: 0,
          balance: 0,
        };
      }

      const amount = Number(t.amount) || 0;

      if (t.transactionType === "debit") {
        balances[currency].debit += amount;
      }

      if (t.transactionType === "credit") {
        balances[currency].credit += amount;
      }

      balances[currency].balance =
        balances[currency].credit - balances[currency].debit;
    });

    return Object.values(balances);
  }, [transactions]);

  const printCurrencyBalance = () => {
    if (!currencyBalanceData?.length) {
      message.warning("No currency balance data available.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      message.error("Please allow pop-ups to print the currency balance.");
      return;
    }

    const rows = currencyBalanceData
      .map(
        (item) => `
        <tr>
          <td>${item.currency}</td>
          <td class="number">${Number(item.debit || 0).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}</td>
          <td class="number">${Number(item.credit || 0).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}</td>
          <td class="number balance">${Number(item.balance || 0).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}</td>
        </tr>
      `,
      )
      .join("");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Currency Balance Report</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 40px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            background: white;
          }

          .report {
            max-width: 900px;
            margin: 0 auto;
          }

          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 18px;
            margin-bottom: 25px;
          }

          .title {
            font-size: 25px;
            font-weight: 700;
            margin: 0;
          }

          .subtitle {
            margin-top: 6px;
            color: #64748b;
            font-size: 13px;
          }

          .date {
            margin-top: 10px;
            color: #64748b;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
          }

          td {
            border: 1px solid #cbd5e1;
            padding: 11px 12px;
            font-size: 13px;
          }

          .number {
            text-align: right;
          }

          .balance {
            font-weight: 700;
          }

          .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            color: #64748b;
            font-size: 11px;
            text-align: center;
          }

          @media print {
            body {
              padding: 20px;
            }

            @page {
              size: portrait;
              margin: 15mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="report">

          <div class="header">
            <h1 class="title">
              Currency Balance Report
            </h1>

            <div class="subtitle">
              Current debit, credit, and balance by currency
            </div>

            <div class="date">
              Printed: ${dayjs().format("DD-MM-YYYY hh:mm A")}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Currency</th>
                <th>Total Debit</th>
                <th>Total Credit</th>
                <th>Current Balance</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            Currency Balance Report
          </div>

        </div>
      </body>
    </html>
  `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  // CUSTOMER ID REPORT
  const getCustomerIdAccountBalances = () => {
    if (!selectedCustomerId) {
      return [];
    }

    // 1. Find all accounts belonging to this Customer ID
    const customerAccounts = (users || []).filter(
      (user) =>
        user.role === "customer" &&
        String(user.customerId || "").trim() ===
          String(selectedCustomerId).trim(),
    );

    if (!customerAccounts.length) {
      message.warning("No accounts found for this Customer ID.");
      return [];
    }

    // 2. Calculate balances for each account
    return customerAccounts.map((customer) => {
      const accountNo = String(customer.accountNo || "").trim();

      // Transactions belonging to this account
      const accountTransactions = (transactions || []).filter(
        (transaction) =>
          String(transaction.accountNo || "").trim() === accountNo,
      );

      const currencyBalances = {};

      // 3. Calculate each currency separately
      accountTransactions.forEach((transaction) => {
        const currency = String(transaction.currency || "")
          .trim()
          .toUpperCase();

        if (!currency) return;

        const amount = Number(transaction.amount) || 0;

        if (!currencyBalances[currency]) {
          currencyBalances[currency] = {
            debit: 0,
            credit: 0,
            balance: 0,
          };
        }

        if (transaction.transactionType === "credit") {
          currencyBalances[currency].credit += amount;
          currencyBalances[currency].balance += amount;
        }

        if (transaction.transactionType === "debit") {
          currencyBalances[currency].debit += amount;
          currencyBalances[currency].balance -= amount;
        }
      });

      return {
        accountNo,
        fullname: customer.fullname || "-",
        profile: customer.profile || null,
        currencyBalances,
      };
    });
  };

  // PREPARE CUSTOMER ID REPORT
  const prepareCustomerIdReport = () => {
    const accounts = getCustomerIdAccountBalances();

    if (!accounts.length) {
      return null;
    }

    // ==========================================
    // TOTAL ALL CURRENCIES ACROSS ALL ACCOUNTS
    // ==========================================
    const totalCurrencyBalances = {};

    accounts.forEach((account) => {
      Object.entries(account.currencyBalances || {}).forEach(
        ([currency, data]) => {
          // Create the currency only when it actually exists
          if (!totalCurrencyBalances[currency]) {
            totalCurrencyBalances[currency] = {
              debit: 0,
              credit: 0,
              balance: 0,
            };
          }

          totalCurrencyBalances[currency].debit += Number(data.debit) || 0;

          totalCurrencyBalances[currency].credit += Number(data.credit) || 0;

          totalCurrencyBalances[currency].balance += Number(data.balance) || 0;
        },
      );
    });

    return {
      customerId: selectedCustomerId,
      customerName: accounts[0]?.fullname || "-",
      accounts,
      totalCurrencyBalances,
    };
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

          {/* REPORTS */}

          <div className="!mt-8">
            <div className="!mb-5">
              <h2 className="!text-2xl !font-bold !text-white">Reports</h2>

              <p className="!mt-1 !text-sm !text-slate-400">
                Generate and print financial reports
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* ALL ACCOUNTS */}

              <div className="!rounded-[30px] !border !border-white/10 !bg-[#162235] !p-6 !shadow-xl">
                <div className="!flex !items-start !gap-4">
                  <div className="!flex !h-14 !w-14 !shrink-0 !items-center !justify-center !rounded-2xl !bg-cyan-500/10 !border !border-cyan-500/20">
                    <BankOutlined className="!text-2xl !text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="!text-xl !font-bold !text-white">
                      All Accounts Statement
                    </h3>

                    <p className="!mt-1 !text-sm !leading-6 !text-slate-400">
                      View balances for all customer accounts by currency.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 !mt-6">
                  <Button
                    type="primary"
                    size="large"
                    icon={<PrinterOutlined />}
                    className="!h-12 !rounded-xl"
                    onClick={printallAccounts}
                  >
                    Print
                  </Button>

                  <Button
                    size="large"
                    icon={<FileExcelOutlined />}
                    className="!h-12 !rounded-xl"
                    onClick={exportAllAccountsToExcel}
                  >
                    Excel
                  </Button>
                </div>
              </div>

              {/* ==================================================
                    CUSTOMER ID REPORT
                ================================================== */}

              <div className="!rounded-[30px] !border !border-white/10 !bg-[#162235] !p-6 !shadow-xl">
                <div className="!flex !items-start !gap-4">
                  <div className="!flex !h-14 !w-14 !shrink-0 !items-center !justify-center !rounded-2xl !border !border-violet-500/20 !bg-violet-500/10">
                    <UserOutlined className="!text-2xl !text-violet-400" />
                  </div>

                  <div>
                    <h3 className="!text-xl !font-bold !text-white">
                      Customer ID Report
                    </h3>

                    <p className="!mt-1 !text-sm !leading-6 !text-slate-400">
                      View all accounts and currency balances for a customer.
                    </p>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<UserOutlined />}
                  onClick={() => setCustomerIdReportModalOpen(true)}
                  className="!mt-4 !h-12 !rounded-xl !border-0 !bg-violet-600 !font-medium hover:!bg-violet-700"
                >
                  Customer ID Report
                </Button>
              </div>
              {/* CUSTOMER STATEMENT */}
              {/* Customer Account Statement */}
              <div className="!rounded-[30px] !border !border-white/10 !bg-[#162235] !p-6 !shadow-xl">
                <div className="!flex !items-start !gap-4">
                  <div className="!flex !h-14 !w-14 !shrink-0 !items-center !justify-center !rounded-2xl !border !border-emerald-500/20 !bg-emerald-500/10">
                    <FileTextOutlined className="!text-2xl !text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="!text-xl !font-bold !text-white">
                      Customer Account Statement
                    </h3>

                    <p className="!mt-1 !text-sm !leading-6 !text-slate-400">
                      Select a customer and generate a transaction statement.
                    </p>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => setCustomerStatementModalOpen(true)}
                  className="!mt-4 !h-12 !rounded-xl !border-0 !bg-blue-600 !font-medium hover:!bg-blue-700"
                >
                  Generate Statement
                </Button>
              </div>

              {/* Currency Balance Report */}
              <div className="!rounded-[30px] !border !border-white/10 !bg-[#162235] !p-6 !shadow-xl">
                <div className="!flex !items-start !gap-4">
                  <div className="!flex !h-14 !w-14 !shrink-0 !items-center !justify-center !rounded-2xl !border !border-cyan-500/20 !bg-cyan-500/10">
                    <BankOutlined className="!text-2xl !text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="!text-xl !font-bold !text-white">
                      Currency Balance Report
                    </h3>

                    <p className="!mt-1 !text-sm !leading-6 !text-slate-400">
                      View and print current balances by currency.
                    </p>
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<PrinterOutlined />}
                  onClick={() => setCurrencyBalanceModalOpen(true)}
                  className="!mt-4 !h-12 !rounded-xl !border-0 !bg-cyan-600 !font-medium hover:!bg-cyan-700"
                >
                  Print Currency Balance
                </Button>
              </div>
            </div>
          </div>

          {/* FINANCIAL OVERVIEW */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">
            {/* CHART */}
            <div className="xl:col-span-2 rounded-[30px] bg-[#162235] border border-slate-700 p-7 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Transaction Activity
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
                  type="primary"
                  size="large"
                  onClick={() => {
                    printTransactions();
                    resetStatementForm();
                  }}
                  icon={<PrinterOutlined className="!text-xl" />}
                >
                  Print Statement
                </Button>

                <Button
                  size="large"
                  onClick={() => {
                    exportTransactionsToExcel();
                    resetStatementForm();
                  }}
                  icon={
                    <FileExcelOutlined className="!text-xl !text-green-600" />
                  }
                  className="!border-green-500 !text-green-600 hover:!border-green-600 hover:!text-green-700"
                >
                  Export to Excel
                </Button>
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

              <div className="mb-10 !overflow-x-auto !rounded-2xl !border !border-slate-700/60 !bg-white !shadow-inner">
                <Table
                  columns={columns}
                  dataSource={filteredTransactions}
                  rowKey="_id"
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div className="py-2">
                            <h3 className="text-lg font-semibold text-rose-700">
                              {search
                                ? "No Results Found"
                                : "No Data Available"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {search
                                ? `No customer, account, or transaction matches "${search}".`
                                : "There are no records to display."}
                            </p>
                          </div>
                        }
                      />
                    ),
                  }}
                  pagination={{
                    pageSize: 8,
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

      {/* Acc Staetment modal */}
      <Modal
        open={customerStatementModalOpen}
        onCancel={() => {
          setCustomerStatementModalOpen(false);
          resetStatementForm();
        }}
        footer={null}
        centered
        width={560}
        destroyOnHidden={false}
        closeIcon={
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            ×
          </span>
        }
        styles={{
          content: {
            padding: 0,
            overflow: "hidden",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
          },
          body: { padding: 0 },
        }}
      >
        <div className="bg-white">
          {/* HEADER */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <FileTextOutlined className="text-lg text-white" />
              </div>

              <div>
                <h2 className="m-0 text-lg font-semibold text-slate-800">
                  Account Statement
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Generate, print, or export a customer transaction statement
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="px-6 py-5">
            {/* ACCOUNT */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account
              </label>

              <Select
                showSearch
                allowClear
                size="large"
                options={statementAccountOptions}
                placeholder="Select account"
                value={stAcc || undefined}
                onChange={(value, option) => {
                  setStAcc(value || null);
                  setStName(option?.fullname || "");
                  setCustomerStatementCurrency(null);
                }}
                optionFilterProp="label"
                className="statement-select w-full"
              />
            </div>

            {/* CURRENCY */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>

              <Select
                allowClear
                size="large"
                placeholder={stAcc ? "Select currency" : "Select account first"}
                disabled={!stAcc}
                value={customerStatementCurrency || undefined}
                onChange={(value) =>
                  setCustomerStatementCurrency(value || null)
                }
                className="w-full"
              >
                {statementCurrencyOptions.map((cur) => (
                  <Select.Option key={cur} value={cur}>
                    {cur}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* DATE RANGE */}
            <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarOutlined className="text-blue-600" />

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Date Range
                </span>

                <span className="text-[11px] text-slate-400">Optional</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* FROM */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    From Date
                  </label>

                  <DatePicker
                    size="large"
                    format="DD-MM-YYYY"
                    placeholder="Start date"
                    value={customerStatementFromDate}
                    onChange={(date) => setCustomerStatementFromDate(date)}
                    className="!w-full"
                  />
                </div>

                {/* TO */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    To Date
                  </label>

                  <DatePicker
                    size="large"
                    format="DD-MM-YYYY"
                    placeholder="End date"
                    value={customerStatementToDate}
                    onChange={(date) => setCustomerStatementToDate(date)}
                    className="!w-full"
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* PRINT */}
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                size="large"
                onClick={generateCustomerStatement}
                className="!h-11 !rounded-lg !border-0 !bg-blue-600 !font-medium !shadow-sm hover:!bg-blue-700"
              >
                Print Statement
              </Button>

              {/* EXCEL */}
              <Button
                type="default"
                icon={<FileTextOutlined />}
                size="large"
                onClick={exportCustomerStatementToExcel}
                className="!h-11 !rounded-lg !border-emerald-300 !font-medium !text-emerald-700 hover:!border-emerald-500 hover:!bg-emerald-50 hover:!text-emerald-800"
              >
                Export to Excel
              </Button>
            </div>

            {/* FOOTER */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <span className="text-[11px] text-slate-400">
                Select an account, currency, and optional date range
              </span>
            </div>
          </div>
        </div>
      </Modal>
      {/* Currency Modal */}
      <Modal
        open={currencyBalanceModalOpen}
        onCancel={() => setCurrencyBalanceModalOpen(false)}
        footer={null}
        centered
        width={700}
        closeIcon={
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            ×
          </span>
        }
        styles={{
          content: {
            padding: 0,
            overflow: "hidden",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
          },
          body: { padding: 0 },
        }}
      >
        <div className="bg-white">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600 shadow-sm">
                <BankOutlined className="text-lg text-white" />
              </div>

              <div>
                <h2 className="m-0 text-lg font-semibold text-slate-800">
                  Currency Balance
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current debit, credit, and balance by currency
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Currency
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Total Debit
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Total Credit
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Current Balance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currencyBalanceData.length > 0 ? (
                    currencyBalanceData.map((item) => (
                      <tr
                        key={item.currency}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {item.currency}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-red-600">
                          {item.debit.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-emerald-600">
                          {item.credit.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                          {item.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-slate-400"
                      >
                        No currency transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="primary"
                size="large"
                icon={<PrinterOutlined />}
                onClick={printCurrencyBalance}
                className="!h-11 !rounded-lg !border-0 !bg-blue-600 !font-medium hover:!bg-blue-700"
              >
                Print Currency Balance
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Customer Id modal */}
      <Modal
        open={customerIdReportModalOpen}
        onCancel={() => {
          setCustomerIdReportModalOpen(false);
          setSelectedCustomerId(null);
        }}
        footer={null}
        centered
        width={500}
        title="Customer ID Report"
      >
        <div className="py-3">
          <p className="mb-4 text-sm text-slate-500">
            Select a Customer ID to view all accounts and currency balances.
          </p>

          <Select
            showSearch
            allowClear
            size="large"
            className="w-full"
            placeholder="Select Customer ID"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            options={[
              ...new Set(
                (users || [])
                  .filter((user) => user.role === "customer" && user.customerId)
                  .map((user) => String(user.customerId)),
              ),
            ].map((customerId) => ({
              value: customerId,
              label: customerId,
            }))}
          />

          <Button
            type="primary"
            block
            size="large"
            icon={<PrinterOutlined />}
            className="mt-6 h-12"
            disabled={!selectedCustomerId}
            onClick={() => {
              const report = prepareCustomerIdReport();

              if (!report) {
                return;
              }

              console.log("CUSTOMER ID REPORT:", report);

              setCustomerIdReport(report);
            }}
          >
            Generate Customer ID Report
          </Button>

          {customerIdReport && (
  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {/* =====================================================
        CUSTOMER HEADER
    ===================================================== */}
    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-4">
        <Avatar
          size={58}
          src={
            customerIdReport?.accounts?.[0]?.profile
              ? `${import.meta.env.VITE_ENDPOINT}${customerIdReport.accounts[0].profile}`
              : undefined
          }
          icon={<UserOutlined />}
          className="shrink-0 !bg-blue-600"
        />

        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Customer
          </div>

          <div className="text-base font-bold text-slate-800">
            {customerIdReport?.customerName || "-"}
          </div>

          <div className="mt-0.5 text-xs font-semibold text-blue-600">
            ID: {customerIdReport?.customerId || "-"}
          </div>
        </div>
      </div>
    </div>

    {/* =====================================================
        ACCOUNTS
    ===================================================== */}
    <div className="space-y-3 p-4">
      {customerIdReport.accounts.map((account) => (
        <div
          key={account.accountNo}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          {/* ACCOUNT HEADER */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Account Number
              </div>

              <div className="text-sm font-bold text-slate-700">
                {account.accountNo}
              </div>
            </div>

            <div className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
              ACCOUNT
            </div>
          </div>

          {/* ACCOUNT BALANCES */}
          <div className="px-4 py-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Currency
                  </th>

                  <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Debit
                  </th>

                  <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Credit
                  </th>

                  <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(account.currencyBalances || {}).map(
                  ([currency, data]) => (
                    <tr
                      key={currency}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-1.5 text-xs font-semibold text-slate-700">
                        {currency}
                      </td>

                      <td className="py-1.5 text-right text-xs text-slate-600">
                        {Number(data.debit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-1.5 text-right text-xs text-green-600">
                        {Number(data.credit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td
                        className={`py-1.5 text-right text-xs font-bold ${
                          Number(data.balance) < 0
                            ? "text-red-600"
                            : "text-blue-700"
                        }`}
                      >
                        {Number(data.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ),
                )}

                {Object.keys(account.currencyBalances || {}).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-3 text-center text-xs text-slate-400"
                    >
                      No transactions found for this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* =====================================================
          TOTAL CUSTOMER BALANCE
      ===================================================== */}
      <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/40">
        {/* TOTAL HEADER */}
        <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-4 py-2.5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
              Customer Summary
            </div>

            <div className="text-sm font-bold text-blue-800">
              Total Customer Balance
            </div>
          </div>

          <div className="rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            All Accounts
          </div>
        </div>

        {/* TOTAL TABLE */}
        <div className="px-4 py-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Currency
                </th>

                <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Debit
                </th>

                <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Credit
                </th>

                <th className="py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Total Balance
                </th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(
                customerIdReport.totalCurrencyBalances || {},
              ).map(([currency, data]) => (
                <tr
                  key={currency}
                  className="border-b border-blue-100/70 last:border-0"
                >
                  <td className="py-1.5 text-xs font-bold text-slate-700">
                    {currency}
                  </td>

                  <td className="py-1.5 text-right text-xs text-slate-600">
                    {Number(data.debit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="py-1.5 text-right text-xs font-semibold text-green-600">
                    {Number(data.credit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td
                    className={`py-1.5 text-right text-xs font-bold ${
                      Number(data.balance) < 0
                        ? "text-red-600"
                        : "text-blue-700"
                    }`}
                  >
                    {Number(data.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}

              {Object.keys(
                customerIdReport.totalCurrencyBalances || {},
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 text-center text-xs text-slate-400"
                  >
                    No currency balances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)}
        </div>
      </Modal>

      {customerStatementData && (
        <div id="customer-statement-print">
          <AccountStatement
            logo={myLogo}
            brand={myBrand}
            branch={customerStatementData.branch}
            account={customerStatementData.account}
            accountHolder={customerStatementData.accountHolder}
            currency={customerStatementData.currency}
            fromDate={customerStatementData.fromDate}
            toDate={customerStatementData.toDate}
            overallTotals={customerStatementData.overallTotals}
            currentBalance={customerStatementData.currentBalance}
            statementTotals={customerStatementData.statementTotals}
            statementBalance={customerStatementData.statementBalance}
            rows={customerStatementData.rows}
            landscape={true}
          />
        </div>
      )}
    </HomeLayout>
  );
};

export default Dashboard;
