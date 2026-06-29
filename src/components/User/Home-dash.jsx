import React from "react";
import {
  Layout,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Button,
} from "antd";

import {
  DollarOutlined,
  UserOutlined,
  SwapOutlined,
  BankOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

import HomeLayout from "../Shared/Layouts/HomeLayout";

const { Content } = Layout;

const Dashboard = () => {

  // SAMPLE DATA
  const balances = [
    {
      currency: "USD",
      amount: 125400,
      color: "from-cyan-500 to-blue-700",
    },
    {
      currency: "AFN",
      amount: 8500000,
      color: "from-emerald-500 to-green-700",
    },
    {
      currency: "PKR",
      amount: 4200000,
      color: "from-orange-400 to-red-500",
    },
    {
      currency: "EUR",
      amount: 15800,
      color: "from-violet-500 to-purple-700",
    },
  ];

  const chartData = [
    { name: "Mon", amount: 4000 },
    { name: "Tue", amount: 3000 },
    { name: "Wed", amount: 5000 },
    { name: "Thu", amount: 4000 },
    { name: "Fri", amount: 7000 },
    { name: "Sat", amount: 6000 },
    { name: "Sun", amount: 9000 },
  ];

  const recentTransactions = [
    {
      key: 1,
      name: "Hadya Fardin",
      currency: "USD",
      amount: 500,
      type: "credit",
    },
    {
      key: 2,
      name: "Ahmad Khan",
      currency: "AFN",
      amount: 25000,
      type: "debit",
    },
    {
      key: 3,
      name: "Ali Reza",
      currency: "PKR",
      amount: 150000,
      type: "credit",
    },
  ];

  const columns = [
    {
      title: "Customer",
      dataIndex: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <span className="text-zinc-200 font-medium">
            {record.name}
          </span>
        </div>
      ),
    },

    {
      title: "Currency",
      dataIndex: "currency",
      render: (v) => (
        <Tag
          className="!rounded-full !px-4 !py-1"
          color="blue"
        >
          {v}
        </Tag>
      ),
    },

    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => (
        <span className="text-white font-semibold">
          {Number(v).toLocaleString()}
        </span>
      ),
    },

    {
      title: "Type",
      dataIndex: "type",
      render: (v) =>
        v === "credit" ? (
          <Tag
            icon={<ArrowUpOutlined />}
            color="green"
            className="!rounded-full !px-4 !py-1"
          >
            Credit
          </Tag>
        ) : (
          <Tag
            icon={<ArrowDownOutlined />}
            color="red"
            className="!rounded-full !px-4 !py-1"
          >
            Debit
          </Tag>
        ),
    },
  ];

  return (
    <HomeLayout>

      <Layout className="min-h-screen bg-[#0f172a]">

        <Content className="p-4 md:p-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">

            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                Financial Dashboard
              </h1>

              <p className="text-zinc-400 mt-2">
                Money Services Management System
              </p>
            </div>

            <div className="flex gap-3 mt-4 md:mt-0">

              <Button
                type="primary"
                icon={<PrinterOutlined />}
                className="!h-12 !px-6 !rounded-2xl"
              >
                Statements
              </Button>

              <Button
                icon={<PlusOutlined />}
                className="!h-12 !px-6 !rounded-2xl"
              >
                Transaction
              </Button>

            </div>

          </div>

          {/* BALANCE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            {balances.map((item, index) => (

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
                  min-h-[220px]
                `}
              >

                {/* glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between h-full">

                  <div className="flex justify-between items-start">

                    <div>

                      <p className="text-white/70 text-sm">
                        Available Cash
                      </p>

                      <h2 className="text-4xl font-black text-white mt-3">
                        {item.currency}
                      </h2>

                    </div>

                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl">
                      <DollarOutlined className="text-3xl text-white" />
                    </div>

                  </div>

                  <div>

                    <div className="text-4xl font-black text-white mt-6">
                      {Number(item.amount).toLocaleString()}
                    </div>

                    <div className="flex justify-between items-center mt-5">

                      <span className="text-white/70 text-sm">
                        Live Balance
                      </span>

                      <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs text-white">
                        Active
                      </span>

                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* FINANCIAL OVERVIEW */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">

            {/* CHART */}
            <div className="xl:col-span-2 bg-[#111827] rounded-[30px] p-6 border border-zinc-800 shadow-2xl">

              <div className="flex justify-between items-center mb-6">

                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Transaction Volume
                  </h2>

                  <p className="text-zinc-400">
                    Weekly overview
                  </p>
                </div>

                <SwapOutlined className="text-cyan-400 text-2xl" />

              </div>

              <ResponsiveContainer width="100%" height={320}>

                <AreaChart data={chartData}>

                  <defs>
                    <linearGradient
                      id="colorAmount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#06b6d4"
                        stopOpacity={0.8}
                      />

                      <stop
                        offset="95%"
                        stopColor="#06b6d4"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    strokeWidth={4}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

            {/* QUICK STATS */}
            <div className="space-y-5">

              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-zinc-400">
                      Total Customers
                    </p>

                    <h2 className="text-4xl font-black text-white mt-3">
                      1,240
                    </h2>

                  </div>

                  <div className="bg-cyan-500/20 p-4 rounded-2xl">
                    <UserOutlined className="text-3xl text-cyan-400" />
                  </div>

                </div>

              </div>

              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-zinc-400">
                      Branches
                    </p>

                    <h2 className="text-4xl font-black text-white mt-3">
                      8
                    </h2>

                  </div>

                  <div className="bg-emerald-500/20 p-4 rounded-2xl">
                    <BankOutlined className="text-3xl text-emerald-400" />
                  </div>

                </div>

              </div>

              <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl">

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-zinc-400">
                      Pending Transfers
                    </p>

                    <h2 className="text-4xl font-black text-white mt-3">
                      22
                    </h2>

                  </div>

                  <div className="bg-orange-500/20 p-4 rounded-2xl">
                    <SwapOutlined className="text-3xl text-orange-400" />
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="bg-[#111827] border border-zinc-800 rounded-[30px] p-6 shadow-2xl mt-8">

            <div className="flex justify-between items-center mb-6">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Recent Transactions
                </h2>

                <p className="text-zinc-400">
                  Latest financial activity
                </p>

              </div>

            </div>

            <Table
              columns={columns}
              dataSource={recentTransactions}
              pagination={false}
              className="custom-dark-table"
            />

          </div>

        </Content>

      </Layout>

    </HomeLayout>
  );
};

export default Dashboard;