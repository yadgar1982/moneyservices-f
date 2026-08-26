import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import "./transactions.css";
import jsPDF from "jspdf";
import { useReactToPrint } from "react-to-print";
import AccountStatement from "../Shared/Export/Statements/AccountStatement";
import TransactionReceipt from "../Shared/Export/Statements/TransactionReceipt";
import html2canvas from "html2canvas";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Upload,
  message,
  Table,
  Tabs,
  Tag,
  Popconfirm,
  Avatar,
  Image,
  Modal,
  DatePicker,
  Row,
  Col,
  Space,
  Empty,
} from "antd";
import HomeLayout from "../Shared/Layouts/HomeLayout";
import {
  BankOutlined,
  BookOutlined,
  CameraOutlined,
  CheckOutlined,
  ClearOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SignatureOutlined,
  StopOutlined,
  SwapOutlined,
  UploadOutlined,
  VideoCameraAddOutlined,
  MessageOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import Webcam from "react-webcam";
import { toast } from "react-toastify";
import { useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL;

import { http, fetcher } from "../Modules/http";
import { fetchTransaction } from "../../redux/slices/transactionSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";
import { fetchUsers } from "../../redux/slices/customerSlice";
import { fetchCurrency } from "../../redux/slices/currencySlice";
import { fetchBranch } from "../../redux/slices/branchSlice";
import dayjs from "dayjs";
const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;

const Transactions = () => {
  const statementRef = useRef(null);
  const receiptRef = useRef();

  //states
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedToCurrency, setSelectedToCurrency] = useState("");
  const [form] = Form.useForm();
  const [statementForm] = Form.useForm();
  const [transactionType, setTransactionType] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [edit, setEdit] = useState(false);
  const [webcamActive, setWebcamActive] = useState(true);
  const [scannedDoc, setScannedDoc] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [trId, setTrId] = useState(null);
  const [calc, setCalc] = useState(false);
  const [amount, setAmount] = useState(null);
  const [rate, setRate] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const validationConfirmed = useRef(false);

  // data search for main table
  const [showIsPassed, setShowIsPassed] = useState(false);

  //account statement states
  const [stAcc, setStAcc] = useState(null);
  const [stName, setStName] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [resultText, setResultText] = useState("");
  const [editTag, setEditTag] = useState("");
  const [statementChecked, setStatementChecked] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState("1");
  const [historyPage, setHistoryPage] = useState(1);
  const httpReq = http();

  const dispatch = useDispatch();

  //getting data from redux
  const { transactions, loading, error } = useSelector(
    (state) => state.transactions,
  );

  //getting user from localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const myUser = userInfo?.fullname;
  const myBranch = userInfo?.branch;

  const branding = JSON.parse(localStorage.getItem("branding"));

  const myBrand = branding?.data?.[0];

  const logo = myBrand?.logo
    ? `${import.meta.env.VITE_ENDPOINT}${myBrand.logo}`
    : "";

  console.log("TRANSACTION LOGO:", logo);

  // Redux
  const { users, uLoading, uError } = useSelector((state) => state.users);
  const { currencies, cLoading, cError } = useSelector(
    (state) => state.currencies,
  );
  const { branches, bLoading, bError } = useSelector((state) => state.branches);

  useEffect(() => {
    dispatch(fetchTransaction());
    dispatch(fetchUsers());
    dispatch(fetchCurrency());
    dispatch(fetchBranch());
  }, []);

  // end of redux

  // Filter by account
  const accountFiltered = (transactions || []).filter(
    (t) => String(t.accountNo) === String(stAcc),
  );

  //  Currency options (for Select)
  const filteredCurrencies = [
    ...new Set(accountFiltered.map((t) => t.currency)),
  ];
  // PRINT FUNCTIONS

  // handleprint statement

  const handleStatementPrint = useReactToPrint({
    contentRef: statementRef,
    documentTitle: "Account Statement",

    pageStyle: `
    @page {
      margin: 5mm;
    }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background: #ffffff !important;
      }

      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `,
  });

  useEffect(() => {
    if (!statementData) return;

    const timer = setTimeout(() => {
      handleStatementPrint();
    }, 300);

    return () => clearTimeout(timer);
  }, [statementData, handleStatementPrint]);

  // handle print receipt
  const handleReceiptPrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: "Transaction Receipt",

    pageStyle: `
    @page {
      margin: 5mm;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
  `,
  });

  // print statement
  const prepareStatement = (values, shouldPrint = true) => {
    setStatementChecked(true);

    const { account, currency, fromDate, toDate } = values;

    const selectedAccountNo =
      account !== undefined && account !== null && String(account).trim() !== ""
        ? String(account)
        : "";

    // SELECTED CURRENCY
    const selectedCurrencyValue =
      currency !== undefined &&
      currency !== null &&
      String(currency).trim() !== ""
        ? String(currency)
        : "";

    // 1. GET ALL TRANSACTIONS
    let accountTransactions = [...(transactions || [])];

    // 2. FILTER BY ACCOUNT
    if (selectedAccountNo) {
      accountTransactions = accountTransactions.filter(
        (t) => String(t.accountNo || "") === String(selectedAccountNo),
      );
    }

    // 3. FILTER BY CURRENCY

    if (selectedCurrencyValue) {
      accountTransactions = accountTransactions.filter(
        (t) =>
          String(t.currency || "").toUpperCase() ===
          String(selectedCurrencyValue).toUpperCase(),
      );
    }

    // =========================================================
    // 4. CURRENT TOTALS
    //
    // IMPORTANT:
    // NO DATE FILTER HERE.
    //
    // These represent the actual current position
    // of the selected account/currency.
    // =========================================================

    const overallTotals = {
      debit: 0,
      credit: 0,
    };

    accountTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      if (t.transactionType === "credit") {
        overallTotals.credit += amount;
      }

      if (t.transactionType === "debit") {
        overallTotals.debit += amount;
      }
    });

    const currentBalance = overallTotals.credit - overallTotals.debit;

    // 5. APPLY DATE FILTER
    //
    // DATE FILTER ONLY AFFECTS THE STATEMENT.
    // It does NOT affect currentBalance.
    let result = [...accountTransactions];

    if (fromDate) {
      result = result.filter((t) => {
        const txDate = dayjs(t.createdAt);

        return !txDate.isBefore(dayjs(fromDate), "day");
      });
    }

    if (toDate) {
      result = result.filter((t) => {
        const txDate = dayjs(t.createdAt);

        return !txDate.isAfter(dayjs(toDate), "day");
      });
    }

    // 6. NO DATA
    if (result.length === 0) {
      setResultText("No data to display");

      toast.error("No transactions found for the selected filters.");

      return null;
    }

    // 7. SORT OLDEST → NEWEST
    const sorted = [...result].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    setResultText("");

    // 8. STATEMENT TOTALS
    // These ARE date-filtered.
    const statementTotals = {
      debit: 0,
      credit: 0,
    };

    // Running balance belongs ONLY to
    // the transactions displayed in this statement.
    let runningBalance = 0;

    // 9. BUILD STATEMENT ROWS
    const statementRows = sorted.map((t, index) => {
      const amount = Number(t.amount) || 0;

      // CREDIT
      if (t.transactionType === "credit") {
        statementTotals.credit += amount;
        runningBalance += amount;
      }

      // DEBIT
      if (t.transactionType === "debit") {
        statementTotals.debit += amount;
        runningBalance -= amount;
      }

      // RETURN ROW
      return {
        // Row number
        no: index + 1,

        // Date
        date: t.createdAt ? dayjs(t.createdAt).format("DD-MM-YYYY") : "-",

        // Account number
        accountNo: t.accountNo || "-",

        // Customer full name
        fullName: t.fullname || "-",

        // Transaction ID
        transactionId: t.transactionId || "-",

        // Transaction Number
        transactionNo:
          t.transactionNo ||
          t.transferNo ||
          t.transactionNoId ||
          t.transNo ||
          "-",

        // Transaction Type
        transactionType: t.transactionType || "-",

        // Description
        description: t.details || "-",

        // Credit
        credit: t.transactionType === "credit" ? amount : "",

        // Debit
        debit: t.transactionType === "debit" ? amount : "",

        // Running balance
        balance: runningBalance,

        // Currency
        currency: t.currency || selectedCurrencyValue || "-",
      };
    });

    // 10. STATEMENT BALANCE
    // This is ONLY the selected date-range balance.
    const statementBalance = statementTotals.credit - statementTotals.debit;

    // 11. FIND ACCOUNT HOLDER
    const selectedCustomer = selectedAccountNo
      ? users.find(
          (user) => String(user.accountNo) === String(selectedAccountNo),
        )
      : null;

    const accountHolder =
      selectedCustomer?.fullname ||
      (selectedAccountNo ? stName || "-" : "All Accounts");

    // =========================================================
    // 12. PREPARED STATEMENT DATA
    // =========================================================

    const preparedData = {
      // -----------------------------
      // Account information
      // -----------------------------

      account: selectedAccountNo || "",

      accountHolder,

      branch: myBranch,

      currency: selectedCurrencyValue || "All Currencies",

      // -----------------------------
      // Date range
      // -----------------------------

      fromDate: fromDate || "",

      toDate: toDate || "",

      // -----------------------------
      // Statement rows
      // -----------------------------

      rows: statementRows,

      // -----------------------------
      // Raw date-filtered transactions
      // -----------------------------

      transactions: sorted,

      // -----------------------------
      // CURRENT TOTALS
      //
      // Not affected by date filter
      // -----------------------------

      overallTotals,

      currentDebit: overallTotals.debit,

      currentCredit: overallTotals.credit,

      currentBalance,

      // -----------------------------
      // STATEMENT TOTALS
      //
      // Affected by date filter
      // -----------------------------

      statementTotals,

      statementDebit: statementTotals.debit,

      statementCredit: statementTotals.credit,

      statementBalance,

      // Useful aliases for print/export
      filteredDebit: statementTotals.debit,

      filteredCredit: statementTotals.credit,

      filteredBalance: statementBalance,
    };

    // 13. SAVE FOR EXISTING PRINT SYSTEM
    if (shouldPrint) {
      setStatementData(preparedData);
    }

    return preparedData;
  };

  // Export professional account statement to Excel
  const exportStatementToExcel = (values) => {
    const preparedData = prepareStatement(values, false);

    if (!preparedData) {
      return;
    }

    const {
      account,
      accountHolder,
      currency,
      fromDate,
      toDate,
      rows,
      currentBalance,
      statementTotals,
    } = preparedData;

    // Company information
    const companyName = myBrand?.companyName || "Money Services";

    const companyEmail = myBrand?.email || "";

    const companyMobile = myBrand?.mobile || "";

    const companyAddress = myBrand?.address || "";

    // Format date
    const formatDate = (date) => {
      if (!date) {
        return "";
      }

      return dayjs(date).format("DD-MM-YYYY");
    };

    // Statement period
    const statementPeriod =
      fromDate || toDate
        ? `${fromDate ? formatDate(fromDate) : "Beginning"} - ${
            toDate ? formatDate(toDate) : "Present"
          }`
        : "All Dates";

    // Format number
    const amount = (value) => Number(value || 0);

    // Transaction rows
    const transactionRows = rows.map((row) => [
      row.no,

      row.date,

      row.accountNo || "-",

      row.description || "-",

      row.credit === "" ? "" : amount(row.credit),

      row.debit === "" ? "" : amount(row.debit),

      amount(row.balance),
    ]);

    // Excel content
    const worksheetData = [
      // Company
      [companyName],

      [[companyEmail, companyMobile].filter(Boolean).join("  |  ")],

      [companyAddress],

      [],

      // Report title
      ["ACCOUNT STATEMENT"],

      [],

      // Account information
      [
        "Account No",
        account || "All Accounts",
        "",
        "Currency",
        currency || "-",
        "",
        "",
      ],

      [
        "Account Holder",
        accountHolder || "All Accounts",
        "",
        "Statement Period",
        statementPeriod,
        "",
        "",
      ],

      [],

      // Current balance
      [
        "CURRENT BALANCE",
        "",
        "",
        "",
        amount(currentBalance),
        currency || "",
        "",
      ],

      [],

      // Table header
      ["#", "Date", "Account No", "Description", "Credit", "Debit", "Balance"],

      // Transactions
      ...transactionRows,

      // Empty row
      [],

      // Statement totals
      [
        "",
        "",
        "",
        "STATEMENT TOTALS",
        amount(statementTotals?.credit || 0),
        amount(statementTotals?.debit || 0),
        "",
      ],

      [],
      ["Generated", dayjs().format("DD-MM-YYYY HH:mm")],

      ["Powered by", companyName],
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge company header
    worksheet["!merges"] = [
      // Company name
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 6 },
      },

      // Contact
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: 6 },
      },

      // Address
      {
        s: { r: 2, c: 0 },
        e: { r: 2, c: 6 },
      },

      // Title
      {
        s: { r: 4, c: 0 },
        e: { r: 4, c: 6 },
      },

      // Account information
      {
        s: { r: 6, c: 1 },
        e: { r: 6, c: 2 },
      },

      {
        s: { r: 6, c: 4 },
        e: { r: 6, c: 6 },
      },

      {
        s: { r: 7, c: 1 },
        e: { r: 7, c: 2 },
      },

      {
        s: { r: 7, c: 4 },
        e: { r: 7, c: 6 },
      },

      // Current balance
      {
        s: { r: 9, c: 0 },
        e: { r: 9, c: 3 },
      },

      {
        s: { r: 9, c: 4 },
        e: { r: 9, c: 6 },
      },

      // Generated footer
      {
        s: { r: worksheetData.length - 2, c: 1 },
        e: { r: worksheetData.length - 2, c: 6 },
      },

      {
        s: { r: worksheetData.length - 1, c: 1 },
        e: { r: worksheetData.length - 1, c: 6 },
      },
    ];

    // Professional column widths
    worksheet["!cols"] = [
      { wch: 7 },
      { wch: 15 },
      { wch: 16 },
      { wch: 65 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    // Row heights
    worksheet["!rows"] = [
      { hpt: 30 }, // Company
      { hpt: 20 }, // Contact
      { hpt: 20 }, // Address
      { hpt: 8 }, // Spacer
      { hpt: 30 }, // Title
      { hpt: 8 }, // Spacer
      { hpt: 24 }, // Account info
      { hpt: 24 }, // Holder info
      { hpt: 8 }, // Spacer
      { hpt: 30 }, // Current balance
      { hpt: 8 }, // Spacer
      { hpt: 28 }, // Table header
    ];

    // Number format for transaction rows
    const transactionStartRow = 12;
    const transactionEndRow = transactionStartRow + transactionRows.length - 1;

    for (let row = transactionStartRow; row <= transactionEndRow; row++) {
      // Credit
      const creditCell = XLSX.utils.encode_cell({
        r: row,
        c: 4,
      });

      // Debit
      const debitCell = XLSX.utils.encode_cell({
        r: row,
        c: 5,
      });

      // Balance
      const balanceCell = XLSX.utils.encode_cell({
        r: row,
        c: 6,
      });

      if (worksheet[creditCell]) {
        worksheet[creditCell].z = "#,##0.00";
      }

      if (worksheet[debitCell]) {
        worksheet[debitCell].z = "#,##0.00";
      }

      if (worksheet[balanceCell]) {
        worksheet[balanceCell].z = "#,##0.00";
      }
    }

    // Current balance number format
    if (worksheet["E10"]) {
      worksheet["E10"].z = "#,##0.00";
    }

    // Statement totals number format
    const totalsRow = transactionEndRow + 2;

    const totalCreditCell = XLSX.utils.encode_cell({
      r: totalsRow,
      c: 4,
    });

    const totalDebitCell = XLSX.utils.encode_cell({
      r: totalsRow,
      c: 5,
    });

    if (worksheet[totalCreditCell]) {
      worksheet[totalCreditCell].z = "#,##0.00";
    }

    if (worksheet[totalDebitCell]) {
      worksheet[totalDebitCell].z = "#,##0.00";
    }

    // Freeze the transaction header
    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 12,
    };

    // Enable Excel filters on transactions
    worksheet["!autofilter"] = {
      ref: `A12:G${transactionEndRow + 1}`,
    };

    // Print settings
    worksheet["!pageSetup"] = {
      orientation: "landscape",
      paperSize: 9,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    // Page margins
    worksheet["!margins"] = {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Workbook properties
    workbook.Props = {
      Title: "Account Statement",
      Subject: "Customer Account Statement",
      Author: companyName,
      Company: companyName,
      Category: "Financial Statement",
      Keywords: "Account Statement, Transactions",
    };

    // Add worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement");

    // Professional filename
    const accountPart = account ? `Account-${account}` : "All-Accounts";

    const currencyPart = currency || "All-Currencies";

    const fileName = `${accountPart}-${currencyPart}-Statement-${dayjs().format(
      "YYYY-MM-DD-HHmm",
    )}.xlsx`;

    // Export
    XLSX.writeFile(workbook, fileName);
  };
  //print transaction

  const printRecord = async (record) => {
    const { transactionId } = record;

    try {
      const res = await http().get(
        `/api/transaction/readbyid/${record.transactionId}`,
      );

      const allTransactions = res.data.data;

      const debit = allTransactions.find((t) => t.transactionType === "debit");

      const credit = allTransactions.find(
        (t) => t.transactionType === "credit",
      );

      const base = debit || credit || record;

      setReceiptData({
        transaction: {
          ...base,
          transactionNo: record.transactionNo,
          transactionId: record.transactionId,
          createdAt: record.createdAt,
          isPass: record.isPass,

          debit,
          credit,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const { data, terror } = SWR("/api/transaction/read", fetcher);
  const handleSearch = () => {
    setIsSearching(true);
  };
  const handleClear = () => {
    setSearchText("");
    setFromDate(null);
    setToDate(null);
    setIsSearching(false);
  };
  const getDatasource = (type) =>
    (data?.data || []).filter(
      (t) =>
        t.transaction === type &&
        t.isPass === (showIsPassed ? "true" : "false"),
    );
  const datasource = getDatasource("transaction");
  const datasourceTransfer = getDatasource("transfer");
  const datasourceExchange = getDatasource("exchange");

  // end of table datasource

  useEffect(() => {
    const amt = amount || 0;
    const r = rate || 1;

    const f_Amount = amt * r;
    form.setFieldsValue({ finalAmount: f_Amount });
  }, [amount, rate, form]);

  const sigCanvas = useRef({});
  const webcamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (signatureImage) {
        URL.revokeObjectURL(signatureImage);
      }
    };
  }, [signatureImage]);

  useEffect(() => {
    if (edit) return;

    if (selectedAccount) {
      const customer = users.find(
        (c) => String(c.accountNo) === String(selectedAccount),
      );

      if (customer) {
        form.setFieldsValue({
          fullname: customer.fullname,
          accountNo: customer.accountNo,
          currency: customer.currency,
        });

        setSelectedCurrency(customer.currency);

        // ONLY EXCHANGE
        if (transactionType === "exchange") {
          setToAccount({
            accountNo: customer.accountNo,
            fullname: customer.fullname,
          });

          setSelectedToCurrency(customer.currency);

          form.setFieldsValue({
            to: customer.accountNo,
            tocurrency: customer.currency,
          });
        }
      }
    } else {
      form.resetFields(["fullname", "accountNo", "currency"]);
    }
  }, [selectedAccount, transactionType, users, form, edit]);

  //account options
  const accountOptions = [
    ...new Map(
      users
        .filter((c) => c.accountNo && c.accountNo.trim() !== "") // ✅ skip empty
        .map((c) => [
          c.accountNo,
          {
            label: `${c.fullname} | ${c.accountNo}`,
            value: c.accountNo,
            fullname: c.fullname,
          },
        ]),
    ).values(),
  ];

  // calcualtion of balanc eand currency
  const getBalancesByAccount = (transactions = [], accountNo) => {
    const balances = {};

    transactions.forEach((t) => {
      if (Number(t.accountNo) !== Number(accountNo)) return;

      const currency = t.currency;
      const amount = Number(t.amount) || 0;

      if (!balances[currency]) balances[currency] = 0;

      if (t.transactionType === "credit") {
        balances[currency] += amount;
      } else if (t.transactionType === "debit") {
        balances[currency] -= amount;
      }
    });

    return balances;
  };

  // save customer
  const selectedCustomers = useMemo(() => {
    if (!selectedAccount) return [];

    return users
      .filter((c) => c.accountNo === selectedAccount)
      .map((c) => ({
        ...c,
        balances: getBalancesByAccount(transactions, c.accountNo),
      }));
  }, [users, transactions, selectedAccount]);

  // save currencyes and balance
  const customerCurrencies = useMemo(() => {
    if (!selectedAccount) return [];

    const customer = selectedCustomers[0];

    if (!customer?.balances) return [];

    return Object.entries(customer.balances).map(([currency, balance]) => ({
      currency,
      balance: Number(balance) || 0,
    }));
  }, [selectedAccount, selectedCustomers]);

  //validate file
  const MAX_SIZE = 30 * 1024;
  const validateFileSize = (file) => {
    if (file.size > MAX_SIZE) {
      message.error("Image size must be 20 KB or less");
      return false;
    }
    return true;
  };

  // capture photo by webcam
  const capturePhoto = async () => {
    // 🔊 play camera sound immediately
    shutterSound.currentTime = 0; // reset if clicked fast
    shutterSound.play().catch(() => {});

    const imageSrc = webcamRef.current.getScreenshot();

    const img = new window.Image();
    img.src = imageSrc;

    img.onload = async () => {
      const canvas = document.createElement("canvas");

      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 600;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          if (blob.size > MAX_SIZE) {
            message.error("Image still exceeds 20 KB");
            return;
          }

          const file = new File([blob], "photo.jpg", {
            type: "image/jpeg",
          });

          setCapturedImage(file);
        },
        "image/jpeg",
        0.4,
      );
    };
  };

  //Save signature

  const saveSignature = () => {
    console.log(sigCanvas.current?.getCanvas()?.width);
    console.log(sigCanvas.current?.getCanvas()?.height);
    sigCanvas.current.getCanvas().toBlob((blob) => {
      if (!blob) {
        message.error("Please draw a signature first");
        return;
      }

      if (blob.size > MAX_SIZE) {
        message.error("Signature must be 20 KB or less");
        return;
      }

      const file = new File([blob], "signature.png", {
        type: "image/png",
      });

      setSignatureImage(file);
    });
  };

  // Clear signature
  const clearSignature = () => {
    sigCanvas.current.clear();
    setSignatureImage(null);
  };

  // Image Upload
  const handleImageUpload = (file) => {
    if (!validateFileSize(file)) return Upload.LIST_IGNORE;
    setCapturedImage(file); // store File object
    return false;
  };

  // Signature Upload
  const handleSignatureUpload = (file) => {
    if (!validateFileSize(file)) return Upload.LIST_IGNORE;
    setSignatureImage(file);
    return false;
  };

  // handle ispass
  const handleIspassed = async (id) => {
    try {
      const httpReq = http();
      await httpReq.put(`/api/transaction/updatemany/${id}`, { isPass: true });
      toast.success("Transaction marked as passed!");
      mutate("/api/transaction/read");
    } catch (err) {
      toast.error("Failed to Pass!", err);
    }
  };

  // Create transaction

  useEffect(() => {
    const safeRate = rate || 1;
    const computedAmt = calc ? amount / safeRate : amount * safeRate;

    // Update the form field
    form.setFieldsValue({ finalAmount: Number(computedAmt.toFixed(2)) });
  }, [amount, rate, calc, form]); // dependencies

  // Create Transaction Id
  const loadTransactionId = async () => {
    try {
      const res = await http().get("/api/transaction/next-id");

      form.setFieldsValue({
        transactionId: res.data.transactionId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTransactionId();
  }, []);

  // Trnasaction creattion, update and delete functions
  const onFinish = async (values) => {
    try {
      const { _id, ...rest } = values;

      // CUSTOMER CURRENCY / BALANCE VALIDATION
      if (!validationConfirmed.current) {
        const selectedCustomerCurrency = customerCurrencies.find(
          (item) => item.currency === selectedCurrency,
        );

        // Currency does not exist for this customer
        if (!selectedCustomerCurrency) {
          Modal.confirm({
            title: "Currency not found",
            content: (
              <div>
                <p>
                  This customer does not have a{" "}
                  <strong>{selectedCurrency}</strong> balance.
                </p>

                <p>Do you want to continue anyway?</p>
              </div>
            ),
            okText: "Yes, Continue",
            cancelText: "No",

            onOk: () => {
              validationConfirmed.current = true;
              form.submit();
            },
          });

          return;
        }

        // Amount exceeds customer's balance
        if (Number(rest.amount) > Number(selectedCustomerCurrency.balance)) {
          Modal.confirm({
            title: "Insufficient Balance",
            content: (
              <div>
                <p>
                  Customer's <strong>{selectedCurrency}</strong> balance is{" "}
                  <strong>
                    {Number(selectedCustomerCurrency.balance).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </strong>
                  .
                </p>

                <p>
                  Transaction amount is{" "}
                  <strong>
                    {Number(rest.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  .
                </p>

                <p>
                  The amount exceeds the customer's balance.
                  <br />
                  Do you want to continue anyway?
                </p>
              </div>
            ),
            okText: "Yes, Continue",
            cancelText: "No",

            onOk: () => {
              validationConfirmed.current = true;
              form.submit();
            },
          });

          return;
        }
      }

      const commissionData = {
        fullname: rest.fullname,
        user: myUser,
        branch: myBranch,
        accountNo: Number(rest.accountNo),
        currency: rest.comission_currency,
        credit: Number(rest.comission),
        debit: 0,
        transactionId: rest.transactionId,
        transactionNo: rest.transactionNo,
        transactionType: rest.transaction,
        transferNo: rest.transferNo,
        details: `Service fee for ${values.transaction} ${values.transactionId} by ${values.fullname}`,
      };

      // Helper function to build FormData
      const buildFormData = (data) => {
        const fd = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (
            // !["documents", "image", "signature", "exchangeRate"].includes(key)
            !["documents", "image", "signature", "exchangeRate"].includes(key)
          ) {
            fd.append(key, value);
          }
        });

        if (scannedDoc) fd.append("documents", scannedDoc);
        if (capturedImage) fd.append("image", capturedImage);
        if (signatureImage) fd.append("signature", signatureImage);

        // Append exchangeRate ONLY ONCE
        fd.append("exchangeRate", rate || 1);

        fd.append("isPass", "false");

        return fd;
      };

      //  NORMAL CREDIT OR DEBIT
      if (transactionType !== "transfer" && transactionType !== "exchange") {
        const formData = buildFormData({
          ...rest,
          user: myUser,
          branch: myBranch,
        });

        await http().post("/api/transaction/create", formData);
      }
      //  TRANSFER → CREATE TWO ENTRIES
      if (
        (transactionType === "transfer" || transactionType === "exchange") &&
        toAccount
      ) {
        const originalAmount = Number(rest.amount);
        const convertedAmount = Number(rest.finalAmount);

        const details =
          rest.details?.trim() ||
          (transactionType === "exchange"
            ? `${selectedCurrency} ${originalAmount} exchange from ${rest.fullname} to ${toAccount.fullname} at exchange rate ${rest.exchangeRate}`
            : `${selectedCurrency} ${originalAmount} transfer from ${rest.fullname} to ${toAccount.fullname}`);

        // Debit
        const debitData = buildFormData({
          ...rest,
          user: myUser,
          branch: myBranch,
          transactionType: "debit",
          transaction: transactionType,
          amount: originalAmount,
          finalAmount: convertedAmount,
          currency: selectedCurrency,
          toFullname: toAccount.fullname,
          details,
        });

        // Credit
        const creditData = buildFormData({
          ...rest,
          user: myUser,
          branch: myBranch,
          accountNo: toAccount.accountNo,
          fullname: toAccount.fullname,
          toFullname: toAccount.fullname,
          currency: selectedToCurrency,
          transactionType: "credit",
          transaction: transactionType,
          amount: convertedAmount,
          finalAmount: convertedAmount,
          details,
        });

        await http().post("/api/transaction/create", debitData);
        await http().post("/api/transaction/create", creditData);
      }
      if (Number(rest.comission) > 0) {
        await http().post("/api/comission/create", commissionData);
      }

      mutate("/api/transaction/read");

      toast.success("Transaction created successfully!");
      form.resetFields();
      setRate(1);
      validationConfirmed.current = false;
      // Get the next transaction ID
      await loadTransactionId();
      setCapturedImage(null);
      setSignatureImage(null);
      setSelectedAccount(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create transaction!");
    }
  };

  const handleEdit = async (record) => {
    let parent = document.activeElement;

    // Scroll to top
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;

      if (overflowY === "auto" || overflowY === "scroll") {
        parent.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        break;
      }

      parent = parent.parentElement;
    }

    // Get commission
    let comission = 0;
    let comissionCurrency = "";

    try {
      const res = await http().get(
        `/api/comission/readbyid/${record.transactionId}`,
      );

      comission = Number(res.data.data.credit || 0);
      comissionCurrency = res.data.data.currency || "";
    } catch (err) {
      console.error(err);
    }

    setTrId(record.transactionId);
    setEdit(true);

    setSelectedCurrency(record.currency);
    setRate(record.exchangeRate);
    setAmount(record.amount);
    setTransactionType(record.transaction);

    form.setFieldsValue({
      fullname: record.fullname,
      accountNo: record.accountNo,
      currency: record.currency,
    });

    if (
      record.transaction === "transfer" ||
      record.transaction === "exchange"
    ) {
      const creditTransaction = transactions.find(
        (item) =>
          item.transactionId === record.transactionId &&
          item.transactionType === "credit",
      );

      if (creditTransaction) {
        setToAccount({
          accountNo: creditTransaction.accountNo,
          fullname: creditTransaction.fullname,
        });

        setSelectedToCurrency(creditTransaction.currency);

        form.setFieldsValue({
          to: creditTransaction.accountNo,
          tocurrency: creditTransaction.currency,
        });
      }
    }
    form.setFieldsValue({
      _id: record._id,
      transactionId: record.transactionId,
      transactionNo: record.transactionNo,
      transaction: record.transaction,
      transactionType: record.transactionType,
      transferNo: record.transferNo,
      details: record.details,
      isPass: record.isPass,
      amount: record.amount,

      exchangeRate: record.exchangeRate,

      to: record.to,

      comission,
      comission_currency: comissionCurrency,
    });

    setEditTag("Please fill in all empty input fields carefully.");
  };

  const onUpdate = async (values) => {
    try {
      if (!trId) {
        toast.error("Transaction ID missing!");
        return;
      }

      const originalAmount = Number(values.amount);
      const convertedAmount = Number(values.finalAmount);

      const buildFormData = (data) => {
        const fd = new FormData();

        // Append normal fields
        Object.entries(data).forEach(([key, value]) => {
          if (
            !["image", "signature", "document", "exchangeRate"].includes(key)
          ) {
            fd.append(key, value ?? "");
          }
        });

        // Append files ONLY if they exist
        if (scannedDoc) fd.append("document", scannedDoc);
        if (capturedImage) fd.append("image", capturedImage);
        if (signatureImage) fd.append("signature", signatureImage);

        // Always append exchangeRate
        fd.append("exchangeRate", values.exchangeRate || 1);

        return fd;
      };

      //  Normalize transfer/exchange
      let payload = { ...values, user: myUser, branch: myBranch };

      if (
        values.transaction === "transfer" ||
        values.transaction === "exchange"
      ) {
        payload = {
          ...values,

          // receiver account
          to: toAccount?.accountNo,

          // temporary receiver fullname for backend
          receiverFullname: toAccount?.fullname,

          amount: originalAmount,
          finalAmount: convertedAmount,

          fromCurrency: selectedCurrency,
          toCurrency: selectedToCurrency,
        };
      }

      const formData = buildFormData(payload);

      const commissionData = {
        fullname: values.fullname,
        user: myUser,
        branch: myBranch,
        accountNo: Number(values.accountNo),
        currency: values.comission_currency,
        credit: Number(values.comission),
        debit: 0,
        transactionId: values.transactionId,
        transactionNo: values.transactionNo,
        transactionType: values.transaction,
        transferNo: values.transferNo,
        details: `Service fee for ${values.transaction} ${values.transactionId} by ${values.fullname}`,
      };

      await http().put(`/api/transaction/update/${trId}`, formData);
      if (Number(values.comission) > 0) {
        await http().put(
          `/api/comission/update/${values.transactionId}`,
          commissionData,
        );
      }
      mutate("/api/transaction/read");

      toast.success("Transaction updated successfully!");
      form.resetFields();
      setCapturedImage(null);
      setSignatureImage(null);
      setScannedDoc(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update transaction!");
    }
    setEditTag(" ");
    setEdit(false);
  };

  //Delete transaction
  const onDelete = async (transactionId) => {
    try {
      // Delete transaction
      await httpReq.delete(`/api/transaction/delete/${transactionId}`);

      // Delete commission (if it exists)
      await httpReq.delete(`/api/comission/delete/${transactionId}`);

      mutate("/api/transaction/read");

      toast.success("Transaction deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete transaction!");
    }
  };

  // data sourse
  const filterData = (data) => {
    let filtered = [...data];

    //filter data
    if (searchText) {
      const keyword = searchText.toLowerCase().trim();

      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword),
        ),
      );
    }

    // From Date
    if (fromDate) {
      filtered = filtered.filter(
        (row) => !dayjs(row.createdAt).isBefore(fromDate, "day"),
      );
    }

    // To Date
    if (toDate) {
      filtered = filtered.filter(
        (row) => !dayjs(row.createdAt).isAfter(toDate, "day"),
      );
    }

    return filtered;
  };

  // TRANSACTION HISTORY - GET CURRENT FILTERED DATA
  const getHistoryData = (tabKey = activeHistoryTab) => {
    let source = [];

    if (tabKey === "1") {
      source = datasource || [];
    } else if (tabKey === "2") {
      source = datasourceTransfer || [];
    } else if (tabKey === "3") {
      source = datasourceExchange || [];
    }

    return filterData(source);
  };

  // PRINT TRANSACTION HISTORY
  const printTransactionHistory = () => {
    const rows = getHistoryData();

    if (!rows.length) {
      message.warning("No transactions found to print.");
      return;
    }

    const tabNames = {
      1: "Transactions",
      2: "Transfers",
      3: "Exchanges",
    };

    const reportType = tabNames[activeHistoryTab] || "Transactions";

    const companyName = myBrand?.companyName || "Money Services";

    const companyAddress = myBrand?.address || "";

    const companyMobile = myBrand?.mobile || "";

    const companyEmail = myBrand?.email || "";

    const formatAmount = (value) =>
      Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const rowsHTML = rows
      .map(
        (record, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${record.accountNo || "-"}</td>
          <td>
            ${
              record.createdAt
                ? dayjs(record.createdAt).format("DD-MM-YYYY")
                : "-"
            }
          </td>
          <td>${record.fullname || "-"}</td>
          <td>${record.transactionId || "-"}</td>
          <td>${record.transactionNo || "-"}</td>
          <td>${record.details || "-"}</td>
          <td>${record.transactionType || "-"}</td>
          <td>${record.exchangeRate || "-"}</td>
          <td>${record.currency || "-"}</td>
          <td class="amount">
            ${formatAmount(record.amount)}
          </td>
        </tr>
      `,
      )
      .join("");

    const totalCredit = rows.reduce(
      (sum, row) =>
        row.transactionType === "credit" ? sum + Number(row.amount || 0) : sum,
      0,
    );

    const totalDebit = rows.reduce(
      (sum, row) =>
        row.transactionType === "debit" ? sum + Number(row.amount || 0) : sum,
      0,
    );

    const printWindow = window.open("", "_blank", "width=1400,height=900");

    if (!printWindow) {
      message.error("Please allow pop-ups to print the transaction history.");
      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${reportType} - Transaction History</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 25px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            background: white;
          }

          .container {
            width: 100%;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }

          .company {
            font-size: 24px;
            font-weight: bold;
            color: #113b8a;
            margin-bottom: 8px;
          }

          .contact {
            font-size: 12px;
            color: #64748b;
            line-height: 1.6;
          }

          .title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
            color: #0f172a;
          }

          .period {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
          }

          th {
            background: #1e3a8a;
            color: white;
            padding: 8px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
            white-space: nowrap;
          }

          td {
            padding: 7px 6px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }

          tr:nth-child(even) {
            background: #f8fafc;
          }

          .amount {
            text-align: right;
            font-weight: 600;
          }

          .totals {
            margin-top: 18px;
            display: flex;
            justify-content: flex-end;
            gap: 25px;
          }

          .total-box {
            border: 1px solid #cbd5e1;
            padding: 10px 18px;
            min-width: 150px;
          }

          .label {
            font-size: 10px;
            color: #64748b;
          }

          .value {
            display: block;
            margin-top: 4px;
            font-size: 15px;
            font-weight: bold;
          }

          .footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
@media print {
  body {
    margin: 0 !important;
    padding: 5mm !important;
  }

  @page {
    margin: 5mm;
  }

  .container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  table {
    width: 100% !important;
    margin-top: 8px !important;
  }

  thead {
    display: table-header-group;
  }

  tbody {
    display: table-row-group;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
         
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <div class="company">
              ${companyName}
            </div>

            <div class="contact">
              ${companyAddress || ""}
              ${companyMobile ? ` | ${companyMobile}` : ""}
              ${companyEmail ? ` | ${companyEmail}` : ""}
            </div>

            <div class="title">
              ${reportType} Transaction History
            </div>

            <div class="period">
              ${
                fromDate || toDate
                  ? `${fromDate ? dayjs(fromDate).format("DD-MM-YYYY") : "Beginning"}
                     - 
                     ${toDate ? dayjs(toDate).format("DD-MM-YYYY") : "Present"}`
                  : "All Dates"
              }
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Account No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Transaction ID</th>
                <th>Transaction No</th>
                <th>Details</th>
                <th>Type</th>
                <th>Ex-Rate</th>
                <th>Currency</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            Generated on ${dayjs().format("DD-MM-YYYY HH:mm")}
            | ${rows.length} record(s)
          </div>

        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>

      </body>
    </html>
  `);

    printWindow.document.close();
  };

  // EXPORT TRANSACTION HISTORY TO EXCEL
  const exportTransactionHistoryToExcel = () => {
    const rows = getHistoryData();

    if (!rows.length) {
      message.warning("No transactions found to export.");
      return;
    }

    const tabNames = {
      1: "Transactions",
      2: "Transfers",
      3: "Exchanges",
    };

    const reportType = tabNames[activeHistoryTab] || "Transactions";

    const companyName = myBrand?.companyName || "Money Services";

    const companyAddress = myBrand?.address || "";

    const companyMobile = myBrand?.mobile || "";

    const companyEmail = myBrand?.email || "";

    const worksheetData = [
      [companyName],

      [[companyEmail, companyMobile].filter(Boolean).join(" | ")],

      [companyAddress],

      [],

      [`${reportType.toUpperCase()} TRANSACTION HISTORY`],

      [],

      [
        "Report Type",
        reportType,
        "",
        "From",
        fromDate ? dayjs(fromDate).format("DD-MM-YYYY") : "Beginning",
        "",
        "To",
        toDate ? dayjs(toDate).format("DD-MM-YYYY") : "Present",
      ],

      [],

      [
        "#",
        "Account No",
        "Date",
        "Customer",
        "Transaction ID",
        "Transaction No",
        "Transfer No",
        "Details",
        "Transaction Type",
        "Exchange Rate",
        "Currency",
        "Amount",
        "Status",
      ],

      ...rows.map((record, index) => [
        index + 1,

        record.accountNo || "-",

        record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY") : "-",

        record.fullname || "-",

        record.transactionId || "-",

        record.transactionNo || "-",

        record.transferNo || "-",

        record.details || "-",

        record.transactionType || "-",

        Number(record.exchangeRate || 0),

        record.currency || "-",

        Number(record.amount || 0),

        record.isPass === "true" ? "Passed" : "Pending",
      ]),

      [],

      ["", "", "", "", "", "", "", "TOTAL RECORDS", rows.length],

      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTAL CREDIT",
        rows
          .filter((r) => r.transactionType === "credit")
          .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      ],

      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTAL DEBIT",
        rows
          .filter((r) => r.transactionType === "debit")
          .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge company header
    worksheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 12 },
      },
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: 12 },
      },
      {
        s: { r: 2, c: 0 },
        e: { r: 2, c: 12 },
      },
      {
        s: { r: 4, c: 0 },
        e: { r: 4, c: 12 },
      },
    ];

    // Column widths
    worksheet["!cols"] = [
      { wch: 7 },
      { wch: 15 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 50 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
    ];

    // Freeze transaction header
    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 9,
    };

    // Excel filter
    worksheet["!autofilter"] = {
      ref: `A9:M${9 + rows.length}`,
    };

    // Number formatting
    const transactionStartRow = 9;

    rows.forEach((_, index) => {
      const rowNumber = transactionStartRow + index;

      const amountCell = XLSX.utils.encode_cell({
        r: rowNumber,
        c: 11,
      });

      const exchangeCell = XLSX.utils.encode_cell({
        r: rowNumber,
        c: 9,
      });

      if (worksheet[amountCell]) {
        worksheet[amountCell].z = "#,##0.00";
      }

      if (worksheet[exchangeCell]) {
        worksheet[exchangeCell].z = "#,##0.0000";
      }
    });

    // Page setup
    worksheet["!pageSetup"] = {
      orientation: "landscape",
      paperSize: 9,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    worksheet["!margins"] = {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

    const workbook = XLSX.utils.book_new();

    workbook.Props = {
      Title: `${reportType} Transaction History`,
      Subject: "Transaction History",
      Author: companyName,
      Company: companyName,
      Category: "Transactions",
    };

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      reportType.substring(0, 31),
    );

    const fileName = `${reportType}_Transaction_History_${dayjs().format(
      "YYYY-MM-DD_HH-mm",
    )}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    message.success(`${reportType} transaction history exported successfully.`);
  };

  // color for currencies
  const getCurrencyColor = (currency) => {
    const colors = [
      "#2563eb",
      "#16a34a",
      "#dc2626",
      "#7c3aed",
      "#ea580c",
      "#0891b2",
      "#db2777",
      "#ca8a04",
      "#4f46e5",
      "#0f766e",
    ];

    let hash = 0;

    for (let i = 0; i < currency.length; i++) {
      hash = currency.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };
  const columns = [
    {
      title: "S/N",
      key: "serial",
      width: 80,
      align: "center",
      render: (_, __, index) => (historyPage - 1) * 10 + index + 1,
    },
    {
      title: "AccountNo",
      dataIndex: "accountNo",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: 90,
      render: (v) => (v ? dayjs(v).format("DD-MM-YYYY") : "—"),
    },
    {
      title: "Name",
      dataIndex: "fullname",

      width: 250,
    },
    {
      title: "Details",
      dataIndex: "details",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Tr-Type",
      dataIndex: "transactionType",
      width: 90,
      render: (value) => {
        if (!value) return "—";

        const type = value.toLowerCase();

        return (
          <Tag
            color={
              type === "credit" ? "green" : type === "debit" ? "red" : "default"
            }
          >
            {value}
          </Tag>
        );
      },
    },
    {
      title: "Ex-Rate",
      dataIndex: "exchangeRate",
      width: 70,
      render: (v) => v || "—",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      width: 70,
      render: (v) => v || "—",
    },

    {
      title: "Amount",
      dataIndex: "amount",
      width: 180,
      align: "right",
      render: (value, record) => (
        <Space size={6}>
          <Tag
            color={getCurrencyColor(record.currency)}
            style={{
              margin: 0,
              fontWeight: 600,
            }}
          >
            {record.currency}
          </Tag>

          <span className="font-medium">
            {Number(value || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </Space>
      ),
    },
    {
      title: "Photo",
      dataIndex: "image",
      width: 20,
      render: (_, record) => {
        return (
          <Avatar
            src={
              record.image
                ? `${API_URL}/uploads/transactions/${record.image.split("/").pop()}`
                : undefined
            }
            alt="image"
            style={{
              width: 20,
              height: 20,
              fontSize: 12,
            }}
          >
            {!record.image && record.fullname?.charAt(0)}
          </Avatar>
        );
      },
    },

    {
      title: "Print/Send",
      key: "actions",
      fixed: "right",
      width: 70,
      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);

        return (
          <Space size={15}>
            {/* Print */}
            <PrinterOutlined
              onClick={async () => {
                if (disabled) return;

                await printRecord(record);
                handleReceiptPrint();
              }}
              className={`!text-lg ${
                disabled
                  ? "!text-gray-300 !cursor-not-allowed"
                  : "!text-purple-600 !cursor-pointer"
              }`}
            />

            {/* WhatsApp */}
            <MessageOutlined
              onClick={() => !disabled && sendToWhatsApp(record)}
              className={`!text-lg ${
                disabled
                  ? "!text-gray-300 !cursor-not-allowed"
                  : "!text-green-600 !cursor-pointer"
              }`}
            />
          </Space>
        );
      },
    },
    {
      title: "Edit",
      key: "edit",
      fixed: "right",
      width: 20,
      height: 20,
      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);
        return (
          <EditOutlined
            onClick={() => !disabled && handleEdit(record)}
            className={`!text-xl  rounded ${
              disabled
                ? "!text-gray-300 !cursor-not-allowed"
                : "!text-blue-600 !cursor-pointer"
            }`}
          />
        );
      },
    },

    {
      title: "Pass",
      key: "isPassed",
      fixed: "right",
      width: 50,

      render: (_, record) => {
        const disabled =
          record.isPass === "true" ||
          shouldDisable(record, datasourceExchange || []);

        if (disabled) {
          return (
            <CheckOutlined className="!text-xl !text-gray-300 !cursor-not-allowed" />
          );
        }

        return (
          <Popconfirm
            title="Are you sure to pass this transaction?"
            onConfirm={() => handleIspassed(record.transactionId)}
          >
            <CheckOutlined className="!text-xl !text-green-600 hover:!text-green-700 !cursor-pointer" />
          </Popconfirm>
        );
      },
    },
    {
      title: "Delete",
      key: "isPassed",
      fixed: "right",
      width: 20,
      height: 20,

      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);

        if (disabled) {
          return (
            <DeleteOutlined className="!text-xl  rounded !text-gray-300 !cursor-not-allowed" />
          );
        }

        return (
          <Popconfirm
            title="Are you sure to Pass this transaction?"
            onConfirm={() => onDelete(record.transactionId)}
          >
            <DeleteOutlined className="!text-xl  rounded !text-rose-600 !cursor-pointer" />
          </Popconfirm>
        );
      },
    },
  ];

  const handleCalculate = () => {
    setCalc((prev) => !prev);
  };

  // Currency for edit
  useEffect(() => {
    if (edit) return;

    form.setFieldValue(
      "exchangeRate",
      selectedCurrency === selectedToCurrency ? 1 : null,
    );
  }, [selectedCurrency, selectedToCurrency, edit]);

  // sameGroup for disabling credit record in transfer table
  const allTransactions = [
    ...(datasourceTransfer || []),
    ...(datasourceExchange || []),
  ];
  const shouldDisable = (record) => {
    const sameGroup = allTransactions.filter(
      (item) =>
        item.transactionId?.toString() === record.transactionId?.toString(),
    );

    return sameGroup.length === 2 && record.transactionType === "credit";
  };

  // reset fields
  const resetFields = () => {
    form.resetFields();

    setEdit(false);
    setTrId(null);

    setSelectedCurrency("");
    setSelectedToCurrency("");

    setTransactionType("");
    setAmount(0);
    setRate(0);

    setToAccount({
      accountNo: "",
      fullname: "",
    });

    setComission(0);
    setComissionCurrency("");

    setEditTag("");
  };

  // send to Whatsapp
  const sendToWhatsApp = (record) => {
    const customer = users.find(
      (user) => String(user.accountNo) === String(record.accountNo),
    );

    if (!customer?.mobile) {
      toast.error("Customer mobile number not found!");
      return;
    }

    // Remove spaces, brackets, dashes, etc.
    let phone = String(customer.mobile).replace(/\D/g, "");

    // If your database stores US numbers as 10 digits
    if (phone.length === 10) {
      phone = `1${phone}`;
    }

    const message = `
Transaction Receipt

Customer: ${record.fullname || customer.fullname}
Account No: ${record.accountNo}
Transaction No: ${record.transactionNo || "-"}
Transaction ID: ${record.transactionId || "-"}
Date: ${record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm") : "-"}

Transaction: ${record.transaction || "-"}
Type: ${record.transactionType || "-"}
Currency: ${record.currency || "-"}
Amount: ${Number(record.amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}

Details: ${record.details || "-"}
`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(whatsappUrl, "_blank");
  };

  // value validation
  const handleAmountChange = (value) => {
    setAmount(value);

    // Credit and Debit → always allow
    if (!["transfer", "exchange"].includes(transactionType)) {
      return;
    }

    // Empty amount
    if (value === null || value === undefined || value === "") {
      return;
    }

    const customerCurrency = customerCurrencies.find(
      (item) => item.currency === selectedCurrency,
    );

    // No currency/balance record → let the currency validation handle it
    if (!customerCurrency) {
      return;
    }

    const availableBalance = Number(customerCurrency.balance || 0);
    const enteredAmount = Number(value);

    // Amount is within available balance
    if (enteredAmount <= availableBalance) {
      return;
    }

    // =========================
    // EXCHANGE → BLOCK
    // =========================
    if (transactionType === "exchange") {
      Modal.error({
        title: "Insufficient Balance",
        content: (
          <div className="py-2">
            <p className="text-sm text-slate-600">
              The exchange amount exceeds the customer's available balance.
            </p>

            <div className="mt-3 rounded-md bg-slate-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Available Balance</span>

                <strong>
                  {availableBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedCurrency}
                </strong>
              </div>

              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">Requested Amount</span>

                <strong className="text-red-600">
                  {enteredAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedCurrency}
                </strong>
              </div>
            </div>

            <p className="mt-3 mb-0 font-medium text-red-600">
              Exchange cannot be completed.
            </p>
          </div>
        ),
        okText: "OK",
      });

      setAmount(null);

      form.setFieldsValue({
        amount: null,
      });

      return;
    }

    // =========================
    // TRANSFER → CONFIRM
    // =========================
    if (transactionType === "transfer") {
      Modal.confirm({
        title: "Insufficient Balance",
        content: (
          <div className="py-2">
            <p className="text-sm text-slate-600">
              The transfer amount exceeds the customer's available balance.
            </p>

            <div className="mt-3 rounded-md bg-slate-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Available Balance</span>

                <strong>
                  {availableBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedCurrency}
                </strong>
              </div>

              <div className="mt-1 flex justify-between text-sm">
                <span className="text-slate-500">Transfer Amount</span>

                <strong className="text-red-600">
                  {enteredAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedCurrency}
                </strong>
              </div>
            </div>

            <p className="mt-3 mb-0 text-sm text-slate-500">
              Do you want to continue with this transfer?
            </p>
          </div>
        ),
        width: 400,
        okText: "Continue",
        cancelText: "Cancel",

        onOk: () => {
          setAmount(enteredAmount);

          form.setFieldsValue({
            amount: enteredAmount,
          });
        },

        onCancel: () => {
          setAmount(null);

          form.setFieldsValue({
            amount: null,
          });
        },
      });
    }
  };

  // Curency Validation
  const handleCurrencyChange = (val) => {
    // Customer has NO currencies at all
    // → allow currency selection without alert
    if (!customerCurrencies || customerCurrencies.length === 0) {
      setSelectedCurrency(val);

      form.setFieldsValue({
        currency: val,
      });

      return;
    }

    // Customer has currencies → check whether selected currency exists
    const customerCurrency = customerCurrencies.find(
      (item) => item.currency === val,
    );

    // Selected currency is available
    if (customerCurrency) {
      setSelectedCurrency(val);

      form.setFieldsValue({
        currency: val,
      });

      return;
    }

    // Customer has currencies, but NOT the selected currency
    Modal.confirm({
      title: "Currency Not Available",
      content: (
        <div className="py-2">
          <p className="m-0 text-sm text-slate-600">
            This customer does not have a balance in{" "}
            <strong className="text-slate-800">{val}</strong>.
          </p>

          <p className="mt-2 mb-0 text-sm text-slate-500">
            Do you want to continue anyway?
          </p>
        </div>
      ),
      width: 380,
      okText: "Continue",
      cancelText: "Cancel",

      onOk: () => {
        setSelectedCurrency(val);

        form.setFieldsValue({
          currency: val,
        });
      },

      onCancel: () => {
        // Restore previous currency
        form.setFieldsValue({
          currency: selectedCurrency || undefined,
        });
      },
    });
  };
  return (
    <HomeLayout>
      <div className="bg-white p-1 md:p-4">
        {/* Account Selection */}
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            {/* Left */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-300 shadow">
                <BankOutlined className="text-white text-lg" />
              </div>

              <div>
                <p className="text-[10px] !font-semibold !uppercase !tracking-[0.3em] !text-slate-500">
                  Transaction
                </p>

                <h2 className="text-lg !font-bold !leading-none !text-slate-800">
                  Customer Account
                </h2>
              </div>
            </div>

            {/* Search */}
            <div className="w-full xl:max-w-[360px]">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Select
                    allowClear
                    placeholder="🔍 Search customer..."
                    options={accountOptions}
                    className="w-full"
                    value={selectedAccount ?? undefined}
                    showSearch={{
                      optionFilterProp: "label",
                    }}
                    onChange={(value) => {
                      setSelectedAccount(value ?? null);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Customer */}
            {selectedCustomers.map((c) => (
              <div
                key={c._id || c.accountNo}
                className="flex items-center gap-5 xl:ml-auto"
              >
                {/* Profile */}
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={c.profile ? `${API_URL}${c.profile}` : undefined}
                    width={48}
                    height={48}
                    preview={false}
                    className="!h-12 !w-12 flex-shrink-0 rounded-full border-2 border-blue-100 object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <h3
                      className="truncate text-base md:text-lg font-bold text-slate-800"
                      title={c.fullname}
                    >
                      {c.fullname}
                    </h3>

                    <Tag
                      color="blue"
                      className="!mt-1 !rounded-full !px-2 !py-0 !text-xs !font-medium"
                    >
                      #{c.accountNo}
                    </Tag>
                  </div>
                </div>

                {/* Balances */}
                <div className="flex flex-wrap gap-2 !text-2xl">
                  {Object.entries(c.balances || {}).map(
                    ([currency, balance]) => (
                      <Tag
                        key={currency}
                        className={`!flex !items-center !justify-between
                                        !w-full
                                        !min-w-0
                                        !rounded-lg
                                        !px-2 md:!px-3
                                        !py-1
                                        !text-xs md:!text-sm
                                        !font-medium
                                        !border
                                        transition-all duration-200
                                        ${
                                          selectedCurrency === currency
                                            ? Number(balance) < 0
                                              ? "!bg-red-600 !text-white !border-red-600"
                                              : "!bg-blue-600 !text-white !border-blue-600"
                                            : Number(balance) < 0
                                              ? "!bg-red-50 !text-red-600 !border-red-300 hover:!bg-red-100"
                                              : "!bg-blue-50 !text-blue-700 !border-blue-300 hover:!bg-blue-100"
                                        }`}
                        onClick={() => {
                          setSelectedCurrency(currency);
                          form.setFieldsValue({ currency });
                        }}
                      >
                        <span className="font-semibold">{currency}</span>

                        <span className="ml-2 truncate text-right">
                          {Number(balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </Tag>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className=" p-3">
          {/* Form */}
          <div className="mx-auto max-w-[1450px] rounded-xl bg-white border border-zinc-300 shadow-lg p-5 !bg-slate-50 ">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-5 ">
              <div>
                <h2 className="text-xl font-bold text-blue-800">
                  New Transaction
                </h2>
                <p className="text-sm text-slate-500">
                  Customer & Transaction Details
                </p>
              </div>

              <Space>
                <div className="flex items-center gap-3 p-2 !bg-slate-50">
                  <Button
                    type="text"
                    onClick={handleCalculate}
                    className="group !flex !h-8 !w-8 !items-center !justify-center
                          !rounded-sm !border !border-blue-100 !bg-white
                          !text-slate-700 !shadow-sm transition-all duration-300
                          hover:!border-blue-500
                          hover:!bg-gradient-to-br
                          hover:!from-blue-500
                          hover:!to-indigo-600
                          hover:!text-white"
                  >
                    <SwapOutlined className="!text-xl transition-transform duration-300 group-hover:rotate-180" />
                  </Button>

                  <Button
                    type="text"
                    onClick={() => setOpen(true)}
                    className="group !flex !h-8 !w-8 !items-center !justify-center
                          !rounded-sm !border !border-emerald-100 !bg-white
                          !text-slate-700 !shadow-sm transition-all duration-300
                          hover:!border-emerald-500
                          hover:!bg-gradient-to-br
                          hover:!from-emerald-500
                          hover:!to-teal-600
                          hover:!text-white"
                  >
                    <PrinterOutlined className="!text-xl transition-transform duration-300 group-hover:scale-110" />
                  </Button>
                  <Button
                    type="text"
                    onClick={resetFields}
                    className="group !flex !h-8 !w-8 !items-center !justify-center
                    !rounded-sm !border !border-emerald-100 !bg-white
                    !text-blue-700 !shadow-sm transition-all duration-300
                    hover:!border-emerald-500
                    hover:!bg-gradient-to-br
                    hover:!from-emerald-500
                    hover:!to-teal-600
                    hover:!text-white"
                  >
                    <ReloadOutlined className="!text-xl transition-transform duration-300 group-hover:rotate-180" />
                  </Button>
                </div>
              </Space>
            </div>

            {/* Customer */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Customer Information
              </h3>

              <Form
                form={form}
                layout="vertical"
                onFinish={edit ? onUpdate : onFinish}
                initialValues={{ finalAmount: 0 }}
                className="rounded-xl bg-white p-5"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 gap-x-1 gap-y-0 !bg-slate-50">
                  <Form.Item
                    size="small"
                    name="fullname"
                    label={
                      <span className="font-semibold text-slate-700">
                        Full Name
                      </span>
                    }
                    rules={[{ required: true, message: "Enter full name" }]}
                    className="xl:col-span-2"
                  >
                    <Input
                      placeholder="Full Name"
                      className="!rounded-sm !border-slate-300 hover:!border-blue-500 focus:!border-blue-500"
                    />
                  </Form.Item>
                  {/* Acc No */}
                  <Form.Item
                    name="accountNo"
                    label={
                      <span className="font-semibold text-slate-700">
                        Acc No
                      </span>
                    }
                    rules={[
                      { required: true, message: "Enter account number" },
                    ]}
                    className="xl:col-span-1"
                  >
                    <InputNumber
                      placeholder="Acc No"
                      className="!w-full !rounded-sm"
                    />
                  </Form.Item>

                  {/* Transaction */}
                  <Form.Item
                    name="transaction"
                    label={
                      <span className="font-semibold text-slate-700">
                        Transaction
                      </span>
                    }
                    rules={[{ required: true }]}
                    className="xl:col-span-1"
                  >
                    <Select
                      placeholder="Transaction"
                      onChange={(val) => {
                        setTransactionType(val);

                        if (val === "exchange" && selectedAccount) {
                          const customer = users.find(
                            (c) =>
                              String(c.accountNo) === String(selectedAccount),
                          );

                          if (customer) {
                            setToAccount({
                              accountNo: customer.accountNo,
                              fullname: customer.fullname,
                            });

                            setSelectedToCurrency(customer.currency);

                            form.setFieldsValue({
                              to: customer.accountNo,
                              tocurrency: customer.currency,
                            });
                          }
                        } else {
                          // Transaction and Transfer should always clear receiver fields
                          setToAccount({
                            accountNo: "",
                            fullname: "",
                          });

                          setSelectedToCurrency("");

                          form.setFieldsValue({
                            to: undefined,
                            tocurrency: undefined,
                          });
                        }
                      }}
                      className="!rounded-sm"
                    >
                      <Option value="transaction">Transaction</Option>
                      <Option value="transfer">Transfer</Option>
                      <Option value="exchange">Exchange</Option>
                    </Select>
                  </Form.Item>
                  {/* currency */}
                  <Form.Item
                    name="currency"
                    label={
                      <span className="font-semibold text-slate-700">
                        Currency
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Select currency",
                      },
                    ]}
                    className="xl:col-span-1"
                  >
                    <Select
                      placeholder="Currency"
                      onChange={handleCurrencyChange}
                      className="!rounded-sm"
                    >
                      {currencies.map((c) => (
                        <Select.Option key={c.currency} value={c.currency}>
                          {c.currency}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Amount */}
                  <Form.Item
                    name="amount"
                    label={
                      <span className="font-semibold text-slate-700">
                        Amount
                      </span>
                    }
                    rules={[{ required: true }]}
                    className="xl:col-span-1"
                  >
                    <InputNumber
                      placeholder="Amount"
                      className="!w-full !rounded-sm !font-semibold"
                      onChange={handleAmountChange}
                    />
                  </Form.Item>

                  {/* Transaction type */}
                  {transactionType === "transaction" && (
                    <Form.Item
                      name="transactionType"
                      label={
                        <span className="font-semibold text-slate-700">
                          Transaction Type
                        </span>
                      }
                      rules={[{ required: true }]}
                      className="xl:col-span-1"
                    >
                      <Select
                        placeholder="Transaction Type"
                        className="!rounded-sm"
                      >
                        <Option value="credit">Credit</Option>
                        <Option value="debit">Debit</Option>
                      </Select>
                    </Form.Item>
                  )}

                  {/* to & tocur */}
                  {(transactionType === "transfer" ||
                    transactionType === "exchange") && (
                    <>
                      <div className="col-span-1">
                        <Form.Item
                          name="to"
                          label={
                            <span className="font-semibold text-slate-700">
                              To Account
                            </span>
                          }
                        >
                          <Select
                            showSearch
                            options={accountOptions}
                            placeholder="Select Account"
                            filterOption={(input, option) =>
                              option?.label
                                ?.toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            onChange={(accountNo) => {
                              const customer = users.find(
                                (c) =>
                                  String(c.accountNo) === String(accountNo),
                              );

                              if (customer) {
                                setToAccount({
                                  accountNo: customer.accountNo,
                                  fullname: customer.fullname,
                                });

                                setSelectedToCurrency(customer.currency);

                                form.setFieldsValue({
                                  to: customer.accountNo,
                                  tocurrency: customer.currency,
                                });
                              }
                            }}
                            className="!rounded-sm"
                          />
                        </Form.Item>
                      </div>

                      <div className="col-span-1">
                        <Form.Item
                          name="tocurrency"
                          label={
                            <span className="font-semibold text-slate-700">
                              To Currency
                            </span>
                          }
                          rules={[
                            {
                              required: true,
                              message: "Select currency",
                            },
                          ]}
                          className="!mb-0"
                        >
                          <Select
                            placeholder="Currency"
                            onChange={(val) => setSelectedToCurrency(val)}
                            className="!rounded-sm"
                          >
                            {currencies.map((c) => (
                              <Select.Option
                                key={c.currency}
                                value={c.currency}
                              >
                                {c.currency}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                    </>
                  )}

                  {/* Exchange */}
                  <Form.Item
                    name="exchangeRate"
                    label={
                      <span className="font-semibold text-slate-700">
                        Exchange Rate
                      </span>
                    }
                    className="xl:col-span-1"
                    rules={
                      transactionType === "transfer" ||
                      transactionType === "exchange"
                        ? [{ required: true, message: "Rate is required" }]
                        : []
                    }
                  >
                    <InputNumber
                      placeholder="Rate"
                      onChange={(value) => setRate(value)}
                      className="!w-full !rounded-sm"
                    />
                  </Form.Item>

                  {/* ex amt */}

                  <Form.Item
                    name="finalAmount"
                    className="!mb-0"
                    label={
                      <span className="font-semibold text-slate-700">
                        Exchanged Amt
                      </span>
                    }
                  >
                    <InputNumber
                      disabled
                      controls={false}
                      formatter={(value) => `${Number(value || 0).toFixed(2)}`}
                      parser={(value) => parseFloat(value)}
                      className="!w-full final-amount-input"
                    />
                  </Form.Item>

                  {/* transaction id */}
                  <Form.Item
                    name="transactionId"
                    label={
                      <span className="font-semibold text-slate-700">
                        Transaction ID
                      </span>
                    }
                    rules={[{ required: true }]}
                    className="xl-col-span-1"
                  >
                    <Input
                      placeholder="Transaction ID"
                      className="!rounded-sm"
                      readOnly
                    />
                  </Form.Item>

                  {/* transaction no */}
                  <Form.Item
                    name="transactionNo"
                    label={
                      <span className="font-semibold text-slate-700">
                        Daily No
                      </span>
                    }
                    rules={[{ required: true }]}
                    className="xl:col-span-1"
                  >
                    <Input
                      placeholder="Transaction Daily No"
                      className="!rounded-sm"
                    />
                  </Form.Item>

                  {/* hawala no */}
                  <Form.Item
                    name="transferNo"
                    label={
                      <span className="font-semibold text-slate-700">
                        Transfer No
                      </span>
                    }
                    className="xl:col-span-1"
                  >
                    <Input placeholder="Transfer No" className="!rounded-sm" />
                  </Form.Item>

                  {/* Comission */}
                  <Form.Item
                    name="comission"
                    label={
                      <span className="font-semibold text-slate-700">
                        Commission Fee
                      </span>
                    }
                    className="xl-col-span-1"
                  >
                    <InputNumber
                      placeholder="Fee"
                      className="!w-full !rounded-sm"
                      onChange={(value) => setComission(value)}
                    />
                  </Form.Item>
                  {/* currency */}
                  <Form.Item
                    name="comission_currency"
                    label={
                      <span className="font-semibold text-slate-700">
                        Currency
                      </span>
                    }
                    className="!mb-0"
                  >
                    <Select
                      placeholder="Currency"
                      onChange={(val) => setComissionCurrency(val)}
                      className="!rounded-sm"
                    >
                      {currencies.map((c) => (
                        <Select.Option key={c.currency} value={c.currency}>
                          {c.currency}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                {/* Notes */}

                <div className="!bg-slate-50">
                  <h3 className="mb-1 py-2 text-sm font-semibold  tracking-wider text-slate-500 ">
                    Transaction Details
                  </h3>

                  <Form.Item name="details" className="!mb-0 ">
                    <Input.TextArea
                      rows={3}
                      placeholder="Write additional details..."
                      className="!rounded-sm !border-slate-300"
                    />
                  </Form.Item>
                </div>

                <Row
                  gutter={[16, 16]}
                  align="middle"
                  className="!pt-4 !bg-slate-50"
                >
                  <Col flex="auto">
                    <Space size="middle">
                      <Form.Item name="document" className="!mb-0">
                        <Upload
                          accept=".pdf,image/*"
                          maxCount={1}
                          fileList={scannedDoc ? [scannedDoc] : []}
                          beforeUpload={(file) => {
                            setScannedDoc(file);
                            return false;
                          }}
                          onRemove={() => setScannedDoc(null)}
                        >
                          <Button
                            size="small"
                            icon={<PaperClipOutlined />}
                            className="!h-11 !rounded-sm !border-slate-400 !bg-white !px-5 !font-semibold !text-slate-700 !shadow-sm transition-all duration-300 hover:!-translate-y-0.5 hover:!border-blue-500 hover:!text-blue-600 hover:!shadow-md"
                          >
                            Documents
                          </Button>
                        </Upload>
                      </Form.Item>

                      <Button
                        size="small"
                        onClick={() => setOpenModal(true)}
                        className="!flex !h-11 !items-center !justify-center !rounded-sm !border-0 !bg-gradient-to-r !from-blue-400 !to-cyan-500 !px-5 !font-semibold !text-white !shadow-md transition-all duration-300 hover:!-translate-y-0.5 hover:!shadow-xl"
                      >
                        <CameraOutlined className="!text-lg" />
                        <SignatureOutlined className="!text-lg" />
                      </Button>
                    </Space>
                  </Col>

                  <Col flex="1">
                    <Button
                      htmlType="submit"
                      size="small"
                      icon={<SaveOutlined />}
                      className={`!w-full !h-11 !rounded-sm !border-0 !text-white ${
                        edit
                          ? "!bg-gradient-to-r !from-orange-500 !to-amber-500"
                          : "!bg-gradient-to-r !from-blue-400 !to-cyan-400"
                      }`}
                    >
                      {edit ? "Update Transaction" : "Save Transaction"}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </div>

        <div className="p-2 border-t border-dashed mt-5 border-blue-400">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-xl font-semibold text-slate-700">
              Transaction History
            </h1>

            <div className="flex flex-wrap items-center gap-2 ">
              <Input.Search
                placeholder="Search transactions..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!w-72 !border-lg border-blue-500"
              />

              <DatePicker
                placeholder="From"
                value={fromDate}
                onChange={setFromDate}
                format="DD-MM-YYYY"
              />

              <DatePicker
                placeholder="To"
                value={toDate}
                onChange={setToDate}
                format="DD-MM-YYYY"
              />

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Search
              </Button>

              <Button icon={<ClearOutlined />} onClick={handleClear}>
                Clear
              </Button>

              <Button
                onClick={() => setShowIsPassed(!showIsPassed)}
                className={`!border-0 !text-white
                  ${
                    showIsPassed
                      ? "!bg-gradient-to-r !from-indigo-600 !to-violet-600"
                      : "!bg-gradient-to-r !from-blue-600 !to-cyan-600"
                  }`}
              >
                {showIsPassed ? "Passed" : "Pending"}
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={printTransactionHistory}
                className="
                  !border-blue-300
                  !text-blue-700
                  hover:!border-blue-500
                  hover:!bg-blue-50
                  hover:!text-blue-800
                "
              >
                Print
              </Button>

              <Button
                icon={<FileTextOutlined />}
                onClick={exportTransactionHistoryToExcel}
                className="
                  !border-emerald-300
                  !text-emerald-700
                  hover:!border-emerald-500
                  hover:!bg-emerald-50
                  hover:!text-emerald-800
                "
              >
                Excel
              </Button>
            </div>
          </div>
          <Tabs
            activeKey={activeHistoryTab}
            onChange={(key) => {
              setActiveHistoryTab(key);
              setHistoryPage(1);
            }}
            size="small"
            animated
            tabBarGutter={2}
            className="money-tabs mb-9"
            items={[
              {
                key: "1",
                label: (
                  <span className="flex items-center gap-2 font-medium !bg-gradient-to-r !from-slate-400 !to-zinc-400 p-2 text-white hover:bg-indigo-300 rounded-md ">
                    <BookOutlined />
                    Transactions
                  </span>
                ),
                children: (
                  <div className="pb-20">
                    <Table
                      rowKey="_id"
                      columns={columns}
                      dataSource={filterData(datasource || [])}
                      bordered
                      sticky
                      size="small"
                      locale={{
                        emptyText: (
                          <Empty
                            description={
                              <div className="py-2">
                                <h3 className="text-lg font-semibold text-rose-700">
                                  {searchText
                                    ? "No Results Found"
                                    : "No Data Available"}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  {searchText
                                    ? `No transaction records match "${searchText}".`
                                    : "There are no transaction records to display."}
                                </p>
                              </div>
                            }
                          />
                        ),
                      }}
                      pagination={{
                        current: historyPage,
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
                        onChange: (page) => setHistoryPage(page),
                      }}
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                ),
              },
              {
                key: "2",
                label: (
                  <span className="flex items-center gap-2 font-medium !bg-gradient-to-r !from-slate-400 !to-zinc-400 p-2 text-white rounded-md ">
                    <DollarCircleOutlined />
                    Transfers
                  </span>
                ),
                children: (
                  <div className="pb-15">
                    <Table
                      rowKey="_id"
                      columns={columns}
                      dataSource={filterData(datasourceTransfer || [])}
                      bordered
                      sticky
                      size="small"
                      locale={{
                        emptyText: (
                          <Empty
                            description={
                              <div className="py-2">
                                <h3 className="text-lg font-semibold text-rose-700">
                                  {search
                                    ? "No Results Found"
                                    : "No Data Available"}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  {search
                                    ? `No transfer records match "${search}".`
                                    : "There are no transfer records to display."}
                                </p>
                              </div>
                            }
                          />
                        ),
                      }}
                      pagination={{
                        current: historyPage,
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
                        onChange: (page) => setHistoryPage(page),
                      }}
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                ),
              },
              {
                key: "3",
                label: (
                  <span className="flex items-center gap-2 font-medium !bg-gradient-to-r  !from-slate-400 !to-zinc-400 p-2 text-white rounded-md ">
                    <SwapOutlined />
                    Exchanges
                  </span>
                ),
                children: (
                  <div className="pb-15">
                    <Table
                      rowKey="_id"
                      columns={columns}
                      dataSource={filterData(datasourceExchange || [])}
                      bordered
                      sticky
                      size="small"
                      locale={{
                        emptyText: (
                          <Empty
                            description={
                              <div className="py-2">
                                <h3 className="text-lg font-semibold text-cyan-700">
                                  {searchText
                                    ? "No Results Found"
                                    : "No Data Available"}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  {searchText
                                    ? `No transaction records match "${searchText}".`
                                    : "There are no transaction records to display."}
                                </p>
                              </div>
                            }
                          />
                        ),
                      }}
                      pagination={{
                        current: historyPage,
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
                        onChange: (page) => setHistoryPage(page),
                      }}
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Account Statement Modal */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={560}
        destroyOnClose={false}
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
          body: {
            padding: 0,
          },
        }}
      >
        <div className="bg-white">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <FileTextOutlined className="text-lg text-white" />
              </div>

              {/* Title */}
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

          {/* Form */}
          <div className="px-6 py-5">
            <Form
              form={statementForm}
              layout="vertical"
              onFinish={prepareStatement}
            >
              {/* Account */}
              <Form.Item
                name="account"
                label={
                  <span className="text-sm font-medium text-slate-700">
                    Account
                  </span>
                }
                className="!mb-4"
              >
                <Select
                  showSearch
                  allowClear
                  size="large"
                  options={accountOptions}
                  placeholder="Select account"
                  onChange={(value, option) => {
                    setStAcc(value);
                    setStName(option?.fullname || "");
                  }}
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                  className="statement-select"
                />
              </Form.Item>

              {/* Currency */}
              <Form.Item
                name="currency"
                label={
                  <span className="text-sm font-medium text-slate-700">
                    Currency
                  </span>
                }
                className="!mb-4"
              >
                <Select allowClear size="large" placeholder="Select currency">
                  {filteredCurrencies.map((cur) => (
                    <Select.Option key={cur} value={cur}>
                      {cur}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Date Range */}
              <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarOutlined className="text-blue-600" />

                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Date Range
                  </span>

                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Form.Item
                    name="fromDate"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        From Date
                      </span>
                    }
                    className="!mb-0"
                  >
                    <DatePicker
                      size="large"
                      format="DD-MM-YYYY"
                      placeholder="Start date"
                      className="!w-full"
                    />
                  </Form.Item>

                  <Form.Item
                    name="toDate"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        To Date
                      </span>
                    }
                    className="!mb-0"
                  >
                    <DatePicker
                      size="large"
                      format="DD-MM-YYYY"
                      placeholder="End date"
                      className="!w-full"
                    />
                  </Form.Item>
                </div>
              </div>

              {statementChecked && resultText && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-center">
                  <span className="text-sm font-medium text-red-600">
                    No transactions found for the selected filters.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Print */}
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PrinterOutlined />}
                  size="large"
                  className="
                    !h-11
                    !rounded-lg
                    !border-0
                    !bg-blue-600
                    !font-medium
                    !shadow-sm
                    hover:!bg-blue-700
                  "
                >
                  Print Statement
                </Button>

                {/* Excel */}
                <Button
                  type="default"
                  icon={<FileTextOutlined />}
                  size="large"
                  onClick={() => {
                    const values = statementForm.getFieldsValue();
                    exportStatementToExcel(values);
                  }}
                  className="
                      !h-11
                      !rounded-lg
                      !border-emerald-300
                      !font-medium
                      !text-emerald-700
                      hover:!border-emerald-500
                      hover:!bg-emerald-50
                      hover:!text-emerald-800
                    "
                >
                  Export to Excel
                </Button>
              </div>

              {/* Footer hint */}
              <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                <span className="text-[11px] text-slate-400">
                  Select an account or currency to generate the statement
                </span>
              </div>
            </Form>
          </div>
        </div>
      </Modal>

      {/* Image and Signature Modal */}
      <Modal
        footer={null}
        width={1100}
        centered
        open={openModal}
        onCancel={() => setOpenModal(false)}
        className="shadow-lg"
        title={
          <div className="text-center">
            <h2 className="text-xl font-bold text-rose-700">
              Capture Photo & Signature
            </h2>
            <p className="text-zinc-500 text-sm">Customer Verification</p>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signature Section */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-md p-4">
            <h3 className="font-semibold text-zinc-700 !mb-2">Signature</h3>

            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 500,
                height: 220,
                className:
                  "w-full bg-white rounded-xl border-2 border-zinc-200",
              }}
            />

            <div className="flex justify-center gap-3 mt-4">
              <Button
                type="primary"
                onClick={saveSignature}
                icon={<SaveOutlined />}
              >
                Save
              </Button>

              <Button danger onClick={clearSignature} icon={<ClearOutlined />}>
                Clear
              </Button>

              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleSignatureUpload}
              >
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </div>

            {signatureImage && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Signature Preview</h4>

                <img
                  src={URL.createObjectURL(signatureImage)}
                  alt="Signature"
                  className="w-full h-56 object-contain bg-zinc-50 rounded-xl border"
                />
              </div>
            )}
          </div>

          {/* Camera Section */}
          <div className="flex flex-col justify-center items-center bg-white rounded-2xl border border-zinc-200 shadow-md p-4">
            <div className="flex justify-between items-center !mb-2">
              <h3 className="font-semibold text-zinc-700">Photo Capture</h3>

              <Button
                type="text"
                size="small"
                onClick={() => setWebcamActive((prev) => !prev)}
              >
                {webcamActive ? (
                  <StopOutlined className="text-rose-600 text-xl" />
                ) : (
                  <VideoCameraAddOutlined className="text-green-600 text-xl" />
                )}
              </Button>
            </div>

            {webcamActive && (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "user",
                  }}
                  onUserMedia={() => console.log("Camera ready")}
                  onUserMediaError={(err) => {
                    console.log(err);
                    message.error("Cannot access camera");
                  }}
                  className="w-56 h-56 rounded-xl border-4 border-zinc-200 object-cover"
                />

                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    type="primary"
                    onClick={capturePhoto}
                    disabled={!webcamActive}
                    icon={<CameraOutlined />}
                  >
                    Capture
                  </Button>

                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </div>
              </>
            )}

            {capturedImage && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Photo Preview</h4>

                <img
                  src={URL.createObjectURL(capturedImage)}
                  alt="Captured"
                  className="w-56 h-56 object-cover rounded-xl border"
                />
              </div>
            )}
          </div>
        </div>
        <div className="p-2 w-full text-right ">
          {signatureImage || capturedImage ? (
            <Button
              size="small"
              icon={<UploadOutlined />}
              className="!h-14 !px-8 !border-2 !border-dashed !text-rose-500 !border-rose-500 hover:!border-indigo-600 hover:!text-indigo-600 hover:!bg-indigo-100 transition-all duration-300 rounded-xl"
              onClick={() => setOpenModal(false)}
            >
              Add Signature / Image
            </Button>
          ) : (
            ""
          )}
        </div>
      </Modal>

      {/* Statement ref */}
      <div
        id="account-statement-print"
        className="print-only-container"
        ref={statementRef}
      >
        {statementData && (
          <div className="statement-print-root">
            <AccountStatement
              logo={logo}
              brand={myBrand}
              branch={statementData.branch}
              account={statementData.account}
              accountHolder={statementData.accountHolder}
              currency={statementData.currency}
              fromDate={statementData.fromDate}
              toDate={statementData.toDate}
              overallTotals={statementData.overallTotals}
              currentBalance={statementData.currentBalance}
              statementTotals={statementData.statementTotals}
              statementBalance={statementData.statementBalance}
              rows={statementData.rows}
            />
          </div>
        )}
      </div>

      {/* transaction record ref */}
      <div
        id="transaction-receipt-print"
        className="receipt-print-container"
        ref={receiptRef}
      >
        {receiptData && (
          <div className="receipt-print-root">
            <TransactionReceipt
              logo={logo}
              brand={myBrand}
              branch={myBranch}
              transaction={receiptData.transaction}
            />
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default Transactions;
