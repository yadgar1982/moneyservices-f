import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLoader from "../loader";
import { http } from "../../Modules/http";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  LogoutOutlined,
  UserAddOutlined,
  HomeOutlined,
  VideoCameraOutlined,
  CloseOutlined,
  DollarCircleFilled,
  BookOutlined,
  TransactionOutlined,
} from "@ant-design/icons";

import { Avatar, Button, Layout, Menu, Tooltip, Drawer } from "antd";

const { Header, Content } = Layout;

const API_URL = import.meta.env.VITE_API_URL;

const HomeLayout = ({ children }) => {
  const [userInf, setUserInf] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  //parsing the branding and user data from local storage

  const myLogo = import.meta.env.VITE_LOGO_URL;
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");

    if (stored) {
      setUserInf(JSON.parse(stored));
    }
  }, []);


  const nav = (e) => {
    navigate(`/${e.key}`);
  };

  // items
  const items = [
    {
      key: "/user-dash",
      icon: <HomeOutlined  className="!text-[#022c22] !text-xl" />,
      label: <span  className="!text-[#022c22] !text-sm !font-semibold">Dashboard</span>,
    },
    {
      key: "transaction",
      icon: <TransactionOutlined className="!text-[#022c22] !text-xl"/>,
      label: <span  className="!text-[#022c22] !text-sm !font-semibold">Transaction</span>,
    },
    {
      key: "account",
      icon: <UserAddOutlined className="!text-[#022c22] !text-xl"/>,
      label: <span  className="!text-[#022c22] !text-sm !font-semibold">Account</span>,
    },
    {
      key: "comissions",
      icon: <DollarCircleFilled className="!text-[#022c22] !text-xl"/>,
      label:<span  className="!text-[#022c22] !text-sm !font-semibold">Fees / Charges</span>,
    },

    {
      key: "report",
      icon: <BookOutlined className="!text-[#022c22] !text-xl"/>,
      label: <span  className="!text-[#022c22] !text-sm !font-semibold">Report</span>,
    },
  ];
  const menuItem = [
    {
      key: "/user-dash",
      icon: <HomeOutlined  className="!text-[#022c22] !text-xl" />,
      label: <span  className="!text-white !text-sm !font-semibold">Dashboard</span>,
    },
    {
      key: "transaction",
      icon: <TransactionOutlined className="!text-[#022c22] !text-xl"/>,
      label: <span  className="!text-!text-white !text-sm !font-semibold">Transaction</span>,
    },
    {
      key: "account",
      icon: <UserAddOutlined className="!text-[#022c22] !text-xl"/>,
      label: <span  className="!text-!text-white !text-sm !font-semibold">Account</span>,
    },
    {
      key: "comissions",
      icon: <DollarCircleFilled className="!text-[#022c22] !text-xl"/>,
      label:<span  className="!text-!text-white !text-sm !font-semibold">Fees / Charges</span>,
    },

   
  ];

  // logout func
  const logoutFunc = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await http().post("/api/auth/logout");

      localStorage.removeItem("userInfo");
      localStorage.removeItem("branding");

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="!min-h-screen  ">
      {loading && (
        <AppLoader
          title="Signing Out..."
          // message="Closing your secure session..."
        />
      )}

      <Layout>
        <Header className="!bg-[#022c22] !px-6 !flex !items-center !justify-between shadow-md">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<MenuUnfoldOutlined className="!text-white !text-xl" />}
              onClick={() => setOpenDrawer(true)}
            />

            {!openDrawer ? (
              <Menu
                mode="horizontal "
                theme="dark"
                selectedKeys={[location.pathname]}
                items={menuItem}
                onClick={nav}
                className="!bg-transparent !border-0 flex-1 !text-white hidden md:flex"
                overflowedIndicator={null}
              />
            ) : (
              " "
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <div className="flex  gap-5  items-end min-w-0">
              <span
                className="text-white font-semibold text-sm truncate max-w-[180px]"
                title={userInf?.fullname}
              >
                {userInf?.fullname || "User"}
              </span>

              <span
                className="text-gray-400 text-xs truncate  mb-1 md:mb-0 text-yellow-500  max-w-[180px]"
                title={userInf?.branch}
              >
                {userInf?.branch || "Branch"}
              </span>
            </div>

            <Tooltip title="Logout">
              <Button type="text" onClick={logoutFunc}>
                <LogoutOutlined className="!text-white !text-xl" />
              </Button>
            </Tooltip>
          </div>
        </Header>

        <Drawer
                placement="left"
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                width={260}
                closable={false}
                bodyStyle={{
                  padding: 0,
                  background: "#fff",
                }}
              >
          <div className="flex flex-col h-full bg-white">
                   <div className="w-full h-16 !bg-[#022c22] flex items-center justify-between px-4 text-white text-xl font-bold">
                     M S
                     <Button
                       type="text"
                       icon={<MenuFoldOutlined size="large"/>}
                       onClick={() => setOpenDrawer(false)}
                       className="!text-white hover:!text-emerald-300 md:!text-2xl !text-lg"
                     />
                   </div>
         
                   <Menu
                     mode="inline"
                     items={items}
                     onClick={(e) => {
                       nav(e);
                       setDrawerOpen(false);
                     }}
                     className="border-0"
                   />
                 </div>
        </Drawer>
        <Content
          style={{
            margin: "0px 0px",
            padding: 0,
            minHeight: 280,
            background: "white",
          }}
          className="!h-screen !overflow-auto"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
export default HomeLayout;
