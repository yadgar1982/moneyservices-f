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
} from "antd";
import HomeLayout from "../Shared/Layouts/HomeLayout";
import {
  AccountBookFilled,
  BookOutlined,
  CameraFilled,
  CameraOutlined,
  CameraTwoTone,
  CheckOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  PaperClipOutlined,
  PrinterOutlined,
  SaveOutlined,
  StopOutlined,
  SwapOutlined,
  UploadOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
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

  // 1️⃣ Filter by account
  const accountFiltered = (transactions || []).filter(
    (t) => String(t.accountNo) === String(stAcc),
  );

  // 2️⃣ Currency options (for Select)
  const filteredCurrencies = [
    ...new Set(accountFiltered.map((t) => t.currency)),
  ];

  // 3️⃣ Final filtered data
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
      box-shadow:0 10px 30px rgba(0,0,0,0.08);
    }

    .topbar{
      height:0px;
      background:#113b8a;
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

      <div class="logo">
        <img
          src="${API_URL}${myBrand.data[0].logo}"
          alt="logo"
        />
      </div>

      <div class="brand-info">
        <h1>${myBrand.data[0].name}</h1>

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
      <div class="info-label">Current Balance:</div>
      <div  style="display:flex; align-items:center;gap:10px; ">${currency || "All"}  ${balanceHTML}</div>
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
 <div class="balances" style="display:flex; align-items:center;gap:10px; justify-content:end; padding-right:30px">
 <p>Balance</p> ${balanceHTML}
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

  const { data, terror } = SWR("/api/transaction/read", fetcher);

  const datasource =
    data?.data.filter(
      (t) => t.isPass === "false" && t.transaction === "transaction",
    ) || [];

  const datasourceTransfer =
    data?.data.filter(
      (t) => t.isPass === "false" && t.transaction === "transfer",
    ) || [];
  const datasourceExchange =
    data?.data.filter(
      (t) => t.isPass === "false" && t.transaction === "exchange",
    ) || [];

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
  // const saveSignature = () => {
  //   sigCanvas.current.getCanvas().toBlob((blob) => {
  //     if (blob.size > MAX_SIZE) {
  //       message.error("Signature must be 20 KB or less");
  //       return;
  //     }

  //     const file = new File([blob], "signature.png", {
  //       type: "image/png",
  //     });

  //     setSignatureImage(file);
  //   });
  // };
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

  const handleImageUpload = (file) => {
    if (!validateFileSize(file)) return Upload.LIST_IGNORE;
    setCapturedImage(file); // store File object
    return false;
  };

  const handleSignatureUpload = (file) => {
    if (!validateFileSize(file)) return Upload.LIST_IGNORE;
    setSignatureImage(file);
    return false;
  };
  const handleIspassed = async (id) => {
    try {
      const httpReq = http();
      await httpReq.put(`/api/transaction/updateone/${id}`, { isPass: true });
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

  const onFinish = async (values) => {
    try {
      const { _id, ...rest } = values;

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
          transactionType: "debit",
          amount: originalAmount,
          finalAmount: convertedAmount,
          currency: selectedCurrency,
        });

        // Credit (receiver → converted amount)
        const creditData = buildFormData({
          ...rest,
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

      mutate("/api/transaction/read");

      toast.success("Transaction created successfully!");
      form.resetFields();
      setCapturedImage(null);
      setSignatureImage(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create transaction!");
    }
  };

  const handleEdit = (record) => {
    let parent = document.activeElement;

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

    setTrId(record?.transactionId);
    setEdit(true);

    // IMPORTANT
    setSelectedCurrency(record.currency);
    setRate(record.exchangeRate);
    setTransactionType(record.transaction);

    // restore receiver account
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

      // IMPORTANT
      currency: record.currency,
      exchangeRate: record.exchangeRate,
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

      await http().put(`/api/transaction/update/${trId}`, formData);
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
      const res = await httpReq.delete(
        `/api/transaction/delete/${transactionId}`,
      );
      mutate("/api/transaction/read");
      toast.success("Transaction deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // data sourse

  const columns = [
    {
      title: "AccountNo",
      dataIndex: "accountNo",
      width: 120,
      render: (v) => v || "—",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: 120,
      render: (v) => (v ? dayjs(v).format("DD-MM-YYYY") : "—"),
    },
    {
      title: "Name",
      dataIndex: "fullname",

      width: 150,
    },
    {
      title: "Details",
      dataIndex: "details",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "trans Type",
      dataIndex: "transactionType",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Exchange",
      dataIndex: "exchangeRate",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      width: 150,
      render: (v) => v || "—",
    },

    {
      title: "Amount",
      dataIndex: "amount",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Photo",
      dataIndex: "image",
      width: 50,
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
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 50,
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
      width: 60,
      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);
        return (
          <PrinterOutlined
            onClick={() => printRecord(record)}
            className={`!text-xl !p-2 rounded ${
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
      width: 60,
      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);
        return (
          <EditOutlined
            onClick={() => !disabled && handleEdit(record)}
            className={`!text-xl !p-2 rounded ${
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
      width: 60,

      render: (_, record) => {
        const disabled = shouldDisable(record, datasourceExchange || []);

        if (disabled) {
          return (
            <CheckOutlined className="!text-xl !p-2 rounded !text-gray-300 !cursor-not-allowed" />
          );
        }

        return (
          <Popconfirm
            title="Are you sure to Pass this transaction?"
            onConfirm={() => handleIspassed(record.transactionId)}
          >
            <CheckOutlined className="!text-xl !p-2 rounded !text-green-600 !cursor-pointer" />
          </Popconfirm>
        );
      },
    },
    {
      title: "Pass",
      key: "isPassed",
      fixed: "right",
      width: 60,

      render: (_, record) => {
        const data = datasourceTransfer?.length
          ? datasourceTransfer
          : datasourceExchange;

        const disabled = shouldDisable(record, data);

        if (disabled) {
          return (
            <DeleteOutlined className="!text-xl !p-2 rounded !text-gray-300 !cursor-not-allowed" />
          );
        }

        return (
          <Popconfirm
            title="Are you sure to Pass this transaction?"
            onConfirm={() => onDelete(record.transactionId)}
          >
            <DeleteOutlined className="!text-xl !p-2 rounded !text-rose-600 !cursor-pointer" />
          </Popconfirm>
        );
      },
    },
  ];

  const handleCalculate = () => {
    setCalc((prev) => !prev);
  };

  useEffect(() => {
    form.setFieldValue(
      "exchangeRate",
      selectedCurrency === selectedToCurrency ? 1 : null,
    );
  }, [selectedCurrency, selectedToCurrency]);

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
                width:80px;
                height:80px;
                border-radius:50%;
                overflow:hidden;
                margin:0 auto;
              ">
                <img 
                  src="${API_URL}${myBrand.data[0].logo}" 
                  alt="logo"
                  style="width:100%;height:100%;object-fit:cover;display:block;"
                />
              </div>
            </div>

              <div class="company-info">
                <h2>${myBrand.data[0].name}</h2>
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

  return (
    <HomeLayout>
      <div className="bg-white p-1 md:p-4">
        <h1 className="text-xl font-bold text-zinc-600">Transactions</h1>
        <Divider size="small" className="!border-zinc-300" />
        <div className="flex md:flex-row flex-col py-4  gap-2">
          <div>
            <h1 className="text-sm font-semibold">Select an Account:</h1>
            <div className="md:!flex gap-2">
              <Select
                showSearch
                options={accountOptions}
                className="w-full !rounded-none "
                placeholder="Select Acc"
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => setSelectedAccount(value)}
                label={accountOptions.fullname}
              />
              <Tag className="!text-rose-500 !font-bold md:!text-lg !bg-transparent">
                {editTag}
              </Tag>
            </div>
          </div>
          {/* Customer selection section */}
          <div className="">
            {selectedCustomers.map((c) => (
              <div
                key={c._id || c.accountNo}
                className="bg-zinc-50 p-2 rounded-sm shadow"
              >
                {/* Profile */}
                <div className="flex items-start gap-3 mb-2">
                  {/* Text Section */}
                  <div className="flex flex-col w-full ">
                    <span className="text-sm text-gray-500">Profile</span>
                  </div>
                  {/* Profile Image */}
                  <Image
                    src={c.profile ? `${API_URL}${c.profile}` : undefined}
                    width={70}
                    height={60}
                    className="rounded-[5%] object-cover border "
                  />
                </div>

                {/* Name */}
                <p className=" w-full flex justify-between">
                  Name:
                  <span className="mx-3 text-cyan-700 font-bold">
                    {c.fullname}
                  </span>
                </p>

                {/* Account */}
                <p className=" w-full flex justify-between">
                  Account No:
                  <span className="mx-3 text-cyan-700 font-bold  ">
                    {c.accountNo}
                  </span>
                </p>
                <Divider />
                {/*  MULTI CURRENCY BALANCES */}
                <div>
                  <span className="text-sm text-gray-700">Currencies:</span>

                  <div className="flex  gap-2 mt-2 justify-between">
                    {Object.entries(c.balances || {}).map(
                      ([currency, balance]) => (
                        <span
                          key={currency}
                          onClick={() => {
                            setSelectedCurrency(currency);
                            form.setFieldsValue({ currency });
                          }}
                          className={`flex bg-cyan-500 text-white p-1 rounded shadow-lg cursor-pointer hover:bg-cyan-700 gap-2 cursor-pointer px-2 py-1 rounded text-sm
                          ${
                            selectedCurrency === currency
                              ? "bg-cyan-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          <div>{currency}: </div>
                          {Number(balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-1 !w-full ">
          <div className="w-full  p-1 flex justify-start px-5 md:px-5 gap-4  bg-zinc-100 !mb-3">
            <Button
              onClick={handleCalculate}
              type="text"
              className=" shadow hover:!bg-indigo-500 !w-[40px] !rounded-none  "
            >
              <SwapOutlined className="!text-2xl !text-zinc-500 hover:!text-white" />
            </Button>
            <Button
              type="text"
              icon={
                <PrinterOutlined className="!text-2xl !text-zinc-500 hover:!text-white " />
              }
              className=" shadow hover:!bg-indigo-500 !w-[40px] !rounded-none  "
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
        <div>
          <Form
            form={form}
            layout="vertical"
            onFinish={edit ? onUpdate : onFinish}
            initialValues={{ finalAmount: 0 }}
            size="small"
          >
            <div className="grid grid-cols-2 md:grid-cols-10 gap-0.5 bg-zinc-100 p-2 !rounded-sm">
              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>
              {/* Full Name */}

              <Form.Item
                name="fullname"
                label="Full Name"
                rules={[{ required: true, message: "Enter full name" }]}
                className="!mb-0"
              >
                <Input
                  placeholder="Full Name"
                  size="small"
                  className="!rounded-none !py-1 !h-8"
                />
              </Form.Item>

              {/* Account Number */}
              <Form.Item
                name="accountNo"
                label="Acc No"
                rules={[{ required: true, message: "Enter account number" }]}
                className="!mb-0"
              >
                <InputNumber
                  placeholder="Acc No"
                  size="small"
                  className="!w-full !rounded-none !py-1 !h-8"
                />
              </Form.Item>

              {/* Currency */}
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: "Select currency" }]}
                className="!mb-0"
              >
                <Select
                  placeholder="Currency"
                  size="small"
                  value={currencies.currency}
                  onChange={(val) => setSelectedCurrency(val)}
                  className="!rounded-none !py-1 !h-8"
                >
                  {currencies.map((c) => (
                    <Select.Option
                      key={c.currency}
                      value={c.currency}
                    ></Select.Option>
                  ))}
                </Select>
              </Form.Item>
              {/* Transaction  */}
              <Form.Item
                name="transaction"
                label="transaction"
                rules={[{ required: true }]}
                className="!mb-0"
              >
                <Select
                  placeholder="transaction type"
                  size="small"
                  onChange={(val) => setTransactionType(val)}
                  className="!rounded-none !py-1 !h-8"
                >
                  <Option value="transaction">Transaction</Option>
                  <Option value="transfer">Transfer</Option>
                  <Option value="exchange">Exchange</Option>
                </Select>
              </Form.Item>
              {/* Transaction Type */}
              {transactionType === "transaction" && (
                <Form.Item
                  name="transactionType"
                  label="Trns Type"
                  rules={[{ required: true }]}
                  className="!mb-0"
                >
                  <Select
                    placeholder="Trns Type"
                    size="small"
                    className="!rounded-none !py-1 !h-8"
                  >
                    <Option value="credit">Credit</Option>
                    <Option value="debit">Debit</Option>
                  </Select>
                </Form.Item>
              )}

              {/* Conditional Transfer */}
              {(transactionType === "transfer" ||
                transactionType === "exchange") && (
                <>
                  <Form.Item name="to" label="To" className="!mb-0">
                    <Select
                      showSearch
                      options={accountOptions}
                      placeholder="Select an Account"
                      filterOption={(input, option) =>
                        option?.label
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(accountNo) => {
                        const customer = users.find(
                          (c) => c.accountNo === accountNo,
                        );
                        setToAccount({
                          accountNo: customer.accountNo,
                          fullname: customer.fullname,
                        });
                        console.log(
                          "Selected account:",
                          customer.accountNo,
                          customer.fullname,
                        );
                      }}
                      size="small"
                      className="!w-full !rounded-none !py-1 !h-8"
                    />
                  </Form.Item>
                  {/* Currency */}

                  <Form.Item
                    name="tocurrency"
                    label="Currency"
                    rules={[{ required: true, message: "Select currency" }]}
                    className="!mb-0"
                  >
                    <Select
                      placeholder="Currency"
                      size="small"
                      value={currencies.currency}
                      onChange={(val) => setSelectedToCurrency(val)}
                      className="!rounded-none !py-1 !h-8"
                    >
                      {currencies.map((c) => (
                        <Select.Option
                          key={c.currency}
                          value={c.currency}
                        ></Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </>
              )}

              {/* Exchange Rate */}
              <Form.Item
                name="exchangeRate"
                label="Exc-Rate"
                defaultValue={1}
                className="!mb-0"
                rules={
                  transactionType === "transfer" || "exchange"
                    ? []
                    : [{ required: true, message: "Rate is required" }]
                }
              >
                <InputNumber
                  placeholder="Rate"
                  size="small"
                  className="!w-full !rounded-none !py-1 !h-8"
                  onChange={(value) => setRate(value)}
                />
              </Form.Item>

              {/* Amount */}

              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true }]}
                className="!mb-0"
              >
                <InputNumber
                  placeholder="Amount"
                  size="small"
                  className="!w-full !rounded-none !py-1 !h-8"
                  onChange={(value) => setAmount(value)}
                />
              </Form.Item>

              {/* Exchanged Amt */}
              <Form.Item
                name="finalAmount"
                label="Exch-Amt"
                className="!mb-0 !text-red-500"
                rules={[{ required: true }]}
              >
                <InputNumber
                  disabled
                  size="small"
                  className="!w-full !rounded-none !text-red-500 !py-1 font-bold !h-8"
                  formatter={(value) => `${Number(value).toFixed(2)}`} // always show 2 decimals
                  parser={(value) => parseFloat(value)} // converts string back to number
                />
              </Form.Item>

              {/* Transaction ID */}
              <Form.Item
                name="transactionId"
                label="Trn ID"
                rules={[{ required: true }]}
                className="!mb-0"
              >
                <Input
                  placeholder="ID"
                  size="small"
                  className="!rounded-none !py-1 !h-8"
                />
              </Form.Item>

              {/* Transaction No */}
              <Form.Item
                name="transactionNo"
                label="Trn No"
                rules={[{ required: true }]}
                className="!mb-0"
              >
                <Input
                  placeholder="No"
                  size="small"
                  className="!rounded-none !py-1 !h-8"
                />
              </Form.Item>

              {/* Transfer No */}
              <Form.Item
                name="transferNo"
                label="Transfer-No"
                className="!mb-0"
              >
                <Input
                  placeholder="Tr-No"
                  size="small"
                  className="!rounded-none !w-full !py-1 !h-8"
                />
              </Form.Item>

              {/* Details */}
              <Form.Item
                name="details"
                label="Details"
                className="col-span-2 md:col-span-10 !mb-1"
              >
                <Input.TextArea
                  placeholder="Details"
                  rows={2}
                  className="!rounded-none text-sm !py-1"
                />
              </Form.Item>

              <Form.Item
                name="document"
                className="col-span-2 md:col-span-10 !mb-1"
              >
                <Upload
                  accept=".pdf,image/*"
                  maxCount={1}
                  fileList={scannedDoc ? [scannedDoc] : []}
                  beforeUpload={(file) => {
                    setScannedDoc(file);
                    return false; // stop auto upload
                  }}
                  onRemove={() => setScannedDoc(null)}
                >
                  <Button
                    type="text"
                    size="small"
                    className="m-2 md:mt-4 !bg-white !p-4 hover:!border-blue-500 hover:!text-blue-500 hover:!shadow-sm hover:!shadow-blue-300"
                  >
                    <PaperClipOutlined className="!text-xl px-1 md:px-4" />
                    Documents
                  </Button>
                </Upload>
              </Form.Item>

              <Button
                onClick={() => setOpenModal(true)}
                type="text"
                size="small"
                className="m-2 md:mt-4 !bg-white !p-4 hover:!border-blue-500 hover:!text-blue-500 hover:!shadow-sm hover:!shadow-blue-300"
              >
                <CameraOutlined className="!text-xl px-1 md:px-4" />
                Signature and Image
              </Button>

              {/* Attchments */}

              {/* Submit */}
              <Form.Item className="col-span-2 md:col-span-12 !mt-8 !mb-0">
                <Button
                  type="text"
                  style={{ backgroundColor: edit ? "#855906" : "#1a890b" }}
                  htmlType="submit"
                  className=" !p-4 !rounded-none  !shadow-sm !w-full !shadow-black !font-semibold  !text-white hover:!bg-yellow-500 hover:!text-black !h-8"
                >
                  {edit ? "Update Transaction" : "Submit Transaction"}
                </Button>
              </Form.Item>
            </div>
          </Form>
        </div>

        <div className="p-2">
          <h1 className="text-zinc-500 font-semibold py-2 text-xl">
            Transaction History
          </h1>

          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Transactions",
                icon: <BookOutlined />,
                children: (
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={datasource || []}
                    bordered
                    scroll={{ x: "max-content" }}
                    sticky
                    size="small"
                    pagination={{ pageSize: 10 }}
                    className="!compact-table !text-[10px] !mb-5"
                  />
                ),
              },
              {
                key: "2",
                label: "Transfers",
                icon: <AccountBookFilled />,
                children: (
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={datasourceTransfer || []}
                    rowClassName={(record) => {
                      const index =
                        transferGroupMap[record.transactionId?.toString()];
                      return index % 2 === 0 ? "group-even" : "group-odd";
                    }}
                    bordered
                    scroll={{ x: "max-content" }}
                    sticky
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
              {
                key: "3",
                label: "Exchanges",
                icon: <AccountBookFilled />,
                children: (
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={datasourceExchange || []}
                    rowClassName={(record) => {
                      const index =
                        exchangeGroupMap[record.transactionId?.toString()];
                      return index % 2 === 0 ? "group-even" : "group-odd";
                    }}
                    bordered
                    scroll={{ x: "max-content" }}
                    sticky
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>

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
            <h3 className="font-semibold text-zinc-700 mb-3">Signature</h3>

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
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-zinc-700">Photo Capture</h3>

              <Button
                type="text"
                size="large"
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
         {
           signatureImage || capturedImage ?
          <Button
  size="large"
  icon={<UploadOutlined />}
  className="!h-14 !px-8 !border-2 !border-dashed !border-blue-400 hover:!border-blue-600 hover:!text-blue-600 transition-all duration-300 rounded-xl"
  onClick={()=>setOpenModal(false)}
>
  Add Signature / Image
</Button>
           :
           ""
         }
        </div>
      </Modal>
    </HomeLayout>
  );
};

export default Transactions;
