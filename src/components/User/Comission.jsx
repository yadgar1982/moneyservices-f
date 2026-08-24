import HomeLayout from "../Shared/Layouts/HomeLayout";
import React from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Row,
  Col,
  Checkbox,
  Card,
  Statistic,
  Table,
  Popconfirm,
  Modal,
  DatePicker,
  Tag,
  Tooltip,
  Tabs,
} from "antd";
const API_URL = import.meta.env.VITE_API_URL;
const myBrand = JSON.parse(localStorage.getItem("branding"));
const myLogo = `${import.meta.env.VITE_ENDPOINT}${myBrand?.data?.[0]?.logo || ""}`;
const { TextArea } = Input;

import { useSelector, useDispatch } from "react-redux";

import { fetchCurrency } from "../../redux/slices/currencySlice";
import { fetchComissions } from "../../redux/slices/comissionSlice";
import { fetchUsers } from "../../redux/slices/customerSlice";
import { fetchBranch } from "../../redux/slices/branchSlice";
import { fetcher, http } from "../Modules/http";
import useSWR, { mutate } from "swr";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  WalletOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";

const Commissions = () => {
  const [edit, setEdit] = useState(false);
  const [open, setOpen] = useState(false);

  //account statement states
  const [stAcc, setStAcc] = useState(null);
  const [stCurrency, setStCurrency] = useState(null);
  const [stName, setStName] = useState(null);
  const [selectedTr, setSelectedTr] = useState("");
  const [stCur, setStCur] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [resultText, setResultText] = useState("");
  const [editTag, setEditTag] = useState("");
  const [searchText, setSearchText] = useState("");

  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [statementForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCurrency());
    dispatch(fetchComissions());
    dispatch(fetchUsers());
    dispatch(fetchCurrency());
  }, []);
  const { currencies, cLoading, cError } = useSelector(
    (state) => state.currencies,
  );

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const myUser = userInfo.fullname;
  const myBranch = userInfo?.branch;
  const myBrand = JSON.parse(localStorage.getItem("branding"));
  const { users, uLoading, uError } = useSelector((state) => state.users);
  const { branches, bLoading, bError } = useSelector((state) => state.branches);

  const { data, error } = useSWR("/api/comission/read", fetcher);
  const comissions = data?.data || [];

  const onFinish = async (values) => {
    if (Array.isArray(values.accountNo)) {
      values.accountNo = values.accountNo[0];
    }

    console.log("Sending:", values);
    try {
      await http().post("/api/comission/create", values);
      toast.success("data has been saved successfully");
      mutate("/api/comission/read");
      form.resetFields();
    } catch (error) {
      console.log(error.message);
    }
  };

  //   Edit comission
  const handleEdit = (record) => {
    setEdit(true);
    console.log(record);

    form.setFieldsValue({
      fullname: record.fullname,
      accountNo: record.accountNo,
      credit: record.credit,
      debit: record.debit,
      transactionId: record.transactionId,
      transactionNo: record.transactionNo,
      transactionType: record.transactionType,
      details: record.details,
      currency: record.currency,
    });
  };

  //   Update comission
  const onUpdat = async (values) => {
    try {
      const id = values.transactionId;
      if (!id) {
        toast.error("No transaciton Availible");
        return;
      }

      const { transactionId, ...formData } = values;

      await http().put(`/api/comission/update/${id}`, formData);
      toast.success("Record Updated ! ");
      mutate("/api/comission/read");
      setEdit(false);
      form.resetFields();
    } catch (err) {
      console.error("Update Failed");
    }
  };

  // Delete comission
  const onDelete = async (transactionId) => {
    try {
      await http().delete(`/api/comission/delete/${transactionId}`);
      mutate("/api/comission/read");
      toast.success("Comission deleted! ");
    } catch (err) {
      console.error("Failed to delete comisions");
    }
  };

  // comissions details
  const today = new Date().toDateString();
  const todayCommissions = comissions.filter(
    (items) => new Date(items.createdAt).toDateString() === today,
  );

  const todayTotals = todayCommissions.reduce((acc, item) => {
    const currency = item.currency || "Unknown";

    if (!acc[currency]) {
      acc[currency] = {
        credit: 0,
        debit: 0,
      };
    }

    acc[currency].credit += Number(item.credit || 0);
    acc[currency].debit += Number(item.debit || 0);

    return acc;
  }, {});

  // Filter by account
  const accountFiltered = (comissions || []).filter(
    (t) => String(t.accountNo) === String(stAcc),
  );

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

  // print comissoin
  const printRecord = async (record) => {
    const { transactionId } = record;

    try {
      const res = await http().get(`/api/comission/readbyid/${transactionId}`);

      const comission = res.data.data;

      const html = `
    <html>
      <head>
        <title>Receipt</title>

        <style>
          body{
            font-family:'Segoe UI',sans-serif;
            padding:40px;
            background:#fff;
            color:#000;
          }

          .receipt{
            width:100%;
            max-width:900px;
            margin:auto;
          }

          .header{
            text-align:center;
            border-bottom:2px solid #000;
            margin-bottom:20px;
            padding-bottom:10px;
          }

          .header h2{
            margin:0;
            font-size:26px;
          }

          .row{
            display:flex;
            justify-content:space-between;
            margin:8px 0;
            font-size:15px;
          }

          .label{
            color:#555;
          }

          .value{
            font-weight:600;
          }

          .section{
            margin-top:15px;
          }

          .amount{
            font-size:18px;
            font-weight:bold;
            text-align:center;
            margin:25px 0;
            color:green;
          }

          .footer{
            text-align:center;
            margin-top:30px;
            font-size:13px;
            border-top:3px double #2d6ff2;
            padding-top:10px;
          }
        </style>

      </head>

      <body>

      <div class="receipt">

        <div class="header">

          <div style="text-align:center;">
            <div style="width:150px;height:105px;margin:0 auto;">
              <img
                src="${myLogo}"
                style="width:150px;height:100px;object-fit:cover;"
              />
            </div>
          </div>

          <h2>${myBrand.data[0].companyName}</h2>

          <div>
            ${
              myBrand.data[0].address
                ? myBrand.data[0].address.charAt(0).toUpperCase() +
                  myBrand.data[0].address.slice(1)
                : ""
            }
            - ${myBranch} Branch
          </div>

          <div>
            ${myBrand.data[0].mobile}
            |
            ${myBrand.data[0].email}
          </div>

          <div style="margin-top:8px;font-weight:bold;">
            Commission Receipt
          </div>

        </div>

        <div class="row">
          <span class="label">Transaction ID:</span>
          <span class="value">${comission.transactionId}</span>
        </div>

        <div class="row">
          <span class="label">Date:</span>
          <span class="value">
            ${new Date(comission.createdAt).toLocaleDateString()}
            ${new Date(comission.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <div class="section">

          <div class="row">
            <span class="label">Customer:</span>
            <span class="value">${comission.fullname}</span>
          </div>

          <div class="row">
            <span class="label">Account:</span>
            <span class="value">${comission.accountNo}</span>
          </div>

          <div class="row">
            <span class="label">Transaction No:</span>
            <span class="value">${comission.transactionNo}</span>
          </div>

        </div>

        <div class="amount">
          ${Number(comission.credit).toLocaleString()}
          ${comission.currency}
          (Commission)
        </div>

        <div class="section">

          <div class="row">
            <span class="label">Type:</span>
            <span class="value">
              ${comission.transactionType.toUpperCase()}
            </span>
          </div>

          <div class="row">
            <span class="label">Description:</span>
            <span class="value">
              ${comission.details}
            </span>
          </div>

        </div>

        <div class="footer">
          Thank you for your business 🙏<br/>
          Keep this receipt for your records.
        </div>

      </div>

      <script>
        window.onload = function(){
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

  // print comissin statement
  const openModal = () => {
    setOpen(true);
  };

  // GET FILTERED STATEMENT DATA
  const getStatementFilteredData = (values = {}) => {
    const { accountNo, currency, fromDate, toDate } = values;

    let result = [...comissions];

    // Filter by account number
    if (accountNo) {
      result = result.filter((t) => String(t.accountNo) === String(accountNo));
    }

    // Filter by currency
    if (currency) {
      result = result.filter(
        (t) =>
          String(t.currency).toUpperCase() === String(currency).toUpperCase(),
      );
    }

    // Filter by date range
    if (fromDate || toDate) {
      result = result.filter((t) => {
        const transactionDate = dayjs(t.createdAt);

        if (
          fromDate &&
          transactionDate.isBefore(dayjs(fromDate), "day")
        ) {
          return false;
        }

        if (
          toDate &&
          transactionDate.isAfter(dayjs(toDate), "day")
        ) {
          return false;
        }

        return true;
      });
    }

    // Sort oldest to newest
    return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const buildStatementRows = (result) => {
    const runningBalances = {};

    return result.map((transaction, index) => {
      const currency = transaction.currency || "N/A";
      const credit = Number(transaction.credit) || 0;
      const debit = Number(transaction.debit) || 0;

      if (runningBalances[currency] === undefined) {
        runningBalances[currency] = 0;
      }

      runningBalances[currency] += credit;
      runningBalances[currency] -= debit;

      return {
        index: index + 1,
        date: dayjs(transaction.createdAt).format("DD-MM-YYYY"),
        accountNo: transaction.accountNo || "-",
        description: transaction.details || "-",
        currency,
        credit,
        debit,
        balance: runningBalances[currency],
      };
    });
  };

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const escapeHtml = (value) =>
    String(value ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

const getCurrentBalance = (accountNo, currency) => {
  if (!currency) {
    return 0;
  }

  return comissions
    .filter((transaction) => {
      const sameCurrency =
        String(transaction.currency || "").toUpperCase() ===
        String(currency).toUpperCase();

      if (!sameCurrency) {
        return false;
      }

      // If an account is selected,
      // only calculate that account's balance.
      if (
        accountNo !== undefined &&
        accountNo !== null &&
        String(accountNo).trim() !== ""
      ) {
        return (
          String(transaction.accountNo) ===
          String(accountNo)
        );
      }

      // No account selected,
      // include all accounts for this currency.
      return true;
    })
    .reduce((balance, transaction) => {
      const credit =
        Number(transaction.credit) || 0;

      const debit =
        Number(transaction.debit) || 0;

      return balance + credit - debit;
    }, 0);
};

  // PRINT ACCOUNT STATEMENT
  const printStatement = (values) => {
  // Get transactions matching the selected filters
  const result = getStatementFilteredData(values);

  // Stop if there are no matching transactions
  if (result.length === 0) {
    setResultText("No data to display");

    toast.error(
      "No transactions found for the selected query."
    );

    return;
  }

  setResultText("");

  // Build the statement rows
  const rows = buildStatementRows(result);

  // Calculate current balance.
  // Account selected: account + currency.
  // No account: currency across all accounts.
  const currentBalance = getCurrentBalance(
    values.accountNo,
    values.currency
  );

  // Format current balance
  const balanceHTML = `
    <div class="balance-item">
      <span class="balance-currency">
        ${escapeHtml(values.currency || "")}
      </span>

      <strong>
        ${formatNumber(currentBalance)}
      </strong>
    </div>
  `;


    // Build the transaction table
    const rowsHTML = rows
      .map(
        (row) => `
        <tr>
          <td class="center nowrap">
            ${row.index}
          </td>

          <td class="date-cell nowrap">
            ${row.date}
          </td>

          <td class="account-cell nowrap">
            ${escapeHtml(row.accountNo)}
          </td>

          <td class="description-cell">
            ${escapeHtml(row.description)}
          </td>

          <td class="number credit">
            ${row.credit > 0 ? formatNumber(row.credit) : "-"}
          </td>

          <td class="number debit">
            ${row.debit > 0 ? formatNumber(row.debit) : "-"}
          </td>

          <td class="number balance">
            ${formatNumber(row.balance)}
          </td>
        </tr>
      `,
      )
      .join("");

    // Format the selected date range
    const firstDate = values.fromDate
      ? dayjs(values.fromDate).format("DD-MM-YYYY")
      : "-";

    const lastDate = values.toDate
      ? dayjs(values.toDate).format("DD-MM-YYYY")
      : "-";

    // Get company and branch information
    const company = myBrand?.data?.[0] || {};
    const branch = myBranch || "";

    // Open the print window
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print.");

      return;
    }

    // Create the print document
    printWindow.document.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          Account Statement
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            margin: 0;
            padding: 20px;
            background: #f1f5f9;
            color: #0f172a;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 12px;
          }

          .container {
            width: 100%;
            max-width: 1050px;
            margin: 0 auto;
            background: #ffffff;
          }

          .header {
            text-align: center;
            padding: 18px 20px 14px;
            border-bottom: 1px solid #cbd5e1;
          }

          .logo-wrap {
            width: 100px;
            height: 75px;
            margin: 0 auto 8px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-wrap img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }

          .company-name {
            margin: 0;
            color: #173b70;
            font-size: 24px;
            font-weight: 700;
          }

          .company-line {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 12px;
          }

          .statement-title {
            display: inline-block;
            margin-top: 12px;
            padding: 6px 18px;

            color: #173b70;

            border-bottom: 2px solid #173b70;

            font-size: 14px;
            font-weight: 700;

            letter-spacing: 2px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;

            gap: 10px 35px;

            padding: 16px 5px;

            border-bottom: 1px solid #e2e8f0;
          }

          .info-label {
            margin-bottom: 4px;

            color: #64748b;

            font-size: 10px;
            font-weight: 600;

            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .info-value {
            color: #0f172a;

            font-size: 13px;
            font-weight: 600;
          }

          .balance-section {
            display: flex;

            align-items: center;
            justify-content: flex-end;

            flex-wrap: wrap;

            gap: 8px;

            padding: 12px 5px;

            border-bottom: 1px solid #e2e8f0;
          }

          .balance-label {
            margin-right: 4px;

            color: #64748b;

            font-size: 11px;
            font-weight: 600;

            text-transform: uppercase;
          }

          .balance-item {
            display: inline-flex;

            align-items: center;

            gap: 7px;

            padding: 5px 9px;

            border: 1px solid #dbeafe;

            border-radius: 5px;

            background: #eff6ff;

            color: #173b70;
          }

          .balance-currency {
            font-weight: 700;
          }

          .table-section {
            padding-top: 18px;
          }

          .section-title {
            margin: 0 0 10px;

            padding-bottom: 7px;

            border-bottom: 2px solid #e2e8f0;

            color: #173b70;

            font-size: 14px;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
          }

          thead {
            display: table-header-group;
          }

          th {
            padding: 9px 7px;

            border: 1px solid #cbd5e1;

            background: #173b70;

            color: #ffffff;

            font-size: 10px;
            font-weight: 700;

            text-align: left;

            white-space: nowrap;
          }

          td {
            padding: 8px 7px;

            border: 1px solid #dbe2ea;

            color: #334155;

            font-size: 10px;

            vertical-align: middle;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .center {
            text-align: center;
          }

          .number {
            text-align: right;
            white-space: nowrap;
          }

          .nowrap {
            white-space: nowrap;
          }

          .date-cell {
            width: 90px;
            min-width: 90px;
            white-space: nowrap;
          }

          .account-cell {
            width: 85px;
            min-width: 85px;
            white-space: nowrap;
          }

          .description-cell {
            min-width: 220px;
            max-width: 420px;

            white-space: normal;

            overflow-wrap: anywhere;

            line-height: 1.35;
          }

          .credit {
            color: #15803d;
            font-weight: 600;
          }

          .debit {
            color: #dc2626;
            font-weight: 600;
          }

          .balance {
            color: #0f172a;
            font-weight: 700;
          }

          .footer {
            margin-top: 18px;

            padding: 12px 5px 0;

            border-top: 1px solid #e2e8f0;

            color: #94a3b8;

            font-size: 9px;

            text-align: center;
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .container {
              max-width: none;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .no-print {
              display: none;
            }
          }

          @media screen and (max-width: 700px) {
            body {
              padding: 8px;
            }

            .info-grid {
              grid-template-columns: 1fr;
            }
          }

        </style>

      </head>

      <body>

        <div class="container">

          <div class="header">

            ${
              myLogo
                ? `
                  <div class="logo-wrap">
                    <img
                      src="${escapeHtml(myLogo)}"
                      alt="Company Logo"
                    />
                  </div>
                `
                : ""
            }

            <h1 class="company-name">
              ${escapeHtml(company.companyName || "Company Name")}
            </h1>

            <p class="company-line">
              ${escapeHtml(company.address || "")}

              ${company.address && branch ? " • " : ""}

              ${escapeHtml(branch)}

              ${branch ? " Branch" : ""}
            </p>

            <p class="company-line">
              ${escapeHtml(company.mobile || "")}

              ${company.mobile && company.email ? " | " : ""}

              ${escapeHtml(company.email || "")}
            </p>

            <div class="statement-title">
              ACCOUNT STATEMENT
            </div>

          </div>

          <div class="info-grid">

            <div>
              <div class="info-label">
                Date Range
              </div>

              <div class="info-value">
                ${firstDate} → ${lastDate}
              </div>
            </div>

            <div>
              <div class="info-label">
                Currency
              </div>

              <div class="info-value">
                ${escapeHtml(values.currency || "All Currencies")}
              </div>
            </div>

          </div>

          <div class="balance-section">

            <span class="balance-label">
              Current Balance
            </span>

            ${balanceHTML}

          </div>

          <div class="table-section">

            <div class="section-title">
              Transaction History
            </div>

            <table>

              <thead>

                <tr>

                  <th
                    style="
                      width:35px;
                      text-align:center;
                    "
                  >
                    #
                  </th>

                  <th
                    style="
                      width:90px;
                    "
                  >
                    Date
                  </th>

                  <th
                    style="
                      width:85px;
                    "
                  >
                    Account No
                  </th>

                  <th>
                    Description
                  </th>

                  <th
                    style="
                      width:95px;
                      text-align:right;
                    "
                  >
                    Credit
                  </th>

                  <th
                    style="
                      width:95px;
                      text-align:right;
                    "
                  >
                    Debit
                  </th>

                  <th
                    style="
                      width:105px;
                      text-align:right;
                    "
                  >
                    Balance
                  </th>

                </tr>

              </thead>

              <tbody>
                ${rowsHTML}
              </tbody>

            </table>

          </div>

          <div class="footer">

            Generated on
            ${dayjs().format("DD-MM-YYYY hh:mm A")}

            <br />

            ${escapeHtml(company.companyName || "Your Company")}

          </div>

        </div>

        <script>

          (function () {
            const images =
              Array.from(
                document.images
              );

            const printPage = () => {
              window.focus();
              window.print();
            };

            if (images.length === 0) {
              setTimeout(
                printPage,
                300
              );
            } else {
              let remaining =
                images.length;

              const done = () => {
                remaining -= 1;

                if (remaining <= 0) {
                  setTimeout(
                    printPage,
                    300
                  );
                }
              };

              images.forEach((img) => {
                if (img.complete) {
                  done();
                } else {
                  img.addEventListener(
                    "load",
                    done,
                    { once: true }
                  );

                  img.addEventListener(
                    "error",
                    done,
                    { once: true }
                  );
                }
              });
            }

            window.addEventListener(
              "afterprint",
              () => {
                window.close();
              }
            );
          })();

        </script>

      </body>

    </html>
  `);

    // Finish the print document
    printWindow.document.close();
  };

  // EXPORT THE SAME FILTERED STATEMENT TO EXCEL
  const exportStatementToExcel = () => {
    // Get the values selected in the Statement form
    const values = statementForm.getFieldsValue();

    // Get ONLY the filtered statement transactions
    const filteredData = getStatementFilteredData(values);

    // Nothing found
    if (!filteredData || filteredData.length === 0) {
      toast.error("No transactions found for the selected filters.");
      return;
    }

    // Build the exact same statement rows used by Print
    // so Excel and Print always contain the same filtered records.
    const rows = buildStatementRows(filteredData);

    const excelData = rows.map((row) => ({
      "#": row.index,
      Date: row.date,
      "Account No": row.accountNo,
      Description: row.description,
      Currency: row.currency,
      Credit: row.credit,
      Debit: row.debit,
      Balance: row.balance,
    }));

    // Create Excel sheet ONLY from filteredData
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 6 }, // #
      { wch: 15 }, // Date
      { wch: 15 }, // Account No
      { wch: 55 }, // Description
      { wch: 12 }, // Currency
      { wch: 16 }, // Credit
      { wch: 16 }, // Debit
      { wch: 16 }, // Balance
    ];

    // Format numeric columns
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let row = 1; row <= range.e.r; row++) {
      const creditCell = XLSX.utils.encode_cell({
        r: row,
        c: 5,
      });

      const debitCell = XLSX.utils.encode_cell({
        r: row,
        c: 6,
      });

      const balanceCell = XLSX.utils.encode_cell({
        r: row,
        c: 7,
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

    // Create workbook
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement");

    // File name based on selected account
    const accountNo = values.accountNo || "All";

    const currency = values.currency || "All";

    const date = dayjs().format("YYYY-MM-DD");

    const fileName = `Account_Statement_${accountNo}_${currency}_${date}.xlsx`;

    // Download
    XLSX.writeFile(workbook, fileName);

    toast.success(`${filteredData.length} transactions exported to Excel.`);
  };

  // search function
  const filterData = (data) => {
    if (!searchText) return data;

    const keyword = searchText.toLowerCase().trim();

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword),
      ),
    );
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
      title: "Customer",
      dataIndex: "fullname",
    },

    {
      title: "Currency",
      dataIndex: "currency",
    },

    {
      title: "Credit",
      dataIndex: "credit",
    },

    {
      title: "Debit",
      dataIndex: "debit",
    },

    {
      title: "Transaction",
      dataIndex: "transactionType",
    },

    {
      title: "Details",
      dataIndex: "details",
    },

    // Actions (fixed right)
    {
      title: "Print",
      key: "print",
      fixed: "right",
      width: 26,
      height: 26,
      render: (_, record) => {
        return (
          <PrinterOutlined
            onClick={() => printRecord(record)}
            className="!text-purple-600 !cursor-pointer"
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
        return <EditOutlined onClick={() => handleEdit(record)} />;
      },
    },

    {
      title: "Delete",
      key: "isDelete",
      fixed: "right",
      width: 20,
      height: 20,

      render: (_, record) => {
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
  return (
    <HomeLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30 p-4 md:p-8">
        <div className="mb-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">
                Commission Management
              </h1>

              <p className="mt-2 text-slate-500 text-lg">
                Manage commissions, transfers and daily earnings with ease.
              </p>
            </div>

            <div className="mt-5 md:mt-0">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg">
                <WalletOutlined /> Today's Summary
              </div>
            </div>
          </div>
        </div>
        {/* status */}
        <Row gutter={[16, 16]} className="mb-6 flex justify-center w-full">
          {Object.entries(todayTotals).map(([currency, total]) => {
            const net = total.credit - total.debit;

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={currency}>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 p-4">
                  <h3 className="text-lg font-bold text-slate-700 border-b pb-2 mb-3">
                    {currency}
                  </h3>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 font-medium">Credit</span>
                    <span className="text-green-600 font-bold text-lg">
                      {total.credit.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 font-medium">Debit</span>
                    <span className="text-red-600 font-bold text-lg">
                      {total.debit.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t mt-3 pt-3 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Net</span>
                    <span
                      className={`text-xl font-extrabold ${
                        net >= 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {net.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
        {/* Form */}
        <div className="flex justify-center w-full ">
          <Card
            className="!w-full xl:!w-9/12 !rounded-2xl !shadow-xl !border-0 overflow-hidden"
            title={
              <div className="flex items-center gap-3 py-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl">
                  💰
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {edit ? "Update Commission" : "New Commission"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Manage customer commission transactions
                  </p>
                </div>
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={edit ? onUpdat : onFinish}
              autoComplete="off"
            >
              {/* Customer Section */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-700">
                  Customer Information
                </h3>
              </div>

              <Row gutter={[24, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Customer Name"
                    name="fullname"
                    rules={[
                      {
                        required: true,
                        message: "Please enter customer name",
                      },
                    ]}
                  >
                    <Input
                      size="large"
                      className="!rounded-lg"
                      placeholder="Customer Name"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="accountNo" label="Account No">
                    <Select
                      mode="tags"
                      size="large"
                      showSearch
                      placeholder="Select Account"
                      options={accountOptions}
                      className="!rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Currency"
                    name="currency"
                    rules={[
                      {
                        required: true,
                        message: "Select currency",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      className="!rounded-lg"
                      placeholder="Currency"
                      options={currencies?.map((item) => ({
                        label: item.currency,
                        value: item.currency,
                      }))}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Transaction Type" name="transactionType">
                    <Select
                      size="large"
                      className="!rounded-lg"
                      placeholder="Transaction Type"
                      options={[
                        {
                          value: "transaction fees",
                          label: "Transaction Fees",
                        },
                        {
                          value: "transfer commission",
                          label: "Transfer Fees",
                        },
                        {
                          value: "exchange commission",
                          label: "Exchange Fees",
                        },
                        {
                          value: "expense",
                          label: "Expense",
                        },
                        {
                          value: "withdrawal",
                          label: "Withdrawal",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>

                {/* Amount Section */}

                <Col span={24}>
                  <div className="bg-slate-50 border rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">
                      Commission Amount
                    </h3>

                    <Row gutter={[24, 8]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Credit"
                          name="credit"
                          initialValue={0}
                        >
                          <InputNumber
                            size="large"
                            className="!w-full !rounded-lg"
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/,/g, "")}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12}>
                        <Form.Item label="Debit" name="debit" initialValue={0}>
                          <InputNumber
                            size="large"
                            className="!w-full !rounded-lg"
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/,/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* Reference */}

                <Col xs={24} md={12}>
                  <Form.Item label="Transaction ID" name="transactionId">
                    <Input
                      size="large"
                      className="!rounded-lg"
                      readOnly={edit}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Transaction No" name="transactionNo">
                    <Input size="large" className="!rounded-lg" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Details" name="details">
                    <Input.TextArea
                      rows={3}
                      className="!rounded-lg"
                      placeholder="Commission details..."
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    className="
        !h-12
        !rounded-xl
        !font-semibold
        !bg-gradient-to-r
        !from-blue-600
        !to-cyan-500
        !border-0
        "
                  >
                    {edit ? "Update Commission" : "Save Commission"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
        </div>
        <Card
          bordered={false}
          className="!mt-8 !rounded-3xl !bg-white/80 !backdrop-blur-xl !border !border-white/40 !shadow-xl"
          title={
            <div>
              <div className="flex justify-between items-center mt-2">
                <h2 className="text-xl font-bold text-slate-800 py-4">
                  Commission History
                </h2>
                <div className="flex items-center gap-2">
                  <Tooltip title="Print Transactions">
                    <Button onClick={openModal}>
                      <PrinterOutlined className="!text-lg !text-blue-500" />
                    </Button>
                  </Tooltip>

                  <Input.Search
                    placeholder="Search commissions..."
                    allowClear
                    size="middle"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          }
        >
          <Tabs
            defaultActiveKey="today"
            size="small"
            items={[
              {
                key: "today",
                label: (
                  <p className="!text-indigo-400 hover:!text-yellow-600 hover:!text-xl !font-bold">
                    Today's Commissions
                  </p>
                ),
                children: (
                  <Table
                    size="small"
                    rowKey="transactionId"
                    dataSource={filterData(todayCommissions)}
                    columns={columns}
                    pagination={{ pageSize: 6 }}
                    scroll={{ x: "max-content" }}
                  />
                ),
              },
              {
                key: "all",
                label: (
                  <p className="!text-cyan-400 hover:!text-yellow-600 hover:!text-xl !font-bold">
                    All Commissions
                  </p>
                ),
                children: (
                  <Table
                    size="small"
                    rowKey="transactionId"
                    dataSource={filterData(comissions)}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: "max-content" }}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* Comission Statement Modal */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Select your account to get Statement"
        styles={{
          content: { borderRadius: 0 },
        }}
      >
        <Form form={statementForm} layout="vertical" onFinish={printStatement}>
          {/* CURRENCY */}
          <Form.Item
            name="currency"
            label="Currency"
            rules={[
              {
                required: true,
                message: "Please select a currency",
              },
            ]}
          >
            <Select
              placeholder="Select Currency"
              allowClear
              options={currencies.map((cur) => ({
                label: cur.currency,
                value: cur.currency,
              }))}
            />
          </Form.Item>

          {/* ACCOUNT */}

          <Form.Item name="accountNo" label="Account No">
            <Select
              size="large"
              showSearch
              placeholder="Select Account No"
              options={accountOptions}
              className="!rounded-lg !border-slate-300 hover:!border-blue-500"
            />
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="primary"
                htmlType="submit"
                icon={<PrinterOutlined />}
                className="!h-10 !rounded-lg"
              >
                Print Statement
              </Button>

              <Button
                type="default"
                icon={<FileExcelOutlined className="!text-green-600" />}
                onClick={exportStatementToExcel}
                className="!h-10 !rounded-lg !border-green-200 !text-green-700 hover:!border-green-400 hover:!text-green-800"
              >
                Export to Excel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </HomeLayout>
  );
};

export default Commissions;