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
import AdminLayout from "../Shared/Layouts/AdminLayout";
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user!");
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
      <div className="bg-white p-1 md:p-4">
        <h1 className="text-xl font-bold text-zinc-600">User Registration</h1>
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
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Enter your Password" }]}
                className="!mb-0 w-full"
              >
                <Input
                  type="password"
                  placeholder="Password"
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

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
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "user", label: "User" },
                    { value: "customer", label: "Customer" },
                    { value: "power", label: "Power" },
                  ]}
                  className="!rounded-none !py-1 !h-8 !w-full"
                />
              </Form.Item>

              {/* Branch */}
              <Form.Item
                name="branch"
                label="Branch"
                rules={[{ required: true, message: "Enter Branch" }]}
                className="!mb-0 w-full"
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
          <h1 className="text-zinc-500 font-semibold py-2 text-xl">
            User History
          </h1>
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
    </AdminLayout>
  );
};

export default Register;
