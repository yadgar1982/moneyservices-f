import React, { useState } from "react";

import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Select,
  DatePicker,
  Table,
  Input,
  Tag,
} from "antd";

import {
  FileTextOutlined,
  BankOutlined,
  UserOutlined,
  DollarOutlined,
  SwapOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import HomeLayout from "../Shared/Layouts/HomeLayout";

const { Content } = Layout;
const { RangePicker } = DatePicker;

const Reports = () => {

  const [reportType, setReportType] = useState("transactions");

  // SAMPLE DATA
  const data = [
    {
      key: 1,
      customer: "Hadya Fardin",
      branch: "Kabul",
      currency: "USD",
      amount: 5000,
      type: "transfer",
      date: "2026-05-22",
      status: "Completed",
    },

    {
      key: 2,
      customer: "Ahmad Khan",
      branch: "Herat",
      currency: "AFN",
      amount: 250000,
      type: "exchange",
      date: "2026-05-21",
      status: "Pending",
    },
  ];

  const columns = [
    {
      title: "Customer",
      dataIndex: "customer",
      sorter: (a, b) =>
        a.customer.localeCompare(b.customer),

      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <UserOutlined className="text-cyan-400" />
          </div>

          <span className="text-white font-medium">
            {v}
          </span>
        </div>
      ),
    },

    {
      title: "Branch",
      dataIndex: "branch",

      render: (v) => (
        <Tag color="blue" className="!rounded-full !px-4 !py-1">
          {v}
        </Tag>
      ),
    },

    {
      title: "Currency",
      dataIndex: "currency",

      render: (v) => (
        <Tag
          color="purple"
          className="!rounded-full !px-4 !py-1"
        >
          {v}
        </Tag>
      ),
    },

    {
      title: "Amount",
      dataIndex: "amount",

      sorter: (a, b) => a.amount - b.amount,

      render: (v) => (
        <span className="text-emerald-400 font-bold">
          {Number(v).toLocaleString()}
        </span>
      ),
    },

    {
      title: "Type",
      dataIndex: "type",

      filters: [
        {
          text: "Transfer",
          value: "transfer",
        },

        {
          text: "Exchange",
          value: "exchange",
        },
      ],

      onFilter: (value, record) =>
        record.type === value,

      render: (v) => (
        <Tag
          color={
            v === "transfer"
              ? "cyan"
              : "orange"
          }
          className="!rounded-full !px-4 !py-1"
        >
          {v}
        </Tag>
      ),
    },

    {
      title: "Date",
      dataIndex: "date",

      sorter: (a, b) =>
        new Date(a.date) - new Date(b.date),

      render: (v) => (
        <span className="text-zinc-300">
          {v}
        </span>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",

      render: (v) => (
        <Tag
          color={
            v === "Completed"
              ? "green"
              : "orange"
          }
          className="!rounded-full !px-4 !py-1"
        >
          {v}
        </Tag>
      ),
    },
  ];

  const reportCards = [
    {
      title: "Customer Statement",
      icon: <UserOutlined />,
      color: "from-cyan-500 to-blue-700",
    },

    {
      title: "Branch Statement",
      icon: <BankOutlined />,
      color: "from-emerald-500 to-green-700",
    },

    {
      title: "Account Statement",
      icon: <DollarOutlined />,
      color: "from-orange-400 to-red-500",
    },

    {
      title: "Transfers & Exchanges",
      icon: <SwapOutlined />,
      color: "from-violet-500 to-purple-700",
    },
  ];

  return (
    <HomeLayout>

      <Layout className="min-h-screen bg-[#0f172a]">

        <Content className="p-4 md:p-8">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">

            <div>

              <h1 className="text-5xl font-black text-white tracking-tight">
                Reports Center
              </h1>

              <p className="text-zinc-400 mt-3 text-lg">
                Financial reports, statements and analytics
              </p>

            </div>

            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              className="!rounded-2xl !h-14 !px-8 mt-5 md:mt-0"
            >
              Export Reports
            </Button>

          </div>

          {/* REPORT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {reportCards.map((item, index) => (

              <div
                key={index}
                className={`
                  bg-gradient-to-br
                  ${item.color}
                  rounded-[30px]
                  p-6
                  shadow-2xl
                  relative
                  overflow-hidden
                  cursor-pointer
                  transition-all
                  duration-300
                  hover:scale-[1.03]
                  hover:-translate-y-1
                `}
              >

                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10">

                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl text-white">
                    {item.icon}
                  </div>

                  <h2 className="text-2xl font-bold text-white mt-8">
                    {item.title}
                  </h2>

                  <p className="text-white/70 mt-3">
                    View and manage {item.title.toLowerCase()}
                  </p>

                  <Button
                    className="!mt-8 !rounded-xl !bg-white/20 !border-none !text-white"
                  >
                    Open Report
                  </Button>

                </div>

              </div>
            ))}

          </div>

          {/* FILTERS */}
          <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 mt-10 shadow-2xl">

            <div className="flex flex-col xl:flex-row gap-4">

              <Input
                size="large"
                placeholder="Search customer / account / branch"
                prefix={<SearchOutlined />}
                className="!bg-[#1e293b] !border-zinc-700 !text-white !rounded-2xl"
              />

              <Select
                size="large"
                value={reportType}
                onChange={setReportType}
                className="min-w-[220px]"
                options={[
                  {
                    label: "Transactions",
                    value: "transactions",
                  },

                  {
                    label: "Transfers",
                    value: "transfers",
                  },

                  {
                    label: "Exchanges",
                    value: "exchanges",
                  },

                  {
                    label: "Customer Statements",
                    value: "customers",
                  },
                ]}
              />

              <Select
                size="large"
                placeholder="Select Branch"
                className="min-w-[220px]"
                options={[
                  {
                    label: "Kabul",
                    value: "kabul",
                  },

                  {
                    label: "Herat",
                    value: "herat",
                  },
                ]}
              />

              <RangePicker
                size="large"
                className="!bg-[#1e293b] !border-zinc-700 !rounded-2xl"
              />

            </div>

          </div>

          {/* BALANCE OVERVIEW */}
          <Row gutter={[24, 24]} className="mt-10">

            <Col xs={24} md={12} xl={6}>

              <Card className="!bg-gradient-to-br !from-cyan-500 !to-blue-700 !border-none !rounded-[30px] overflow-hidden">

                <div className="text-white">

                  <p className="text-white/70">
                    Kabul Branch
                  </p>

                  <h2 className="text-4xl font-black mt-4">
                    USD 125,000
                  </h2>

                  <p className="mt-4 text-white/70">
                    Available Balance
                  </p>

                </div>

              </Card>

            </Col>

            <Col xs={24} md={12} xl={6}>

              <Card className="!bg-gradient-to-br !from-emerald-500 !to-green-700 !border-none !rounded-[30px] overflow-hidden">

                <div className="text-white">

                  <p className="text-white/70">
                    Herat Branch
                  </p>

                  <h2 className="text-4xl font-black mt-4">
                    AFN 8,500,000
                  </h2>

                  <p className="mt-4 text-white/70">
                    Available Balance
                  </p>

                </div>

              </Card>

            </Col>

          </Row>

          {/* REPORT TABLE */}
          <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 mt-10 shadow-2xl">

            <div className="flex justify-between items-center mb-8">

              <div>

                <h2 className="text-3xl font-bold text-white">
                  Financial Reports
                </h2>

                <p className="text-zinc-400 mt-2">
                  Transactions, transfers and exchange history
                </p>

              </div>

            </div>

            <Table
              columns={columns}
              dataSource={data}
              pagination={{
                pageSize: 5,
              }}
              className="custom-dark-table"
            />

          </div>

        </Content>

      </Layout>

    </HomeLayout>
  );
};

export default Reports;