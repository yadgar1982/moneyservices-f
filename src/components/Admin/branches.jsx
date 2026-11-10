import React, { useState, } from 'react'
import { Form, Input, Button, Select, Table, Popconfirm ,Row,Col} from "antd";
import AdminLayout from "../Shared/Layouts/AdminLayout"
import { DeleteOutlined, EditOutlined,  BankOutlined,
  FileTextOutlined, } from "@ant-design/icons";
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

import {
  http, fetcher
} from "../Modules/http"

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
  <div className="w-full bg-white p-2 md:p-4">

    {/* PAGE HEADER */}
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-700">
        <BankOutlined />
      </div>

      <div>
        <h1 className="text-base font-bold text-slate-800">
          Branch Registration
        </h1>
        <p className="text-xs text-slate-400">
          Manage branch names and branch codes
        </p>
      </div>
    </div>

    {/* BRANCH FORM */}
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">

      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <FileTextOutlined className="text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Branch Information
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
          {/* BRANCH NAME */}
          <Col xs={24} md={12}>
            <Form.Item
              name="branch"
              label="Branch Name"
            >
              <Input
                placeholder="Enter branch name"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* BRANCH CODE */}
          <Col xs={24} md={12}>
            <Form.Item
              name="branchCode"
              label="Branch Code"
            >
              <Input
                placeholder="Enter branch code"
                className="!rounded-lg"
              />
            </Form.Item>
          </Col>

          {/* ACTION */}
          <Col span={24}>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">
                Review branch information before saving.
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
                {edit ? "Update Branch" : "Save Branch"}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>

    {/* BRANCH HISTORY */}
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">

      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800">
          Branches
        </h2>
        <p className="text-xs text-slate-400">
          Registered branches and their details
        </p>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={branchData || []}
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

export default Branches