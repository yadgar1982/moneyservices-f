import HomeLayout from "../Shared/Layouts/HomeLayout";
import React from "react";
import { toast } from "react-toastify";
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

  const printStatement = (values) => {
    const { account, currency, fromDate, toDate } = values;

    // Start with all transactions
    let result = [...comissions];

    // Currency (required)
    result = result.filter((t) => t.currency === currency);

    // Account (optional)
    if (account) {
      result = result.filter((t) => String(t.accountNo) === String(account));
    }

    // Date (optional)
    if (fromDate || toDate) {
      result = result.filter((t) => {
        const tx = dayjs(t.createdAt);

        if (fromDate && tx.isBefore(fromDate, "day")) return false;
        if (toDate && tx.isAfter(toDate, "day")) return false;

        return true;
      });
    }

    // 🔹 4. Handle empty
    if (result.length === 0) {
      setResultText("No data to display");
      toast.error("No transactions found for the selected query.");
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
        const credit = Number(t.credit) || 0;
        const debit = Number(t.debit) || 0;

        if (!runningBalances[cur]) {
          runningBalances[cur] = 0;
        }

        runningBalances[cur] += credit;
        runningBalances[cur] -= debit;

        return `
       <tr>
    <td>${i + 1}</td>
    <td>${dayjs(t.createdAt).format("DD-MM-YYYY")}</td>
    <td>${t.details || "-"}</td>

    <td style="text-align:right;color:green">
        ${credit > 0 ? credit.toFixed(2) : "-"}
    </td>

    <td style="text-align:right;color:red">
        ${debit > 0 ? debit.toFixed(2) : "-"}
    </td>

    <td style="text-align:right;font-weight:bold">
        ${runningBalances[cur].toFixed(2)}
    </td>
</tr>
      `;
      })
      .join("");

    //  7. Total balances per currency
    const totals = {};
    sorted.forEach((t) => {
      const cur = t.currency;
      const credit = Number(t.credit) || 0;
      const debit = Number(t.debit) || 0;

      if (!totals[cur]) {
        totals[cur] = 0;
      }

      totals[cur] += credit;
      totals[cur] -= debit;
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
  <title>Comissoin Account Statement</title>

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
      <div class="info-value">${(account && account) || ""}</div>
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
          <th>Description</th>
          <th>Credit</th>
          <th>Debit</th>
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
        <Row gutter={[16, 16]} className="mb-6">
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
        <div className=" flex justify-center w-full">
          <Card
            variant={false}
            className="!w-full !md:!w-8/12 !rounded-[32px] !bg-white/80 !backdrop-blur-xl !border !border-white/40 !shadow-2xl !shadow-blue-100 !overflow-hidden"
            title={
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {edit ? "Update Commission" : "New Commission"}
                  </h2>

                  <p className="text-slate-500 mb-2">
                    Complete the information below
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
              <Row gutter={50}>
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
                      className="!rounded-xl"
                      placeholder="Customer Name"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="accountNo"
                    label="Account No"
                    className="!mb-0"
                  >
                    <Select
                      mode="tags"
                      size="large"
                      showSearch
                      placeholder="Select or enter Account No"
                      options={accountOptions}
                      className="!rounded-xl"
                      filterOption={(input, option) =>
                        option?.label
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
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
                      className="!rounded-xl"
                      placeholder="Select Currency"
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
                      className="!rounded-xl"
                      placeholder="Transaction Type"
                      options={[
                        {
                          value: "transaction fees",
                          label: "Transaction_Fees",
                        },
                        {
                          value: "transfer comission",
                          label: "Transfer_Fees",
                        },
                        {
                          value: "exchange comission",
                          label: "Exchange_Fees",
                        },
                        {
                          value: "expense",
                          label: "Expense",
                        },
                        {
                          value: "company_withdrawal",
                          label: "Company Withdrawal",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Credit" name="credit" initialValue={0}>
                    <InputNumber
                      size="large"
                      className="!rounded-xl"
                      min={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Debit" name="debit" initialValue={0}>
                    <InputNumber
                      size="large"
                      className="!rounded-xl"
                      min={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Transaction ID" name="transactionId">
                    <Input
                      size="large"
                      className="!rounded-xl"
                      readOnly={edit}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Transaction No" name="transactionNo">
                    <Input size="large" className="!rounded-xl" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Details" name="details">
                    <TextArea rows={3} placeholder="Commission details..." />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      className="!h-12 !px-10 !rounded-xl !font-semibold !bg-gradient-to-r !from-blue-600 !to-cyan-500 !border-0 
                    !shadow-lg hover:!scale-105 !transition-all !duration-300"
                    >
                      {edit ? "Update Commission" : "Save Commission"}
                    </Button>
                  </Form.Item>
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
              <h2 className="text-xl font-bold text-slate-800">
                Commission History
              </h2>

              <div className="flex justify-between items-center mt-2">
                <p className="text-slate-500">
                  Manage and review commission transactions
                </p>

                <div className="flex items-center gap-2">
                  <Tooltip title="Print Transactions">
                    <Button onClick={openModal}>
                      <PrinterOutlined />
                    </Button>
                  </Tooltip>

                  <Input.Search
                    placeholder="Search commissions..."
                    allowClear
                    size="middle"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="!w-72"
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
        <Form layout="vertical" onFinish={printStatement}>
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

          <Form.Item name="account" label="Account">
           <Select
      mode="tags"
      size="large"
      showSearch
      placeholder="Select or enter Account No"
      options={accountOptions}
      className="!rounded-xl"
      filterOption={(input, option) =>
        option?.label?.toLowerCase().includes(input.toLowerCase())
      }
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
    </HomeLayout>
  );
};

export default Commissions;
