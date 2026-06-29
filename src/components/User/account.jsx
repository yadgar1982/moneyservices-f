import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  Divider,
  Table,
  Tag,
  Popconfirm,
  Avatar,
} from "antd";
import HomeLayout from "../Shared/Layouts/HomeLayout";
import {
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
const API_URL = import.meta.env.VITE_API_URL;

import { http, fetcher } from "../Modules/http";
import { fetchTransaction } from "../../redux/slices/transactionSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";
import { fetchUsers } from "../../redux/slices/customerSlice";

const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;

//getting user from localStorage
const userInfo = JSON.parse(localStorage.getItem("userInfo"));

const myUser = userInfo?.fullname;
const myBranch = userInfo?.branch;
const myBrand = JSON.parse(localStorage.getItem("branding"));

const Accounts = () => {
  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);

  const httpReq = http();
  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector(
    (state) => state.transactions,
  );

  useEffect(() => {
    dispatch(fetchTransaction());
    dispatch(fetchUsers());
  }, []);

  const { data, terror } = SWR("/api/user/read", fetcher);

  const userData = data ? data.data : [];
  const filteredUsers = userData.filter((item) => item.role == "customer");

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  // create Account
  // const onFinish = async (values) => {

  //   try {
  //     delete values._id;
  //      values.password = generatePassword();
  //     const formData = new FormData();
  //     // add normal fields
  //     Object.keys(values).forEach((key) => {
  //       if (key !== "profile") {
  //         formData.append(key, values[key]);
  //       }
  //     });

  //     // add file
  //     if (values.profile && values.profile.length > 0) {
  //       formData.append("profile", values.profile[0].originFileObj);
  //     }

  //     for (let pair of formData.entries()) {
  //       console.log(pair[0], pair[1]);
  //     }
  //     const res = await http().post("/api/user/create", formData);
  //     mutate("/api/user/read");
  //     toast.success("User created successfully!");
  //     form.resetFields();
  //     setCapturedImage(null);
  //     setSignatureImage(null);
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to create user!");
  //   }
  // };

  const onFinish = async (values) => {
    try {
      delete values._id;

      const formData = new FormData();

      // add normal fields
      Object.keys(values).forEach((key) => {
        if (key !== "profile") {
          formData.append(key, values[key]);
        }
      });

      //  handle profile image with compression
      if (values.profile && values.profile.length > 0) {
        const file = values.profile[0].originFileObj;

        let finalFile = file;

        // only compress if > 500KB
        if (file.size > 500 * 1024) {
          finalFile = await imageCompression(file, {
            maxSizeMB: 0.5, // target ~500KB
            maxWidthOrHeight: 800, // resize helps a lot
            useWebWorker: true,
          });
        }
        // add file
        formData.append("profile", finalFile);
      }

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      const res = await http().post("/api/user/create", formData);
      mutate("/api/user/read");
      toast.success("User created successfully!");
      form.resetFields();
      setCapturedImage(null);
      setSignatureImage(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user!");
    }
  };

  //update Account
  const handleEdit = (record) => {
    setEdit(true);
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
      password: "123456",
      isPass: record.isPass,
    });
  };

  const onUpdate = async (values) => {
    try {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === "password") return;
        if (key !== "profile") {
          formData.append(key, values[key]);
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

        if (!balances[currency]) balances[currency] = 0;

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
          <span>${currency}</span>
          <strong>${balance.toFixed(2)}</strong>
        </div>
      `,
      )
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Account Statement</title>

        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f5f7fa;
            padding: 30px;
            color: #333;
          }

          .profile-img {
              width: 90px;
              height: 90px;
              border-radius: 10%;
              overflow: hidden;
              border: 3px solid #113b8a;
              flex-shrink: 0;
            }

            .profile-img img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          .container {
            max-width: 800px;
            margin: auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            overflow: hidden;
          }

          /* HEADER */
          .header {
            background:#fff;
            color: #605c5c;
            padding: 25px;
            text-align: center;
          }

          .logo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            overflow: hidden;
            margin: 0 auto 10px;
            border: 2px solid white;
          }

          .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .header h2 {
            margin: 5px 0 0;
          }

          /* SECTION */
          .section {
            padding: 20px 30px;
          }

          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #113b8a;
          }

          /* ACCOUNT GRID */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
            font-size: 14px;
          }

          .info-item span {
            color: #777;
            font-size: 12px;
            display: block;
          }

          .info-item strong {
            font-size: 14px;
          }

          /* BALANCE */
          .balances {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
          }

          .balance-card {
            background: #f1f5ff;
            border: 1px solid #dbe4ff;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
          }

          .balance-card span {
            display: block;
            font-size: 12px;
            color: #666;
          }

          .balance-card strong {
            font-size: 18px;
            color: #113b8a;
          }

          /* FOOTER */
          .footer {
            text-align: center;
            font-size: 12px;
            color: #888;
            padding: 15px;
            border-top: 1px solid #eee;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }

            .container {
              box-shadow: none;
            }
          }
        </style>
      </head>

     <body>

  <div class="container">

    <!--  HEADER WITH BRAND INFO -->
    <div class="header">
      <div class="logo">
        <img src="${API_URL}${myBrand.data[0].logo}" />
      </div>

      <h2>${myBrand.data[0].name || "Company Name"}</h2>
      <p style="margin:5px 0;font-size:13px;">
        ${myBrand.data[0].email || ""} | 
        ${myBrand.data[0].mobile || ""}
      </p>
      <p style="font-size:12px;">
        ${myBrand.data[0].address || ""}
      </p>
    </div>
    <hr/

    <!-- 🔥 PROFILE + ACCOUNT INFO -->
    <div class="section">

      <div style="display:flex; gap:25px; align-items:center;">

        <!-- PROFILE IMAGE -->
        <div class="profile-img">
          <img src="${API_URL}${record.profile}" />
        </div>

        <!-- USER DETAILS -->
        <div class="info-grid" style="flex:1;">
          
          <div class="info-item">
            <span>Full Name</span>
            <strong>${record.fullname || "-"}</strong>
          </div>

          <div class="info-item">
            <span>Account Number</span>
            <strong>${record.accountNo || "-"}</strong>
          </div>

          <div class="info-item">
            <span>Email</span>
            <strong>${record.email || "-"}</strong>
          </div>

          <div class="info-item">
            <span>Phone</span>
            <strong>${record.phone || "-"}</strong>
          </div>

          <div class="info-item">
            <span>Address</span>
            <strong>${record.address || "-"}</strong>
          </div>

          <div class="info-item">
            <span>Created At</span>
            <strong>${
              record.createdAt
                ? new Date(record.createdAt).toLocaleDateString()
                : "-"
            }</strong>
          </div>

        </div>
      </div>
    </div>

    <!-- 🔥 BALANCES -->
    <div class="section">
      <div class="section-title">Balances</div>
      <div class="balances">
        ${balanceHTML || "<p>No balance available</p>"}
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      Powered by ${myBrand.data[0].name || "Your Company"}
    </div>

  </div>

</body>
    </html>
  `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 700);
  };

  const printallAccounts = () => {
    const printWindow = window.open("", "", "width=1000,height=700");

    if (!printWindow) {
      alert("Popup blocked!");
      return;
    }

    // ✅ Balance calculator per account
    const getBalancesByAccount = (accountNo) => {
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

    // ✅ Generate rows
   const rowsHTML = filteredUsers.map((user, index) => {
  const balances = getBalancesByAccount(user.accountNo);

  const balanceHTML = Object.entries(balances)
    .map(([cur, bal]) => {
      const colorClass = `currency-${cur.toLowerCase()}`;

      return `
        <span class="currency-badge ${colorClass}">
          ${cur}: ${bal.toFixed(2)}
        </span>
      `;
    })
    .join("");

  return `
    <tr>
      <td>${index + 1}</td>
      <td>${user.fullname || "-"}</td>
      <td>${user.accountNo || "-"}</td>
      <td>${balanceHTML || "<span>0.00</span>"}</td>
    </tr>
  `;
}).join("");

    //  Print UI
    printWindow.document.write(`
    <html>
      <head>
        <title>All Accounts Report</title>

        <style>
        .currency-badge {
        display: inline-block;
        padding: 6px 10px;
        margin: 3px;
        border-radius: 5px;
        font-size: 12px;
        font-weight: 600;
        fonr:bold;
        color: black;
      }

      /*  Currency colors */
      .currency-usd {
        background: #d9e9dd; /* green */
      }

      .currency-eur {
        background: #c8d2db; /* blue */
      }

      .currency-afn {
        background: #c4bbd4; /* purple */
      }

      .currency-inr {
        background: #e1d1c3; /* orange */
      }

      .currency-pkr {
        background: #cbe5dd; /* teal */
      }

      /* fallback if unknown currency */
      .currency-badge:not([class*="currency-"]) {
        background: #696c6f;
      }
          body {
            font-family: 'Segoe UI', Arial;
            padding: 20px;
            color: #333;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }

          .logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            overflow: hidden;
            margin: 0 auto 10px;
          }

          .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          h2 {
            margin: 5px 0;
          }

          .brand-info {
            font-size: 12px;
            color: #666;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th {
            background: #113b8a;
            color: white;
            padding: 10px;
            font-size: 13px;
          }

          td {
            padding: 10px;
            border: 1px solid #ddd;
            font-size: 13px;
          }

          tr:nth-child(even) {
            background: #f9f9f9;
          }

          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }

          @media print {
            body { padding: 0; }
          }
        </style>
      </head>

      <body>

        <!--  BRAND HEADER -->
        <div class="header">
          <div class="logo">
            <img src="${API_URL}${myBrand.data[0].logo}" />
          </div>

          <h2>${myBrand.data[0].name || "Company Name"}</h2>

          <div class="brand-info">
            ${myBrand.data[0].email || ""} <br/>
            ${myBrand.data[0].address || ""}
          </div>

          <h3 style="margin-top:15px;">All Accounts Report</h3>
        </div>

        <!--  TABLE -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Account No</th>
              <th>Balances (Currency)</th>
            </tr>
          </thead>

          <tbody>
            ${rowsHTML || "<tr><td colspan='4'>No data</td></tr>"}
          </tbody>
        </table>

        <!-- FOOTER -->
        <div class="footer">
          Generated on ${new Date().toLocaleString()}
        </div>

      </body>
    </html>
  `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 700);
  };
  // data sourse

  const columns = [
    {
      title: "Account",
      dataIndex: "accountNo",
      width: 150,
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
          onClick={() => printAccount(record)}
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
      <div className="bg-white p-1 md:p-4">
        <h1 className="text-xl font-bold text-zinc-600">
          Accounts Registration
        </h1>
        <Divider size="small" className="!border-zinc-300" />

        <div className="p-1 !w-full ">
          <Form
            form={form}
            layout="vertical"
            onFinish={edit ? onUpdate : onFinish}
            size="small"
          >
            <div className="grid grid-cols-2 md:grid-cols-10 gap-0.5 bg-zinc-50 p-2 rounded-sm">
              {/* Full Name */}

              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="fullname"
                label="Full Name"
                rules={[{ required: true, message: "Enter full name" }]}
                className="!mb-0 !w-full"
              >
                <Input
                  placeholder="Full Name"
                  size="small"
                  className="!rounded-none !py-1 !h-8"
                />
              </Form.Item>
              <Form.Item
                name="accountNo"
                label="Account No"
                rules={[{ required: true, message: "Enter Account No" }]}
                className="!mb-0 !w-full"
              >
                <Input
                  placeholder="Account No"
                  size="small"
                  className="!rounded-none !py-1 !h-8"
                />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Enter Your Email" }]}
                className="!mb-0 w-full"
              >
                <Input
                  type="email"
                  placeholder="Email"
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Password */}
              {/* <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Enter your Password" }]}
                className="!mb-0 w-full"
              >
                <Input type="password" placeholder="Password" className="!rounded-none !py-1 !h-8 !w-full" />
              </Form.Item> */}
              {/* Mobile */}
              <Form.Item
                name="mobile"
                label="Mobile"
                rules={[{ required: true, message: "Enter Mobile Number" }]}
                className="!mb-0 w-full"
              >
                <Input
                  type="mobile"
                  placeholder="Mobile"
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Country */}
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: "Enter your Country" }]}
                className="!mb-0 w-full"
              >
                <Input
                  placeholder="Country"
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Address */}
              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: "Enter Address" }]}
                className="!mb-0 w-full"
              >
                <Input
                  placeholder="Address"
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Role */}
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: "Enter Role" }]}
                className="!mb-0 w-full"
              >
                <Select
                  showSearch={{
                    filterOption: (input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase()),
                  }}
                  placeholder="Select a role"
                  options={[{ value: "customer", label: "Customer" }]}
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Profile */}
              <Form.Item
                name="profile"
                label="Profile"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
              </Form.Item>

              {/* Submit */}
              <Form.Item className="col-span-2 md:col-span-10 !mt-8 !mb-0">
                <Button
                  type="text"
                  style={{ backgroundColor: edit ? "#fa8c16" : "gray" }}
                  htmlType="submit"
                  className="!rounded-none !w-full !bg-zinc-500 !text-white hover:!bg-green-500 hover:!text-white !border-zinc-100 !h-8"
                >
                  {edit ? "Update " : "Submit "}
                </Button>
              </Form.Item>
            </div>
          </Form>
        </div>

        <div className="p-2">
          <div className="flex gap-4 items-center">
            <h1 className="text-zinc-500 font-semibold py-2 text-xl">
              Accounts History
            </h1>
            <span className="text-zinc-400">|</span>
            <Button
              className="!border-0  text-2xl !bg-white  !shadow-0"
              type="text"
              onClick={printallAccounts}
              icon={<PrinterOutlined className="!text-2xl !text-zinc-500 !shadow-0" />}
            />
          </div>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredUsers || []}
            bordered
            scroll={{ x: "max-content" }}
            sticky
            size="small"
            pagination={{
              pageSize: 10,
            }}
            className="!compact-table !text-[10px] !mb-5"
            style={{
              width: "100%",
              tableLayout: "auto",
              borderRadius: 0,
              fontSize: "10px",
              padding: "0px",
            }}
          />
        </div>
      </div>
    </HomeLayout>
  );
};

export default Accounts;
