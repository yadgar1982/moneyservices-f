import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Select, Upload, Divider, Table, Tag, Popconfirm, Avatar } from "antd";
import AdminLayout from "../Shared/Layouts/AdminLayout"
import { DeleteOutlined, EditOutlined, PrinterOutlined, UploadOutlined } from "@ant-design/icons";

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
const Branding = () => {
  const httpReq = http();
  const dispatch = useDispatch();
  // const { transactions, loading, error } = useSelector((state) => state.transactions);

  // useEffect(() => {
  //   dispatch(fetchTransaction());
  // }, []);



  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);




  const { data, derror } = SWR(
    "/api/branding/read",
    fetcher
  );
  const brandingData = data ? data.data : []
  console.log("branding data",brandingData)
  
  // create branding
  const onFinish = async (values) => {
    console.log('form',values)
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
        console.log("my form Data",pair[0], pair[1]);
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
    setEdit(true)
    form.setFieldsValue({
      _id: record._id,
      name: record.name,
      email: record.email,
      mobile: record.mobile,
      address: record.address,
   
    });

  };

  const onUpdate = async (values) => {
    const id=values._id;
    console.log("update values",values)

    try {
      delete values._id
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
  }



  //Delete User

  const onDelete = async (id) => {
    try {
      console.log("id",id)
      const res = await httpReq.delete(`/api/branding/delete/${id}`);
      mutate("/api/branding/read");
      toast.success("Branding deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  }



  // data sourse

  const columns = [
    {
      name: "Name",
      dataIndex: "name",
      width: 120,
      render: v => v || "—",
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
      render: v => v || "—",
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      width: 150,
      render: v => v || "—",
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
              borderRadius: 50
            }}
          />
        );
      }
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



  return (
    <AdminLayout>
      <div className='bg-white p-1 md:p-4'>
        <h1 className='text-xl font-bold text-zinc-600'>Branding Creation</h1>
        <Divider size='small' className='!border-zinc-300' />


        <div className='p-1 !w-full '>

          <Form form={form} layout="vertical" onFinish={edit ? onUpdate : onFinish}

            size="small">
            <div className="grid grid-cols-2 md:grid-cols-10 gap-0.5 bg-zinc-50 p-2 rounded-sm">


              {/* Name */}

              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Enter Company Name" }]}
                className="!mb-0 !w-full"
              >
                <Input placeholder="Company Name" size="small" className="!rounded-none !py-1 !h-8" />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Enter Company Email" }]}
                className="!mb-0 w-full"
              >
                <Input type="email" placeholder="Email" className="!rounded-none !py-1 !h-8 !w-full" />
              </Form.Item>

            
              {/* Mobile */}
              <Form.Item
                name="mobile"
                label="Mobile"
                rules={[{ required: true, message: "Enter Mobile Number" }]}
                className="!mb-0 w-full"
              >
                <Input type="mobile" placeholder="Mobile" className="!rounded-none !py-1 !h-8 !w-full" />
              </Form.Item>

              
              {/* Address */}
              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: "Enter Address" }]}
                className="!mb-0 w-full"
              >
                <Input placeholder="Address" className="!rounded-none !py-1 !h-8 !w-full" />
              </Form.Item>

             

              {/* Profile */}
              <Form.Item
                name="logo"
                label="Logo"
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

        <div className='p-2'>
          <h1 className='text-zinc-500 font-semibold py-2 text-xl'>Branding </h1>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={brandingData || []}
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

export default Branding