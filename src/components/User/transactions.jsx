import React, { useState, useRef, useEffect } from "react";
import "./transactions.css";
import jsPDF from "jspdf";

import html2canvas from "html2canvas";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Upload,
  message,
  Card,
  Divider,
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
  AccountBookFilled,
  BankOutlined,
  BookOutlined,
  CameraFilled,
  CameraOutlined,
  CameraTwoTone,
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  DollarCircleTwoTone,
  DollarTwoTone,
  EditOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PayCircleOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
  SignatureOutlined,
  StopOutlined,
  SwapOutlined,
  TransactionOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import Webcam from "react-webcam";
import { toast } from "react-toastify";
import { useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const myBrand = JSON.parse(localStorage.getItem("branding"));
const myLogo = `${import.meta.env.VITE_ENDPOINT}${myBrand?.data?.[0]?.logo || ""}`;

import { http, fetcher } from "../Modules/http";
import { fetchTransaction } from "../../redux/slices/transactionSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";
import { fetchUsers } from "../../redux/slices/customerSlice";
import { fetchCurrency } from "../../redux/slices/currencySlice";
import { fetchBranch } from "../../redux/slices/branchSlice";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;

const Transactions = () => {
  const topRef = useRef(null);
  //states
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedToCurrency, setSelectedToCurrency] = useState("");
  const [form] = Form.useForm();
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
  const [comission, setComission] = useState(null);
  const [comissionCurrency, setComissionCurrency] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // data search for main table
  const [showIsPassed, setShowIsPassed] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  //account statement states
  const [stAcc, setStAcc] = useState(null);
  const [stCurrency, setStCurrency] = useState(null);
  const [stName, setStName] = useState(null);
  const [selectedTr, setSelectedTr] = useState("");
  const [stCur, setStCur] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [resultText, setResultText] = useState("");
  const [editTag, setEditTag] = useState("");
  const httpReq = http();

  const dispatch = useDispatch();

  //getting data from redux
  const { transactions, loading, error } = useSelector(
    (state) => state.transactions,
  );

  //getting user from localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const myUser = userInfo.fullname;
  const myBranch = userInfo?.branch;
  const myBrand = JSON.parse(localStorage.getItem("branding"));

  const { users, uLoading, uError } = useSelector((state) => state.users);
  const { currencies, cLoading, cError } = useSelector(
    (state) => state.currencies,
  );
  const { branches, bLoading, bError } = useSelector((state) => state.branches);

  useEffect(() => {
    dispatch(fetchTransaction());
    dispatch(fetchUsers());
    dispatch(fetchCurrency());
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

  // Final filtered data
  const finalResult = accountFiltered.filter((t) => {
    if (selectedCurrency && t.currency !== selectedCurrency) {
      return false;
    }

    const d = new Date(t.createdAt);

    // FROM
    if (fromDate) {
      const start = new Date(fromDate + "T00:00:00");

      if (d < start) return false;
    }

    // TO
    if (toDate) {
      const end = new Date(toDate + "T23:59:59.999");

      if (d > end) return false;
    }

    return true;
  });

  // print statement
  const printStatement = (values) => {
    const { account, currency, fromDate, toDate } = values;

    // 🔹 1. Filter by account
    let result = transactions.filter(
      (t) => String(t.accountNo) === String(account),
    );

    // 🔹 2. Filter by currency
    if (currency) {
      result = result.filter((t) => t.currency === currency);
    }

    // 🔹 3. Filter by date
    if (fromDate || toDate) {
      result = result.filter((t) => {
        const tx = dayjs(t.createdAt);

        if (fromDate && tx.isBefore(fromDate, "day")) {
          return false;
        }

        if (toDate && tx.isAfter(toDate, "day")) {
          return false;
        }

        return true;
      });
    }

    // 🔹 4. Handle empty
    if (result.length === 0) {
      setResultText("No data to display");
      toast.error("No transactions found for the selected date range.");
      return;
    }

    // 🔥 5. SORT (IMPORTANT for running balance)
    const sorted = [...result].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    //  6. Running balance per currency
    let runningBalances = {};

    const rowsHTML = sorted
      .map((t, i) => {
        const cur = t.currency;
        const amount = Number(t.amount) || 0;

        if (!runningBalances[cur]) runningBalances[cur] = 0;

        if (t.transactionType === "credit") {
          runningBalances[cur] += amount;
        } else {
          runningBalances[cur] -= amount;
        }

        return `
        <tr>
          <td>${i + 1}</td>
          <td style="white-space:nowrap;">${new dayjs(t.createdAt).format("DD-MM-YYYY")}</td>
          <td style="color:${t.transactionType === "credit" ? "green" : "red"}">
            ${t.transactionType}
          </td>
          <td>${t.details || "-"}</td>
          <td>${amount.toFixed(2)}</td>
          <td><strong>${runningBalances[cur].toFixed(2)}</strong></td>
        </tr>
      `;
      })
      .join("");

    //  7. Total balances per currency
    const totals = {};
    sorted.forEach((t) => {
      const cur = t.currency;
      const amount = Number(t.amount) || 0;

      if (!totals[cur]) totals[cur] = 0;

      if (t.transactionType === "credit") {
        totals[cur] += amount;
      } else {
        totals[cur] -= amount;
      }
    });

    // total current balance

    const currentTotals = {};

    transactions
      .filter((t) => {
        if (String(t.accountNo) !== String(account)) return false;
        if (currency && t.currency !== currency) return false;
        return true;
      })
      .forEach((t) => {
        const cur = t.currency;
        const amount = Number(t.amount) || 0;

        if (!currentTotals[cur]) currentTotals[cur] = 0;

        if (t.transactionType === "credit") {
          currentTotals[cur] += amount;
        } else {
          currentTotals[cur] -= amount;
        }
      });

    const currentBalanceHTML = Object.entries(currentTotals)
      .map(
        ([cur, bal]) => `
      <div>
        <strong>${cur}: ${bal.toFixed(2)}</strong>
      </div>
    `,
      )
      .join("");

    const balanceHTML = Object.entries(totals)
      .map(
        ([cur, bal]) => `
      <div >
        <strong>${bal.toFixed(2)}</strong>
      </div>
    `,
      )
      .join("");

    //  8. Print window
    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
      <head>
        <title>Account Statement</title>

        <style>
          *{
            box-sizing:border-box;
          }

          body{
            margin:0;
            padding:30px;
            background:white;
            font-family:Arial, sans-serif;
            color:#1e293b;
          }

          .container{
            max-width:1000px;
            margin:auto;
            background:#fff;
            overflow:hidden;
          
          }

          .topbar{
            height:0px;

          }

        .header{
        padding:15px 15px 10px;
        border-bottom:1px solid #e5e7eb;
        text-align:center;
      }

      .brand{
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:10px;
      }

      .logo{
        width:75px;
        height:75px;
        border-radius:50%;
        overflow:hidden;
        border:3px solid #dbeafe;
      }

      .logo img{
        width:100%;
        height:100%;
        object-fit:cover;
      }

        .brand-info h1{
            margin:0;
            font-size:24px;
            color:#113b8a;
          }

        .brand-info p{
          margin:3px 0;
          color:#64748b;
          font-size:13px;
        }

        .statement-title{
        margin-top:8px;
        display:inline-block;
        background:#113b8a;
        color:white;
        padding:6px 16px;
        border-radius:30px;
        font-size:12px;
        font-weight:bold;
        letter-spacing:1px;
      }

          .info-section{
            padding:10px 20px;
            display:flex;

            flex-direction:column;
            grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
            gap:10px;
            background:white;
          
          }

          .info-card{
            background:white;
        
          }

          .info-label{
            font-size:12px;
            color:#64748b;
            margin-bottom:5px;
            text-transform:uppercase;
            letter-spacing:1px;
          }

          .info-value{
            font-size:16px;
            font-weight:600;
            color:#0f172a;
          }

          .section{
            padding:30px;
          }

          .section-title{
            font-size:20px;
            margin-bottom:20px;
            color:#113b8a;
            padding:2px;
            border-bottom:3px solid #e5e7eb;
          }

          .balances{
            display:flex;
            flex-wrap:wrap;
            gap:15px;
          }

          .balance-card{
            background:linear-gradient(
              135deg,
              #113b8a,
              #1d4ed8
            );
            color:white;
            padding:2px;
        
          }

          .balance-card span{
            display:block;
            font-size:13px;
            opacity:0.1;
            margin-bottom:8px;
          }

          .balance-card strong{
            font-size:18px;
          }

          table{
            width:100%;
            border-collapse:collapse;
            overflow:hidden;
            border-radius:12px;
          }

          thead{
            background:#66666138;
            color:#113b8a;
          }

          th{
            padding:14px;
            font-size:13px;
            text-align:left;
            letter-spacing:0.5px;
          }

          td{
            padding:14px;
            border-bottom:1px solid #e5e7eb;
            font-size:14px;
          }

          tbody tr:nth-child(even){
            background:#f8fafc;
          }

          tbody tr:hover{
            background:#eef4ff;
          }

          .credit{
            color:#16a34a;
            font-weight:600;
            text-transform:capitalize;
          }

          .debit{
            color:#dc2626;
            font-weight:600;
            text-transform:capitalize;
          }

          .footer{
            padding:20px 30px;
            text-align:center;
            font-size:12px;
            color:#94a3b8;
            border-top:1px solid #e5e7eb;
          }

          @media print{
            body{
              background:white;
              padding:0;
            }

            .container{
              box-shadow:none;
            }
          }

        </style>
      </head>

      <body>

      <div class="container" id="statement-content">
        <div class="topbar"></div>
        <div class="header">
          <div class="brand">     
            <div style="
                      width:150px;
                      height:105px;
                      border-radius:0;
                      overflow:hidden;
                      margin:0 auto;
                    ">
                      <img
                        src="${myLogo}"
                        alt="logo"
                        style="width:150px ;heigth:100px;object-fit:cover;display:block;"
                      />
                    </div>
                  </div>

            <div class="brand-info">
              <h1>${myBrand.data[0].companyName}</h1>

              <p>
                ${
                  myBrand.data[0].address
                    ? myBrand.data[0].address.charAt(0).toUpperCase() +
                      myBrand.data[0].address.slice(1)
                    : ""
                } - ${myBranch} Branch
              </p>

              <p>
                ${myBrand.data[0].mobile}
                |
                ${myBrand.data[0].email}
              </p>

              <div class="statement-title">
                ACCOUNT STATEMENT
              </div>
            </div>

          </div>

        </div>

        <div class="info-section">
          <div class="info-card">
                <div class="info-label">Date Range</div>
                <div class="info-value">
                  ${fromDate ? fromDate.format("DD-MM-YYYY") : "-"}
                  →
                  ${toDate ? toDate.format("DD-MM-YYYY") : "-"}
          </div>
          </div>
          <div class="info-card">
            <div class="info-label">Account</div>
            <div class="info-value">${account}</div>
            <div class="info-label">Account Holder</div>
            <div class="info-value">${(stName && stName) || "-"}</div>
          </div>

          <div class="info-card">
         

            <div style="height:10px"></div>

            <div class="info-label">Acc Current Balance</div>
            <div style="display:flex;align-items:center;gap:10px;">
              ${currency || "All"} ${currentBalanceHTML}
            </div>
          </div>
          
        
        

        </div>

        

        <div class="section">

          <div class="section-title">
            Transaction History
          </div>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Transaction</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHTML}
            </tbody>

          </table>

        </div>
      <div class="balances" style="display:flex; align-items:center;gap:10px; justify-content:end; padding-right:85px">
      <p>Current Balance</p>${currency || "All"} ${balanceHTML}

          </div>

        <div class="footer">
          Generated on 
          ${dayjs().format("DD-MM-YYYY hh:mm A")}
        </div>

      </div>

      </body>
      </html>
      `);

    // printWindow.document.close();

    printWindow.onload(async () => {
      const element = printWindow.document.getElementById("statement-content");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();

      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;

      let position = 0;

      // FIRST PAGE
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

      heightLeft -= pdfHeight;

      // EXTRA PAGES
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

        heightLeft -= pdfHeight;
      }

      // PAGE NUMBERS
      const totalPages = pdf.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        pdf.setFontSize(10);

        pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - 40, pdfHeight - 10);
      }

      pdf.save(`statement-${account}.pdf`);

      // printWindow.close();
    });
  };

  //end of statement filter

  //Data source
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
    if (selectedAccount) {
      const accountCustomers = users.filter(
        (c) => c.accountNo === selectedAccount,
      );
      if (accountCustomers.length > 0) {
        const customer = accountCustomers[0];
        form.setFieldsValue({
          fullname: customer.fullname,
          accountNo: customer.accountNo,
          profile: customer.profile,
          // do not set currency yet
        });
      }
    } else {
      form.resetFields(["fullname", "accountNo"]);
    }
  }, [selectedAccount]);

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
  const selectedCustomers = useMemo(() => {
    if (!selectedAccount) return [];

    return users
      .filter((c) => c.accountNo === selectedAccount)
      .map((c) => ({
        ...c,
        balances: getBalancesByAccount(transactions, c.accountNo),
      }));
  }, [users, transactions, selectedAccount]);

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
        fd.append("exchangeRate", selectedCurrency === "USD" ? 1 : rate || 0);

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

        //  Debit (sender → original amount)
        const debitData = buildFormData({
          ...rest,
          user: myUser,
          branch: myBranch,
          transactionType: "debit",
          amount: originalAmount,
          finalAmount: convertedAmount,
          currency: selectedCurrency,
        });

        // Credit (receiver → converted amount)
        const creditData = buildFormData({
          ...rest,
          user: myUser,
          branch: myBranch,
          accountNo: toAccount.accountNo,
          fullname: toAccount?.fullname,
          currency: selectedToCurrency,
          transactionType: "credit",
          amount: convertedAmount,
          finalAmount: convertedAmount,
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

      // Get the next transaction ID
      await loadTransactionId();
      setCapturedImage(null);
      setSignatureImage(null);
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

      console.log("Commission currency:", comissionCurrency);
    } catch (err) {
      console.error(err);
    }

    setTrId(record.transactionId);
    setEdit(true);

    setSelectedCurrency(record.currency);
    setRate(record.exchangeRate);
    setAmount(record.amount);
    setTransactionType(record.transaction);

    setToAccount({
      accountNo: record.to,
      fullname: record.toFullname,
    });

    form.setFieldsValue({
      _id: record._id,
      fullname: record.fullname,
      accountNo: record.accountNo,
      transactionId: record.transactionId,
      transactionNo: record.transactionNo,
      transaction: record.transaction,
      transactionType: record.transactionType,
      transferNo: record.transferNo,
      details: record.details,
      isPass: record.isPass,
      amount: record.amount,

      currency: record.currency,
      exchangeRate: record.exchangeRate,

      // Commission
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
          .includes(keyword)
      )
    );
  }

  // From Date
  if (fromDate) {
    filtered = filtered.filter(
      (row) => !dayjs(row.createdAt).isBefore(fromDate, "day")
    );
  }

  // To Date
  if (toDate) {
    filtered = filtered.filter(
      (row) => !dayjs(row.createdAt).isAfter(toDate, "day")
    );
  }

  return filtered;
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
      render: (_, __, index) => index + 1,
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
      render: (v) => v || "—",
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

    // Actions (fixed right)
    {
      title: "Print",
      key: "print",
      fixed: "right",
      width: 20,
      height: 20,
      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);
        return (
          <PrinterOutlined
            onClick={() => printRecord(record)}
            className={`!text-xl  rounded ${
              disabled
                ? "!text-gray-300 !cursor-not-allowed"
                : "!text-purple-600 !cursor-pointer"
            }`}
          />
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

  // for transfer and exchange color management
  const buildGroupMap = (data) => {
    const map = {};
    let index = 0;

    data.forEach((item) => {
      const key = item.transactionId?.toString();
      if (!(key in map)) map[key] = index++;
    });

    return map;
  };
  const transferGroupMap = buildGroupMap(datasourceTransfer || []);
  const exchangeGroupMap = buildGroupMap(datasourceExchange || []);

  //print transaction
  const printRecord = async (record) => {
    const { transactionId } = record;

    try {
      const res = await http().get(
        `/api/transaction/readbyid/${transactionId}`,
      );

      const allTransactions = res.data.data;

      // no need to filter again, already grouped by backend
      const debit = allTransactions.find((t) => t.transactionType === "debit");

      const credit = allTransactions.find(
        (t) => t.transactionType === "credit",
      );

      const base = debit || credit || record;

      const html = `
      <html>
        <head>
          <title>Transaction Receipt</title>
          <style>
            body {
              font-family: 'Segoe UI', sans-serif;
              padding: 40px;
              background: #fff;
              color: #000;
            }

            .receipt {
              width: 100%;
              max-width: 900px;
              margin: auto;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              margin-bottom: 20px;
              padding-bottom: 10px;
            }

            .header h2 {
              margin: 0;
              font-size: 26px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 15px;
            }

            .label {
              color: #555;
            }

            .value {
              font-weight: 600;
            }

            .section {
              margin-top: 15px;
            }

            .amount {
              font-size: 26px;
              font-weight: bold;
              text-align: center;
              margin: 25px 0;
            }

            .type-credit {
              color: green;
            }

            .type-debit {
              color: red;
            }

            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 13px;
              border-top: 3px double solid #2d6ff2;
              padding-top: 10px;
            }

          </style>
        </head>

        <body>

          <div class="receipt">

            <div class="header">

            <div class="header-top">

            <div style="text-align:center;">
              <div style="
                width:150px;
                height:105px;
                border-radius:0;
                overflow:hidden;
                margin:0 auto;
              ">
                <img
                  src="${myLogo}"
                  alt="logo"
                  style="width:150px ;heigth:100px;object-fit:cover;display:block;"
                />
              </div>
            </div>

              <div class="company-info">
                <h2>${myBrand.data[0].companyName}</h2>
                <div>
                  ${
                    myBrand.data[0].address
                      ? myBrand.data[0].address.charAt(0).toUpperCase() +
                        myBrand.data[0].address.slice(1)
                      : ""
                  } - ${myBranch} Branch
                </div>
                <div>${myBrand.data[0].mobile} | ${myBrand.data[0].email}</div>
                <div class="receipt-title">Transaction Receipt</div>
              </div>

            </div>

          </div>

            <div class="row">
              <span class="label">Transaction ID:</span>
              <span class="value">${record.transactionId}</span>
            </div>

            <div class="row">
              <span class="label">Date:</span>
              <span class="value">
                ${new Date(record.createdAt).toLocaleDateString()} 
                ${new Date(record.createdAt).toLocaleTimeString()}
              </span>
            </div>

            ${
              debit
                ? `
              <div class="section">
                <div class="row">
                  <span class="label">From:</span>
                  <span class="value">${debit.fullname}</span>
                </div>

                <div class="row">
                  <span class="label">Account:</span>
                  <span class="value">${debit.accountNo}</span>
                </div>

                <div class="row">
                  <span class="label">Amount:</span>
                  <span class="value type-debit">
                     ${Number(debit.amount).toLocaleString()} ${debit.currency} (Debit)
                  </span>
                </div>
              </div>
            `
                : ""
            }

            ${
              credit
                ? `
              <div class="section">
                <div class="row">
                  <span class="label">To:</span>
                  <span class="value">${credit.fullname}</span>
                </div>

                <div class="row">
                  <span class="label">Account:</span>
                  <span class="value">${credit.accountNo}</span>
                </div>

                <div class="row">
                  <span class="label">Amount:</span>
                  <span class="value type-credit">
                      ${Number(credit.amount).toLocaleString()} ${credit.currency} (Credit)
                  </span>
                </div>
              </div>
            `
                : ""
            }


            <div class="section">

              <div class="row">
                <span class="label">Type:</span>
                <span class="value transaction-type">
  ${record.transaction?.toUpperCase()}
</span>
              </div>

              ${
                base.exchangeRate
                  ? `
                <div class="row">
                  <span class="label">Exchange Rate:</span>
                  <span class="value">
                    1 ${debit?.currency || ""} = ${base.exchangeRate} ${credit?.currency || ""}
                  </span>
                </div>
              `
                  : ""
              }

              ${
                base.details
                  ? `
                <div class="row">
                  <span class="label">Description:</span>
                  <span class="value">${base.details}</span>
                </div>
              `
                  : ""
              }

              <div class="row">
                <span class="label">Status:</span>
                <span class="value">
                  ${record.isPass === "true" ? "Completed" : "Pending"}
                </span>
              </div>

            </div>

            <div class="footer">
              Thank you for your business 🙏 <br/>
              Keep this receipt for your records
            </div>

          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = () => window.close();
            }
          </script>

        </body>
      </html>
    `;

      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
    } catch (err) {
      console.error(err);
    }
  };

  // customer search system
  const [customerSearch, setCustomerSearch] = useState("");
  const filteredOptions = accountOptions.filter((option) =>
    option.label.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const fieldStyle = {
    flex: "1 1 180px",
    minWidth: 180,
    maxWidth: "100%",
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
                    showSearch
                    placeholder="🔍 Search customer..."
                    options={filteredOptions}
                    className="w-full"
                    searchValue={customerSearch}
                    onSearch={setCustomerSearch}
                    filterOption={false}
                    onChange={(value) => setSelectedAccount(value)}
                  />
                </div>

                {customerSearch && filteredOptions.length === 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 whitespace-nowrap">
                    <span className="text-sm font-medium text-red-700">
                      ❌ No customer found for "
                      <strong>{customerSearch}</strong>"
                    </span>
                  </div>
                )}
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
                          !text-blue-700 !shadow-sm transition-all duration-300
                          hover:!border-emerald-500
                          hover:!bg-gradient-to-br
                          hover:!from-emerald-500
                          hover:!to-teal-600
                          hover:!text-white"
                  >
                    <PrinterOutlined className="!text-xl transition-transform duration-300 group-hover:scale-110" />
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
                  {/* currency */}
                  <Form.Item
                    name="currency"
                    label={
                      <span className="font-semibold text-slate-700">
                        Currency
                      </span>
                    }
                    rules={[{ required: true, message: "Select currency" }]}
                    className="xl:col-span-1"
                  >
                    <Select
                      placeholder="Currency"
                      value={currencies.currency}
                      onChange={(val) => setSelectedCurrency(val)}
                      className="!rounded-sm"
                    >
                      {currencies.map((c) => (
                        <Select.Option key={c.currency} value={c.currency}>
                          {c.currency}
                        </Select.Option>
                      ))}
                    </Select>
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
                      onChange={(val) => setTransactionType(val)}
                      className="!rounded-sm"
                    >
                      <Option value="transaction">Transaction</Option>
                      <Option value="transfer">Transfer</Option>
                      <Option value="exchange">Exchange</Option>
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
                      onChange={(value) => setAmount(value)}
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
                                (c) => c.accountNo === accountNo,
                              );

                              if (customer) {
                                setToAccount({
                                  accountNo: customer.accountNo,
                                  fullname: customer.fullname,
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
            </div>
          </div>
          <Tabs
            defaultActiveKey="1"
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
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
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
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
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
                        pageSize: 10,
                        size: "small",
                        showSizeChanger: false,
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
        title="Select your account to get Statement"
        styles={{
          content: { borderRadius: 0 },
        }}
      >
        <Form layout="vertical" onFinish={printStatement}>
          {/* ACCOUNT */}

          <Form.Item
            name="account"
            label="Account"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={accountOptions}
              placeholder="Select Account"
              onChange={(value, option) => {
                setStAcc(value);
                setStName(option.fullname);
              }}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {/* CURRENCY */}
          <Form.Item name="currency" label="Currency">
            <Select placeholder="Select Currency" allowClear>
              {filteredCurrencies.map((cur) => (
                <Select.Option key={cur} value={cur}>
                  {cur}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* DATE RANGE */}
          <div className="flex gap-3">
            <Form.Item name="fromDate" label="From Date">
              <DatePicker />
            </Form.Item>

            <Form.Item name="toDate" label="To Date">
              <DatePicker />
            </Form.Item>
          </div>

          {/* BUTTON */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PrinterOutlined />}
              className="w-full"
            >
              Print Statement
            </Button>
          </Form.Item>
          {stAcc && (!resultText || resultText.length === 0) && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Tag color="red">No Data Found</Tag>
            </div>
          )}
        </Form>
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
    </HomeLayout>
  );
};

export default Transactions;
