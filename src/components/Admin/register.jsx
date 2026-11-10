import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Upload,
  Divider,
  Table,
  Row,
  Col,
  Popconfirm,
  Avatar,
} from "antd";
import AdminLayout from "../Shared/Layouts/AdminLayout";
import {
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";

const API_URL = import.meta.env.VITE_API_URL;

import { http, fetcher } from "../Modules/http";
import { fetchBranch } from "../../redux/slices/branchSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";

const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;
const Register = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [form] = Form.useForm();
  const [capturedImage, setCapturedImage] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [edit, setEdit] = useState(false);
  const [scannedDoc, setScannedDoc] = useState(null);

  const httpReq = http();
  const dispatch = useDispatch();
  const { branches, brloading, brerror } = useSelector(
    (state) => state.branches,
  );

  useEffect(() => {
    dispatch(fetchBranch());
  }, []);

  const { data, trerror } = SWR("/api/user/read", fetcher);

  const userData = data ? data.data : [];
  const filteredUsers = userData.filter((item) => item.role != "customer");

  // create user
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
    } catch (error) {
  console.log("REGISTER ERROR:", error.response?.data);

  if (error.response?.status === 400) {
    toast.error(
      error.response?.data?.message || "User already exists"
    );
  } else {
    toast.error("Registration failed. Please try again.");
  }
}
  };

  //update user
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

  //delete user

  const onDelete = async (id) => {
    try {
      const res = await httpReq.delete(`/api/user/delete/${id}`);
      mutate("/api/user/read");
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // data sourse
  const columns = [
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
      title: "Branch",
      dataIndex: "branch",
      width: 150,
      render: (v) => v || "—",
    },
    {
      title: "Role",
      dataIndex: "role",
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
          onClick={(record) => alert(record)}
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
  <AdminLayout>
  <div className="w-full bg-white p-2 md:p-4">

    {/* PAGE HEADER */}
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-700">
        <UserOutlined />
      </div>
      <div>
        <h1 className="text-base font-bold text-slate-800">
          User Registration
        </h1>
        <p className="text-xs text-slate-400">
          Manage user accounts and access information
        </p>
      </div>
    </div>

    {/* REGISTRATION FORM */}
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <UserOutlined className="text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          User Information
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={edit ? onUpdate : onFinish}
        autoComplete="off"
        size="middle"
      >
        <Form.Item name="_id" hidden>
          <Input />
        </Form.Item>

        <Row gutter={[16, 4]}>
          {/* FULL NAME */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="fullname"
              label="Full Name"
              rules={[
                { required: true, message: "Enter full name" },
              ]}
            >
              <Input
                placeholder="Full Name"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* EMAIL */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Enter Your Email" },
              ]}
            >
              <Input
                type="email"
                placeholder="Email"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* PASSWORD */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Enter your Password" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* MOBILE */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="mobile"
              label="Mobile"
              rules={[
                { required: true, message: "Enter Mobile Number" },
              ]}
            >
              <Input
                type="tel"
                placeholder="Mobile Number"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* COUNTRY */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="country"
              label="Country"
              rules={[
                { required: true, message: "Enter your Country" },
              ]}
            >
              <Input
                placeholder="Country"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* ADDRESS */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="address"
              label="Address"
              rules={[
                { required: true, message: "Enter Address" },
              ]}
            >
              <Input
                placeholder="Address"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* ROLE */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="role"
              label="Role"
              rules={[
                { required: true, message: "Enter Role" },
              ]}
            >
              <Select
                showSearch={{
                  filterOption: (input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase()),
                }}
                placeholder="Select a role"
                options={[
                  { value: "admin", label: "Admin" },
                  { value: "user", label: "User" },
                  { value: "customer", label: "Customer" },
                  { value: "power", label: "Power" },
                ]}
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* BRANCH */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="branch"
              label="Branch"
              rules={[
                { required: true, message: "Enter Branch" },
              ]}
            >
              <Select
                showSearch
                placeholder="Select a branch"
                options={branches?.map((b) => ({
                  value: b.branch,
                  label: b.branch,
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* PROFILE */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item
              name="profile"
              label="Profile"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
              >
                <Button
                  icon={<UploadOutlined />}
                  className="!rounded-lg"
                >
                  Select File
                </Button>
              </Upload>
            </Form.Item>
          </Col>

          {/* SUBMIT BUTTON */}
          <Col span={24}>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                Review user information before saving.
              </span>

              <Button
                type="primary"
                htmlType="submit"
                size="middle"
                className={`!h-10 !rounded-lg !border-0 !px-7 !font-semibold ${
                  edit
                    ? "!bg-orange-500 hover:!bg-orange-600"
                    : "!bg-blue-700 hover:!bg-blue-800"
                }`}
              >
                {edit ? "Update User" : "Register User"}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>

    {/* USER HISTORY */}
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            User History
          </h2>
          <p className="text-xs text-slate-400">
            Registered users and account information
          </p>
        </div>
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
        className="!compact-table !mb-5"
        style={{
          width: "100%",
          tableLayout: "auto",
          borderRadius: 8,
          fontSize: "12px",
          padding: 0,
        }}
      />
    </div>
  </div>
</AdminLayout>
  );
};

export default Register;
