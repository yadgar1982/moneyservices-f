import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  Table,
  Popconfirm,
  Avatar,
  Modal,
} from "antd";
import HomeLayout from "../Shared/Layouts/HomeLayout";
import {
  DeleteOutlined,
  DownCircleOutlined,
  EditOutlined,
  PrinterOutlined,
  SearchOutlined,
  UploadOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
const API_URL = import.meta.env.VITE_API_URL;

import { http, fetcher } from "../Modules/http";
import { fetchTransaction } from "../../redux/slices/transactionSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";
import { fetchUsers } from "../../redux/slices/customerSlice";
import { fetchBranch } from "../../redux/slices/branchSlice";
 

const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;

// ISO 3166-1 alpha-2 country codes, displayed using the browser's locale data.
const countryRegionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(" ");
const countryOptions = countryCodes
  .map((code) => ({ value: countryRegionNames.of(code), label: countryRegionNames.of(code) }))
  .sort((a, b) => a.label.localeCompare(b.label));

//getting user from localStorage
const myBrand = JSON.parse(
  localStorage.getItem("branding") || "{}"
);

const userInfo = JSON.parse(localStorage.getItem("userInfo"));

const myLogo = "/assets/logo.png";

const Accounts = () => {
  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const httpReq = http();
  const dispatch = useDispatch();

  const { users, uLoading, uError } = useSelector(
    (state) => state.users,
  );

  const { transactions, loading, error } = useSelector(
    (state) => state.transactions,
  );

  const { branches, bLoading, bError } = useSelector(
    (state) => state.branches,
  );

  useEffect(() => {
    dispatch(fetchTransaction());
    dispatch(fetchUsers());
    dispatch(fetchBranch());
  }, []);

  const { data, terror } = SWR("/api/user/read", fetcher);

  const userData = data ? data.data : [];
  const filteredUsers = userData.filter((item) => item.role == "customer");

  // search users
  const searchedUsers = filteredUsers.filter((user) => {
    const search = appliedSearch.trim().toLowerCase();

    // IMPORTANT:
    // No search → show ALL customers
    if (!search) {
      return true;
    }

    return (
      String(user.fullname || "")
        .toLowerCase()
        .includes(search) ||
      String(user.accountNo || "")
        .toLowerCase()
        .includes(search) ||
      String(user.reference || "")
        .toLowerCase()
        .includes(search) ||
      String(user.email || "")
        .toLowerCase()
        .includes(search) ||
      String(user.mobile || "")
        .toLowerCase()
        .includes(search) ||
      String(user.country || "")
        .toLowerCase()
        .includes(search) ||
      String(user.address || "")
        .toLowerCase()
        .includes(search)
    );
  });

  // create Account

  const onFinish = async (values) => {
    try {
      delete values._id;

      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key !== "profile" && values[key] !== undefined && values[key] !== null) {
          const value = key === "reference" ? String(values[key]).trim().toLowerCase() : values[key];
          formData.append(key, value);
        }
      });

      formData.append("role", "customer");

      // handle profile image with compression
      if (values.profile && values.profile.length > 0) {
        const file = values.profile[0].originFileObj;

        let finalFile = file;

        if (file.size > 500 * 1024) {
          finalFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          });
        }

        formData.append("profile", finalFile);
      }

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await http().post("/api/user/create", formData);

      mutate("/api/user/read");
      toast.success("User created successfully!");
      form.resetFields();
      setEdit(false);
      setFormVisible(false);
    } catch (err) {
      console.error("Create user error:", err);
      toast.error("Failed to create user!");
    }
  };

  //update Account
  const handleEdit = (record) => {
    setEdit(true);
    setFormVisible(true);
    form.setFieldsValue({
      _id: record._id,
      fullname: record.fullname,
      email: record.email,
      mobile: record.mobile,
      country: record.country,
      address: record.address,
      role: record.role,
      branch: record.branch,
      accountNo: record.accountNo,
      reference: record.reference,
      password: "123456",
      isPass: record.isPass,
    });
  };

  const onUpdate = async (values) => {
    try {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === "password") return;
        if (key !== "profile" && values[key] !== undefined && values[key] !== null) {
          const value = key === "reference" ? String(values[key]).trim().toLowerCase() : values[key];
          formData.append(key, value);
        }
      });

      // handle profile with compression

      if (values.profile && values.profile.length > 0) {
        const file = values.profile[0].originFileObj;
        let finalFile = file;

        if (file.size > 500 * 1024) {
          finalFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          });
        }
        formData.append("profile", finalFile);
      }
      await httpReq.put(`/api/user/update/${values._id}`, formData);
      form.resetFields();
      mutate("/api/user/read");
      toast.success("User Updated Successfully !");
      setEdit(false);
      setFormVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  //Delete Account
  const onDelete = async (id) => {
    try {
      const res = await httpReq.delete(`/api/user/delete/${id}`);
      mutate("/api/user/read");
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // Print Account

   const printAccount = (record) => {
    const getBalancesByAccount = (transactions = [], accountNo) => {
      const balances = {};

      transactions.forEach((t) => {
        if (Number(t.accountNo) !== Number(accountNo)) return;

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

      return balances;
    };

    const printWindow = window.open("", "", "width=900,height=700");

    if (!printWindow) {
      alert("Popup blocked!");
      return;
    }

    const balances = getBalancesByAccount(transactions, record.accountNo);

    const balanceHTML = Object.entries(balances)
      .map(
        ([currency, balance]) => `
        <div class="balance-card">
          <div class="currency">${currency}</div>
          <div class="balance">
            ${Number(balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      `,
      )
      .join("");


    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Account Statement - ${record.accountNo || ""}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f4f6f8;
            color: #1f2937;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
          }

          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          }

          /* ================= HEADER ================= */

          .header {
            padding: 28px 35px 22px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .logo {
            width: 85px;
            height: 85px;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }

          .company-name {
            margin: 5px 0 3px;
            font-size: 20px;
            font-weight: 700;
            color: #173b70;
            letter-spacing: 0.2px;
          }

          .company-contact {
            margin: 3px 0;
            font-size: 11px;
            color: #6b7280;
          }

          .company-address {
            margin: 3px 0 0;
            font-size: 11px;
            color: #9ca3af;
          }

          .statement-title {
            margin-top: 18px;
            font-size: 14px;
            font-weight: 700;
            color: #173b70;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }

          /* ================= ACCOUNT HEADER ================= */

          .account-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 35px;
            background: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
          }

          .account-label {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            margin-bottom: 3px;
          }

          .account-value {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
          }

          .account-date {
            text-align: right;
          }

          /* ================= CONTENT ================= */

          .section {
            padding: 22px 35px;
          }

          .section-title {
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            color: #173b70;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          /* ================= CUSTOMER ================= */

          .customer-area {
            display: flex;
            gap: 22px;
            align-items: flex-start;
          }

          .profile-img {
            width: 72px;
            height: 72px;
            flex-shrink: 0;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid #dbe2ea;
            background: #f8fafc;
          }

          .profile-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .info-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 40px;
            row-gap: 12px;
          }

          .info-item span {
            display: block;
            margin-bottom: 3px;
            color: #94a3b8;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .info-item strong {
            display: block;
            color: #334155;
            font-size: 12px;
            font-weight: 600;
          }

          /* ================= BALANCES ================= */

          .balances {
            display: grid;
            grid-template-columns: repeat(
              auto-fit,
              minmax(150px, 1fr)
            );
            gap: 10px;
          }

          .balance-card {
            padding: 13px 15px;
            border: 1px solid #dbe4ee;
            border-radius: 6px;
            background: #f8fafc;
          }

          .currency {
            margin-bottom: 5px;
            color: #64748b;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.6px;
          }

          .balance {
            color: #173b70;
            font-size: 17px;
            font-weight: 700;
          }

          .no-balance {
            padding: 12px 0;
            color: #94a3b8;
            font-size: 12px;
          }

          /* ================= FOOTER ================= */

          .footer {
            margin-top: 5px;
            padding: 16px 35px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
          }

          .footer strong {
            color: #64748b;
            font-weight: 600;
          }

          /* ================= PRINT ================= */

          /* Let the browser print dialog control Portrait or Landscape. */
          @page {
            size: auto;
            margin: 7mm;
          }

          @media print {
            html,
            body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #1f2937 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .container {
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
              max-width: none !important;
              min-height: 0 !important;
              margin: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .header,
            .account-header,
            .section,
            .footer {
              flex-shrink: 0 !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .header {
              padding: 8px 22px 8px !important;
            }

            .logo {
              width: 56px !important;
              height: 56px !important;
              margin: 0 auto 5px !important;
            }

            .header h2 {
              margin: 3px 0 !important;
              color: #173b70 !important;
              font-size: 17px !important;
              line-height: 1.2 !important;
            }

            .company-contact,
            .company-address {
              margin: 2px 0 !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
            }

            .statement-title {
              margin-top: 8px !important;
              font-size: 11px !important;
              letter-spacing: 1.1px !important;
            }

            .account-header {
              padding: 8px 22px !important;
            }

            .account-label {
              font-size: 9px !important;
            }

            .account-value {
              font-size: 12px !important;
            }

            .section {
              padding: 9px 22px !important;
            }

            .section-title {
              margin-bottom: 7px !important;
              padding-bottom: 5px !important;
              font-size: 10px !important;
            }

            .customer-area {
              gap: 14px !important;
            }

            .profile-img {
              width: 60px !important;
              height: 60px !important;
            }

            .info-grid {
              column-gap: 24px !important;
              row-gap: 6px !important;
            }

            .info-item span {
              margin-bottom: 2px !important;
              font-size: 9px !important;
            }

            .info-item strong {
              font-size: 11px !important;
              line-height: 1.2 !important;
              overflow-wrap: anywhere !important;
            }

            .balances {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .balance-card {
              padding: 8px 10px !important;
            }

            .currency {
              margin-bottom: 3px !important;
              font-size: 9px !important;
            }

            .balance {
              font-size: 15px !important;
            }

            .no-balance {
              font-size: 11px !important;
            }

            .footer {
              margin-top: 0 !important;
              padding: 8px 22px !important;
              font-size: 9px !important;
              line-height: 1.3 !important;
              border-top: 1px solid #e5e7eb !important;
            }
          }

          /* Landscape has less page height, so tighten vertical spacing only.
             Keep the complete statement together; never allow the footer to split. */
          @media print and (orientation: landscape) {
            .header {
              padding-top: 4px !important;
              padding-bottom: 5px !important;
            }

            .logo {
              width: 44px !important;
              height: 44px !important;
              margin-bottom: 3px !important;
            }

            .header h2 {
              font-size: 16px !important;
            }

            .statement-title {
              margin-top: 5px !important;
            }

            .account-header {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }

            .section {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }

            .section-title {
              margin-bottom: 5px !important;
              padding-bottom: 3px !important;
            }

            .profile-img {
              width: 54px !important;
              height: 54px !important;
            }

            .info-grid {
              row-gap: 4px !important;
            }

            .balance-card {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }

            .footer {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }
          }

        </style>
      </head>

      <body>

        <div class="container">

          <!-- COMPANY HEADER -->
           <div class="header">

          <div class="logo">
            <img src="${myLogo}" alt="Company Logo" />
          </div>

          <h2>
            ${myBrand?.data?.[0]?.companyName || "Company Name"}
          </h2>

            <div class="company-contact">
              ${myBrand?.data?.[0]?.email || ""}
              ${myBrand?.data?.[0]?.email && myBrand?.data?.[0]?.mobile ? " | " : ""}
              ${myBrand?.data?.[0]?.mobile || ""}
            </div>

            <div class="company-address">
              ${myBrand?.data?.[0]?.address || ""}
            </div>

            <div class="statement-title">
              Customer Account Statement
            </div>

          </div>

          <!-- ACCOUNT SUMMARY -->
          <div class="account-header">

            <div>
              <div class="account-label">
                Account Holder
              </div>

              <div class="account-value">
                ${record.fullname || "-"}
              </div>
            </div>

            <div>
              <div class="account-label">
                Account Number
              </div>

              <div class="account-value">
                ${record.accountNo || "-"}
              </div>
            </div>

            <div class="account-date">
              <div class="account-label">
                Statement Date
              </div>

              <div class="account-value">
                ${
                  record.createdAt
                    ? new Date(record.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()
                }
              </div>
            </div>

          </div>

          <!-- CUSTOMER INFORMATION -->
          <div class="section">

            <div class="section-title">
              Customer Information
            </div>

            <div class="customer-area">

              <!-- PROFILE -->
              <div class="profile-img">
                <img
                  src="${record.profile ? `${API_URL}${record.profile}` : ""}"
                  alt="Customer"
                />
              </div>

              <!-- DETAILS -->
              <div class="info-grid">

                <div class="info-item">
                  <span>Full Name</span>
                  <strong>
                    ${record.fullname || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Account Number</span>
                  <strong>
                    ${record.accountNo || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Reference</span>
                  <strong>
                    ${record.reference || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Email</span>
                  <strong>
                    ${record.email || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Mobile</span>
                  <strong>
                    ${record.mobile || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Country</span>
                  <strong>
                    ${record.country || "-"}
                  </strong>
                </div>

                <div class="info-item">
                  <span>Address</span>
                  <strong>
                    ${record.address || "-"}
                  </strong>
                </div>

              </div>

            </div>

          </div>

          <!-- BALANCES -->
          <div class="section">

            <div class="section-title">
              Account Balances
            </div>

            <div class="balances">
              ${
                balanceHTML ||
                `<div class="no-balance">
                  No balance available
                </div>`
              }
            </div>

          </div>

          <!-- FOOTER -->
          <div class="footer">
            Powered by
            <strong>
              ${myBrand?.data?.[0]?.companyName || "Your Company"}
            </strong>
            <br />
            Please keep this statement for your records.
          </div>

        </div>

      </body>
    </html>
  `);

    printWindow.document.close();

    // Give the logo and profile image time to load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1500);
  };
  // Print Account
const printallAccounts = () => {
  // ---------------------------------------------------------
  // 1. Take safe snapshots of the current Redux data
  // ---------------------------------------------------------
  const accounts = Array.isArray(users)
    ? users.filter((user) => user && user.accountNo != null)
    : [];

  const transactionList = Array.isArray(transactions)
    ? transactions.filter((transaction) => transaction)
    : [];

  // ---------------------------------------------------------
  // 2. Open print window
  // ---------------------------------------------------------
  const printWindow = window.open(
    "",
    "",
    "width=1100,height=800",
  );

  if (!printWindow) {
    alert("Popup blocked! Please allow popups for this website.");
    return;
  }

  // ---------------------------------------------------------
  // 3. Get balances for one account
  // ---------------------------------------------------------
  const getBalancesByAccount = (accountNo) => {
    const balances = {};

    transactionList.forEach((t) => {
      if (Number(t.accountNo) !== Number(accountNo)) {
        return;
      }

      const currency = t.currency;
      const amount = Number(t.amount) || 0;

      if (!currency) {
        return;
      }

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

  // ---------------------------------------------------------
  // 4. Format money
  // ---------------------------------------------------------
  const formatAmount = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ---------------------------------------------------------
  // 5. Generate account rows
  // ---------------------------------------------------------
  const rowsHTML = accounts
    .map((user, index) => {
      const accountNo = user.accountNo;

      const balances = getBalancesByAccount(accountNo);

      const balanceHTML =
        Object.entries(balances)
          .map(([currency, balance]) => {
            const amountClass =
              balance < 0
                ? "balance-negative"
                : "balance-positive";

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
        `
          <span class="no-balance">
            No balance
          </span>
        `;

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
              ${accountNo || "-"}
            </span>
          </td>

          <td>
            ${user.reference || "-"}
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

  // ---------------------------------------------------------
  // 6. Company branding
  // ---------------------------------------------------------
  const brand = myBrand?.data?.[0] || {};

  // ---------------------------------------------------------
  // 7. Write print document
  // ---------------------------------------------------------
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
            grid-template-columns: repeat(3, 1fr);
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
              myLogo
                ? `
                  <div class="logo-wrapper">
                    <img
                      src="${myLogo}"
                      alt="Company Logo"
                    />
                  </div>
                `
                : ""
            }

            <h1 class="company-name">
              ${brand.companyName || "Company Name"}
            </h1>

            <div class="company-address">
              ${brand.address || ""}
            </div>

            <div class="company-contact">

              ${brand.email || ""}

              ${
                brand.email && brand.mobile
                  ? " • "
                  : ""
              }

              ${brand.mobile || ""}

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
                ${accounts.length}
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
                  <th>Reference</th>
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
              ${brand.companyName || "Your Company"}
            </strong>

          </div>

        </div>

      </body>

    </html>
  `);

  // ---------------------------------------------------------
  // 8. Finish the document
  // ---------------------------------------------------------
  printWindow.document.close();

  // ---------------------------------------------------------
  // 9. Wait for logo/images before printing
  // ---------------------------------------------------------
  const images = Array.from(printWindow.document.images);

  if (images.length === 0) {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 100);

    return;
  }

  let remainingImages = images.length;

  const finishPrint = () => {
    remainingImages -= 1;

    if (remainingImages <= 0) {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 100);
    }
  };

  images.forEach((img) => {
    if (img.complete) {
      finishPrint();
    } else {
      img.onload = finishPrint;
      img.onerror = finishPrint;
    }
  });
};

  // export
  const exportAllAccountsToExcel = () => {
    const getBalancesByAccount = (accountNo) => {
      const balances = {};

      transactions.forEach((t) => {
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

    // GET ALL CURRENCIES
    const currenciesList = [
      ...new Set(transactions.map((t) => t.currency).filter(Boolean)),
    ].sort();

    // CREATE EXCEL DATA
    const excelData = filteredUsers.map((user, index) => {
      const balances = getBalancesByAccount(user.accountNo);

      const row = {
        "#": index + 1,
        "Customer Name": user.fullname || "",
        "Account Number": user.accountNo || "",
        Reference: user.reference || "",
        Email: user.email || "",
        Mobile: user.mobile || "",
        Country: user.country || "",
        Address: user.address || "",
      };

      // Add every currency as its own column
      currenciesList.forEach((currency) => {
        row[currency] = Number(balances[currency] || 0);
      });

      return row;
    });

    // CREATE WORKSHEET
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // COLUMN WIDTHS
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },

      // Currency columns
      ...currenciesList.map(() => ({
        wch: 16,
      })),
    ];

    // FORMAT CURRENCY CELLS
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

    // CREATE WORKBOOK
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "All Accounts");

    // FILE NAME
    const date = new Date().toISOString().slice(0, 10);

    const fileName = `All_Accounts_${date}.xlsx`;

    // DOWNLOAD
    XLSX.writeFile(workbook, fileName);
  };
  // data sourse

  const columns = [
    {
      title: "Account",
      dataIndex: "accountNo",
      width: 150,
    },
    {
      title: "Reference",
      dataIndex: "reference",
      width: 160,
      render: (value) => value || "—",
    },
    {
      title: "Name",
      dataIndex: "fullname",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Country",
      dataIndex: "country",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "َAddress",
      dataIndex: "address",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Photo",
      dataIndex: "profile",
      render: (_, record) => {
        console.log("PROFILE:", record.profile);

        return (
          <Avatar
            src={`${API_URL}${record.profile}`}
            alt="profile"
            style={{
              width: 40,
              height: 40,
              borderRadius: 50,
            }}
          />
        );
      },
    },
    // Actions (fixed right)
    {
      title: "Print",
      key: "print",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <PrinterOutlined
          onClick={() => {
  if (!transactions || transactions.length === 0) {
    message.warning("Transactions are still loading. Please wait a moment.");
    return;
  }

  printAccount(record);
}}
          className="!text-zinc-500 !text-xl !cursor-pointer  !p-2 rounded"
        />
      ),
    },
    {
      title: "Edit",
      key: "edit",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <EditOutlined
          onClick={() => handleEdit(record)}
          className="!text-blue-600 !text-xl !cursor-pointer  !p-2 rounded"
        />
      ),
    },

    {
      title: "Delete",
      key: "delete",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this transaction record?"
          onConfirm={() => onDelete(record._id)}
        >
          <DeleteOutlined className="!text-red-500 !text-xl !cursor-pointer  !p-2 rounded" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <HomeLayout>
      <div className="min-h-screen bg-slate-50 p-2 md:p-5">
        {/* Page Header */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
              Customer Accounts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage customer profiles, account details, statements and records.
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setEdit(false);
              setFormVisible(true);
            }}
            className="!h-10 !rounded-lg !bg-blue-600 !px-5 !font-semibold shadow-sm hover:!bg-blue-700"
          >
            Add Customer
          </Button>
        </div>

        {/* Create / Edit Customer Modal */}
        <Modal
          open={formVisible}
          onCancel={() => {
            setFormVisible(false);
            setEdit(false);
            form.resetFields();
          }}
          title={
            <div className="pr-6">
              <div className="text-base font-bold text-slate-800">
                {edit ? "Update Customer Account" : "Create Customer Account"}
              </div>
              <div className="mt-1 text-xs font-normal text-slate-500">
                {edit
                  ? "Update the customer's account information."
                  : "Enter the details below to register a new customer."}
              </div>
            </div>
          }
          footer={null}
          centered
          width={900}
          destroyOnClose={false}
          styles={{
            body: { padding: "8px 0 0" },
            header: { borderBottom: "1px solid #f1f5f9", paddingBottom: 16 },
          }}
        >
        {/* Registration Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Card Header */}
          <div className="border-b border-slate-100 bg-white px-4 py-3 md:px-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <span className="text-sm text-blue-600">+</span>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Customer Information
                </h2>
                <p className="text-[11px] text-slate-400">
                  Enter the customer's account details
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-4 md:p-5">
            <Form
              form={form}
              layout="vertical"
              onFinish={edit ? onUpdate : onFinish}
              size="small"
            >
              <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Hidden ID */}
                <Form.Item name="_id" hidden>
                  <Input />
                </Form.Item>

                {/* Full Name */}
                <Form.Item
                  name="fullname"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Full Name
                    </span>
                  }
                  rules={[{ required: true, message: "Enter full name" }]}
                  className="!mb-2"
                >
                  <Input
                    placeholder="Enter full name"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>
                <Form.Item name="customerId" label="Customer ID">
                  <Input
                    placeholder="Enter customer ID"
                    className="!h-9 !rounded-md"
                  />
                </Form.Item>

                {/* Account Number */}
                <Form.Item
                  name="accountNo"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Account No
                    </span>
                  }
                  rules={[{ required: true, message: "Enter Account No" }]}
                  className="!mb-2"
                >
                  <Input
                    placeholder="Enter account number"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>

                {/* Reference */}
                <Form.Item
                  name="reference"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Reference
                    </span>
                  }
                  className="!mb-2"
                >
                  <Input
                    placeholder="Enter reference"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>

                {/* Email */}
                <Form.Item
                  name="email"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Email
                    </span>
                  }
                  rules={[{ required: true, message: "Enter Your Email" }]}
                  className="!mb-2"
                >
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>

                {/* Mobile */}
                <Form.Item
                  name="mobile"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Mobile
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Enter Mobile Number",
                    },
                  ]}
                  className="!mb-2"
                >
                  <Input
                    placeholder="Enter mobile number"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>

                {/* Country */}
                <Form.Item
                  name="country"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Country
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Enter your Country",
                    },
                  ]}
                  className="!mb-2"
                >
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    options={countryOptions}
                    placeholder="Select a country"
                    className="w-full !text-sm"
                    size="large"
                  />
                </Form.Item>

                {/* Address */}
                <Form.Item
                  name="address"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Address
                    </span>
                  }
                  rules={[{ required: true, message: "Enter Address" }]}
                  className="!mb-2 sm:col-span-2"
                >
                  <Input
                    placeholder="Enter address"
                    className="!h-9 !rounded-md !border-slate-200 !text-sm hover:!border-blue-400 focus:!border-blue-500"
                  />
                </Form.Item>

                {/* Profile */}
                <Form.Item
                  name="profile"
                  label={
                    <span className="text-xs font-medium text-slate-600">
                      Profile Photo
                    </span>
                  }
                  valuePropName="fileList"
                  getValueFromEvent={(e) => e?.fileList}
                  className="!mb-2"
                >
                  <Upload beforeUpload={() => false} maxCount={1}>
                    <Button
                      icon={<UploadOutlined />}
                      className="!h-9 !rounded-md !border-slate-200 !text-xs !text-slate-600 hover:!border-blue-400 hover:!text-blue-600"
                    >
                      Select Photo
                    </Button>
                  </Upload>
                </Form.Item>
              </div>

              {/* Divider */}
              <div className="my-3 border-t border-slate-100" />

              {/* Submit */}
              <Form.Item className="!mb-0">
                <Button
                  type="text"
                  style={{
                    backgroundColor: edit ? "#fa8c16" : "#2563eb",
                  }}
                  htmlType="submit"
                  className="!h-9 !w-full !rounded-md !border-0 !text-sm !font-medium !text-white hover:!opacity-90"
                >
                  {edit ? "Update Customer" : "Create Customer"}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
        </Modal>

        {/* Accounts History */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ">
          {/* Header */}
          <div className="border-b border-slate-100 px-4 py-3 ">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Title */}
              <div>
                <h2 className="text-base font-semibold text-slate-700">
                  Accounts History
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  View and manage registered customers
                </p>
              </div>

              {/* Search + Print */}
              <div className="flex items-center gap-2">
                <Input
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={() => {
                    setAppliedSearch(searchText.trim());
                  }}
                  placeholder="Search..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="!h-8 !w-[240px] !rounded-md !text-xs"
                />

                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => {
                    setAppliedSearch(searchText.trim());
                  }}
                  className="!h-8 !rounded-md !px-3 !text-xs"
                >
                  Search
                </Button>

                {/* PRINT ALL ACCOUNTS */}
                <Button
                  icon={<PrinterOutlined />}
                  onClick={printallAccounts}
                  className="
                    !h-8
                    !rounded-md
                    !border-slate-200
                    !px-3
                    !text-xs
                    !text-slate-600
                    hover:!border-blue-400
                    hover:!text-blue-600
                    !font-bold
                  "
                >
                  Print
                </Button>
                <Button
                  icon={<DownCircleOutlined />}
                  onClick={exportAllAccountsToExcel}
                  className="!h-8 !rounded-md !border-green-200 !px-3
                  !text-xs
                  !text-green-600
                  hover:!border-green-400
                  hover:!text-green-700
                  !font-bold
                "
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Small table info bar */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2">
            <span className="text-[11px] text-slate-400">
              Customer Accounts
            </span>

            <span className="text-[11px] font-medium text-blue-600">
              {searchedUsers.length} customer
              {searchedUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table handles its own horizontal and vertical scrolling */}
        <Table
  rowKey="_id"
  columns={columns}
  dataSource={searchedUsers}
  bordered={false}
  scroll={{ x: "max-content", y: 560 }}
  sticky
  size="small"
  pagination={{
    defaultPageSize: 10,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} of ${total} accounts`,
    showQuickJumper: true,
  }}
  className="accounts-table compact-accounts-table !text-xs m-2"
/>



        </div>
      </div>
    </HomeLayout>
  );
};

export default Accounts;
