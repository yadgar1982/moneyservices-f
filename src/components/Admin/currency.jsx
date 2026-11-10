import React, { useState, } from 'react'
import { Form, Input, Button, Select, Row,Col, Table, Popconfirm } from "antd";
import AdminLayout from "../Shared/Layouts/AdminLayout"
import { DeleteOutlined, DollarCircleOutlined, EditOutlined, FileTextOutlined, } from "@ant-design/icons";
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

import {
  http, fetcher
} from "../Modules/http"
import { fetchTransaction } from '../../redux/slices/transactionSlice';
import { useDispatch, useSelector } from 'react-redux';
import SWR, { mutate } from "swr";


const shutterSound = new Audio("./camera.mp3");
shutterSound.volume = 0.2;


const { Option } = Select;

const Currency = () => {
  const httpReq = http();
  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);


  const { data, derror } = SWR(
    "/api/currency/read",
    fetcher
  );
  const currencyData = data ? data.data : []


  // create currency
  const onFinish = async (values) => {
    console.log('values', values)
    try {
      const httpReq = http();
      const data = await httpReq.post('/api/currency/create', values);
      toast.success("Currency created successfully!");
      form.resetFields();
      mutate('/api/currency/read');
    } catch (err) {
      console.log(err);
    }
  }

  //update transaction
  const handleEdit = (record) => {
    setEdit(true)
    form.setFieldsValue({
      _id: record._id,
      currency: record.currency,
      rate: record.rate,

    });

  };

  const onUpdate = async (values) => {

    const id = values._id;
    if (!id) {
      toast.error("Id not found for update", "error")
    }
    try {
      const httpReq = http();
      await httpReq.put(`/api/currency/update/${id}`, values);
      toast.success("Currency updated Successfully")
      mutate("/api/currency/read");
      form.resetFields();
      setEdit(false);
    } catch (err) {

      toast.error("Failed to update currency");
      console.error(err);
    }
  }



  //Delete User

  const onDelete = async (id) => {
    try {

      const res = await httpReq.delete(`/api/currency/delete/${id}`);
      mutate("/api/currency/read");
      toast.success("currency deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  }



  // data sourse

  const columns = [
    {
      name: "Currency Name",
      dataIndex: "currency",
      width: 120,
      render: v => v || "—",
    },
    {
      title: "Rate",
      dataIndex: "rate",
      width: 150,
    },
    {
  title: "Country",
  dataIndex: "country",
  width: 150,
  render: (country) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img
        src={`https://flagcdn.com/w20/${country}.png`}
        width="20"
        style={{ borderRadius: "2px" }}
      />
      <span>{country?.toUpperCase()}</span>
    </div>
  ),
},

    // Actions (fixed right)

    {
      title: "Edit",
      key: "edit",
      fixed: "right",
      width: 60,
      render: (_, record) => (
        <EditOutlined onClick={() => handleEdit(record)} className="!text-blue-600 !text-xl !cursor-pointer  !p-2 rounded" />
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

  const curdata = [
    { code: "USD", country: "us" },
    { code: "AFN", country: "af" },
    { code: "IRR", country: "ir" },
    { code: "PKR", country: "pk" },
    { code: "UZS", country: "uz" },
    { code: "CNY", country: "cn" },
    { code: "AED", country: "ae" },
    { code: "SAR", country: "sa" },
    { code: "RUB", country: "ru" }
  ];
  const currencies = curdata.map((item) => ({
    value: item.code,
    country:item.country,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={`https://flagcdn.com/w20/${item.country}.png`}
          width="20"
          style={{ borderRadius: "2px" }}
        />
        {item.code} {item.name}
      </div>
    )
  }));
  return (
   <AdminLayout>
  <div className="w-full bg-white p-2 md:p-4">

    {/* PAGE HEADER */}
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-700">
        <DollarCircleOutlined />
      </div>
      <div>
        <h1 className="text-base font-bold text-slate-800">
          Currency Registration
        </h1>
        <p className="text-xs text-slate-400">
          Manage currencies and exchange rates
        </p>
      </div>
    </div>

    {/* CURRENCY FORM */}
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">

      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <FileTextOutlined className="text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Currency Information
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

        <Form.Item name="country" hidden>
          <Input />
        </Form.Item>

        <Row gutter={[16, 4]}>
          {/* CURRENCY */}
          <Col xs={24} md={12}>
            <Form.Item
              name="currency"
              label="Currency Name"
              rules={[
                {
                  required: true,
                  message: "Enter Currency Name",
                },
              ]}
            >
              <Select
                options={currencies}
                optionLabelProp="label"
                showSearch
                placeholder="Select currency"
                className="!rounded-lg"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value, option) => {
                  form.setFieldsValue({
                    currency: value,
                    country: option.country,
                  });
                }}
              />
            </Form.Item>
          </Col>

          {/* RATE */}
          <Col xs={24} md={12}>
            <Form.Item
              name="rate"
              label="Exchange Rate"
            >
              <Input
                type="number"
                placeholder="Enter exchange rate"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* ACTION */}
          <Col span={24}>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                Review currency information before saving.
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
                {edit ? "Update Currency" : "Save Currency"}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>

    {/* CURRENCY HISTORY */}
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800">
          Currency History
        </h2>
        <p className="text-xs text-slate-400">
          Registered currencies and exchange rates
        </p>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={currencyData || []}
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
  )
}

export default Currency