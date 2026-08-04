import React, { useState, useEffect } from "react";

import {
  Form,
  Input,
  Button,
  Upload,
  Divider,
  Table,
  Popconfirm,
  Avatar,
  Card,
  Select,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import AdminLayout from "../Shared/Layouts/AdminLayout";

import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

import { http, fetcher } from "../Modules/http";
import { fetchTransaction } from "../../redux/slices/transactionSlice";
import { useDispatch, useSelector } from "react-redux";
import SWR, { mutate } from "swr";

const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;

const { Option } = Select;
const Branding = () => {
  const httpReq = http();
  const dispatch = useDispatch();
  // const { transactions, loading, error } = useSelector((state) => state.transactions);

  // useEffect(() => {
  //   dispatch(fetchTransaction());
  // }, []);

  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);

  const { data, derror } = SWR("/api/branding/read", fetcher);
  const brandingData = data ? data.data : [];
  console.log("branding data", brandingData);

  // create branding
  const onFinish = async (values) => {
    console.log("form", values);
    try {
      delete values._id;
      const formData = new FormData();

      // add normal fields
      Object.keys(values).forEach((key) => {
        if (key !== "logo") {
          formData.append(key, values[key]);
        }
      });

      // add file
      if (values.logo && values.logo.length > 0) {
        formData.append("logo", values.logo[0].originFileObj);
      }

      for (let pair of formData.entries()) {
        console.log("my form Data", pair[0], pair[1]);
      }

      const res = await httpReq.post("/api/branding/create", formData);
      mutate("/api/branding/read");
      toast.success("Branding created successfully!");
      form.resetFields();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create branding!");
    }
  };

  //update transaction
  const handleEdit = (record) => {
    setEdit(true);

    form.setFieldsValue({
      _id: record._id,

      // Company Info
      companyName: record.companyName,
      email: record.email,
      mobile: record.mobile,
      address: record.address,
      website: record.website,

      // Branding
      primaryColor: record.primaryColor,
      secondaryColor: record.secondaryColor,
      footerText: record.footerText,

      // Logo
      logo: record.logo
        ? [
            {
              uid: "-1",
              name: "logo.png",
              status: "done",
              url: `${API_URL}${record.logo}`,
            },
          ]
        : [],
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const onUpdate = async (values) => {
    const id = values._id;
    console.log("update values", values);

    try {
      delete values._id;
      const formData = new FormData();
      // add normal fields
      Object.keys(values).forEach((key) => {
        if (key !== "logo") {
          formData.append(key, values[key]);
        }
      });

      //add files id changed
      if (values.logo && values.logo.length > 0) {
        formData.append("logo", values.logo[0].originFileObj);
      }

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      const res = await http().put(`/api/branding/update/${id}`, formData);
      mutate("/api/branding/read");
      toast.success("Branding updated successfully!");
      form.resetFields();
      setEdit(false);
    } catch (err) {
      console.error(err);
    }
  };

  //Delete User

  const onDelete = async (id) => {
    try {
      console.log("id", id);
      const res = await httpReq.delete(`/api/branding/delete/${id}`);
      mutate("/api/branding/read");
      toast.success("Branding deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // data sourse

  const columns = [
    {
      name: "Company",
      dataIndex: "companyName",
      width: 120,
      render: (v) => v || "—",
    },
    {
      title: "Address",
      dataIndex: "address",
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
      title: "Photo",
      dataIndex: "logo",
      render: (_, record) => {
        console.log("LOGO:", record?.logo);

        return (
          <Avatar
            src={record?.logo ? `${API_URL}${record.logo}` : ""}
            alt="logo"
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
      <div className="min-h-screen bg-slate-50 p-3 md:p-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-700">
            Branding Settings
          </h1>

          <p className="text-sm text-slate-500">
            Manage company identity, logo and receipt branding
          </p>
        </div>
        <Divider size="small" className="!border-zinc-300" />
        <Divider size="small" className="!border-zinc-300" />

        <Card cclassName="!rounded-xl !shadow-sm !border-slate-200">
          <Form
            form={form}
            layout="vertical"
            onFinish={edit ? onUpdate : onFinish}
            size="small"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-xl">
              {/* Hidden ID */}
              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>

              {/* Company Name */}
              <Form.Item
                name="companyName"
                label="Company Name"
                rules={[
                  {
                    required: true,
                    message: "Enter Company Name",
                  },
                ]}
                className="!mb-0"
              >
                <Input placeholder="Company Name" />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Enter Email",
                  },
                ]}
                className="!mb-0"
              >
                <Input type="email" placeholder="Company Email" />
              </Form.Item>

              {/* Mobile */}
              <Form.Item name="mobile" label="Mobile" className="!mb-0">
                <Input placeholder="Mobile Number" />
              </Form.Item>

              {/* Address */}
              <Form.Item name="address" label="Address" className="!mb-0">
                <Input placeholder="Company Address" />
              </Form.Item>

              {/* Website */}
              <Form.Item name="website" label="Website" className="!mb-0">
                <Input placeholder="www.example.com" />
              </Form.Item>

              {/* Logo */}
              <Form.Item
                name="logo"
                label="Company Logo"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
                className="!mb-0"
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Select Logo</Button>
                </Upload>
              </Form.Item>

              {/* Primary Color */}
              <Form.Item
                name="primaryColor"
                label="Primary Color"
                initialValue="#059669"
                className="!mb-0"
              >
                <Input type="color" />
              </Form.Item>

              {/* Secondary Color */}
              <Form.Item
                name="secondaryColor"
                label="Secondary Color"
                initialValue="#0f172a"
                className="!mb-0"
              >
                <Input type="color" />
              </Form.Item>

              {/* Footer Text */}
              <Form.Item
                name="footerText"
                label="Footer Text"
                className="!mb-0 xl:col-span-2"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Thank you for your business"
                />
              </Form.Item>

              {/* Submit */}
              <Form.Item
                className="
      col-span-1 
      md:col-span-2 
      xl:col-span-4 
      !mt-6 
      !mb-0
      "
              >
                <Button
                  type="text"
                  style={{
                    backgroundColor: edit ? "#f59e0b" : "#059669",
                  }}
                  htmlType="submit"
                  className="
        !rounded-md
        !w-full
        !h-10
        !font-semibold
        !text-white
        "
                >
                  {edit ? "Update Branding" : "Create Branding"}
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card className="!mt-6 !rounded-xl !shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Company Branding
          </h2>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={brandingData || []}
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
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Branding;
