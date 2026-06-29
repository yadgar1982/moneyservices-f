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

const Branches = () => {
  const httpReq = http();
  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const [edit, setEdit] = useState(false);


  const { data, derror } = SWR(
    "/api/branch/read",
    fetcher
  );
  const branchData = data ? data.data : []


  // create branch
  const onFinish = async (values) => {
    console.log('values', values)
    try {
      const httpReq = http();
      const data = await httpReq.post('/api/branch/create', values);
      toast.success("branch created successfully!");
      form.resetFields();
      mutate('/api/branch/read');
    } catch (err) {
      console.log(err);
    }
  }

  //update transaction
  const handleEdit = (record) => {
    console.log("record",record)
    setEdit(true)
    form.setFieldsValue({
      _id: record._id,
      branch: record.branch,
      branchCode: record.branchCode,

    });

  };

  const onUpdate = async (values) => {

    const id = values._id;
    if (!id) {
      toast.error("Id not found for update", "error")
    }
    try {
      const httpReq = http();
      await httpReq.put(`/api/branch/update/${id}`, values);
      toast.success("branch updated Successfully")
      mutate("/api/branch/read");
      form.resetFields();
      setEdit(false);
    } catch (err) {

      toast.error("Failed to update branch");
      console.error(err);
    }
  }



  //Delete User

  const onDelete = async (id) => {
    try {

      const res = await httpReq.delete(`/api/branch/delete/${id}`);
      mutate("/api/branch/read");
      toast.success("branch deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  }



  // data sourse

  const columns = [
    {
      title: "branch Name",
      dataIndex: "branch",
      width: 120,
      render: v => v || "—",
    },
    {
      title: "Branch Code",
      dataIndex: "branchCode",
      width: 150,
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
        <h1 className='text-xl font-bold text-zinc-600'>Branch Registeration</h1>
        <Divider size='small' className='!border-zinc-300' />


        <div className='p-1 !w-full '>

          <Form form={form} layout="vertical" onFinish={edit ? onUpdate : onFinish}

            size="small">
            <div className="grid grid-cols-2 md:grid-cols-10 gap-0.5 bg-zinc-50 p-2 rounded-sm">


              {/* Name */}

              <Form.Item name="_id" hidden>
                <Input />
              </Form.Item>
              {/* Mobile */}
              <Form.Item
                name="branch"
                label="Branch"
                className="!mb-0 w-full"
              >
                <Input placeholder="Branch" className="!rounded-none !py-1 !h-8 !w-full" />
              </Form.Item>
              <Form.Item
                name="branchCode"
                label="Branch Code"
                className="!mb-0 w-full"
              >
                <Input placeholder="Branch" className="!rounded-none !py-1 !h-8 !w-full" />
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
          <h1 className='text-zinc-500 font-semibold py-2 text-xl'>Branches </h1>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={branchData || []}
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

export default Branches