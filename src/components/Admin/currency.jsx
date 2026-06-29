import React, { useState, } from 'react'
import { Form, Input, Button, Select, Divider, Table, Popconfirm } from "antd";
import AdminLayout from "../Shared/Layouts/AdminLayout"
import { DeleteOutlined, EditOutlined, } from "@ant-design/icons";
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
      <div className='bg-white p-1 md:p-4'>
        <h1 className='text-xl font-bold text-zinc-600'>Currency Registeration</h1>
        <Divider size='small' className='!border-zinc-300' />


        <div className='p-1 !w-full '>

          <Form form={form} layout="vertical" onFinish={edit ? onUpdate : onFinish}

            size="small">
            <div className="grid grid-cols-2 md:grid-cols-10 gap-0.5 bg-zinc-50 p-2 rounded-sm">


              {/* Name */}

              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="country" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="currency"
                label="Currency Name"
                rules={[{ required: true, message: "Enter Currency Name" }]}
                className="!mb-0 !w-full"
              >
                <Select
                  options={currencies}
                  optionLabelProp="label"
                  showSearch
                  className="!rounded-none h-8"
                  onChange={(value, option) => {
                    form.setFieldsValue({
                      currency: value,
                      country: option.country
                    });
                  }}
                />
              </Form.Item>



              {/* Mobile */}
              <Form.Item
                name="rate"
                label="Rate"
                className="!mb-0 w-full"
              >
                <Input type="number" placeholder="Rate" className="!rounded-none !py-1 !h-8 !w-full" />
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

        <div className='p-2'>
          <h1 className='text-zinc-500 font-semibold py-2 text-xl'>currency </h1>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={currencyData || []}
            bordered
            scroll={{ x: 'max-content' }}
            sticky
            size='small'
            pagination={{
              pageSize: 10,
            }}
            className="!compact-table !text-[10px] !mb-5"
            style={{
              width: '100%',
              tableLayout: 'auto',
              borderRadius: 0,
              fontSize: '10px',
              padding: '0px',
            }}
          />

        </div>
      </div>
    </AdminLayout>
  )
}

export default Currency