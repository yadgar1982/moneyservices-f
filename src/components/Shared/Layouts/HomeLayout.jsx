import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLoader from "../loader";
import { http } from "../../Modules/http";

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserAddOutlined,
  HomeOutlined,
  DollarCircleFilled,
  BookOutlined,
  TransactionOutlined,
} from "@ant-design/icons";

import { Button, Layout, Menu, Tooltip, Drawer } from "antd";

const { Header, Content } = Layout;

const HomeLayout = ({ children }) => {
  const [userInf, setUserInf] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // USER INFORMATION
  // =========================================================
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");

    if (stored) {
      try {
        setUserInf(JSON.parse(stored));
      } catch (error) {
        console.error("Invalid userInfo:", error);
      }
    }
  }, []);

  // =========================================================
  // NAVIGATION
  // =========================================================
  const nav = ({ key }) => {
    navigate(key);
    setOpenDrawer(false);
  };

  // =========================================================
  // MENU ITEMS
  // =========================================================
  const menuItems = [
    {
      key: "/user-dash",
      icon: <HomeOutlined />,
      label: "Dashboard",
    },
    {
      key: "/transaction",
      icon: <TransactionOutlined />,
      label: "Transaction",
    },
    {
      key: "/account",
      icon: <UserAddOutlined />,
      label: "Account",
    },
    {
      key: "/comissions",
      icon: <DollarCircleFilled />,
      label: "Fees / Charges",
    },
   
  ];

  // =========================================================
  // LOGOUT
  // =========================================================
  const logoutFunc = async () => {
    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await http().post("/api/auth/logout");

      localStorage.removeItem("userInfo");
      localStorage.removeItem("branding");

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="!min-h-screen !bg-[#f8fafc]">
      {/* LOADING */}
      {loading && <AppLoader title="Signing Out..." />}

      <Layout>

        {/* =====================================================
            NAVBAR
        ===================================================== */}
        <Header
          className="
            !h-[68px]
            !px-3
            md:!px-5
            !bg-slate-800
            !flex
            !items-center
            !justify-between
            !border-0
            !shadow-lg
          "
        >

          {/* ===================================================
              LEFT SIDE
          =================================================== */}
          <div className="flex items-center gap-2 min-w-0">

            {/* MENU BUTTON */}
            <Button
              type="text"
              onClick={() => setOpenDrawer(true)}
              className="
                !w-10
                !h-10
                !flex
                !items-center
                !justify-center
                !rounded-xl
                hover:!bg-white/10
              "
              icon={
                <MenuUnfoldOutlined className="!text-white !text-xl" />
              }
            />

            {/* LOGO + BRAND */}
            <div className="flex items-center gap-3 mr-2">

              <div
                className="
                  !w-10
                  !h-10
                  !rounded-xl
                  !bg-gradient-to-br
                  !from-blue-500
                  !to-cyan-400
                  !flex
                  !items-center
                  !justify-center
                  !shadow-md
                  !flex-shrink-0
                "
              >
                <span className="!text-white !font-bold !text-sm">
                  MS
                </span>
              </div>

              <div className="hidden lg:flex flex-col justify-center">
                <div className="!text-white !font-semibold !text-sm !leading-4">
                  Money Services
                </div>

                <div className="!text-slate-400 !text-[10px] !leading-4">
                  Management System
                </div>
              </div>

            </div>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}
            <Menu
              mode="horizontal"
              theme="dark"
              items={menuItems}
              selectedKeys={[location.pathname]}
              onClick={nav}
              className="
                modern-navbar-menu
                !bg-transparent
                !border-0
                hidden
                md:flex
              "
              overflowedIndicator={null}
            />
          </div>

          {/* ===================================================
              RIGHT SIDE
          =================================================== */}
          <div className="!flex items-center gap-2">

           {/* USER */}
<div
  className="
    hidden
    sm:!flex
    !flex-row
    !items-center
    !gap-3
    !px-3
    !py-1
    !h-12
    !rounded-xl
    !bg-white/5
    !border
    !border-white/10
    !flex-shrink-0
    !whitespace-nowrap
  "
>
  {/* AVATAR */}
  <div
    className="
      !w-9
      !h-9
      !min-w-9
      !rounded-full
      !bg-gradient-to-br
      !from-blue-400
      !to-cyan-400
      !flex
      !flex-row
      !items-center
      !justify-center
      !flex-shrink-0
    "
  >
    <span className="!text-white !font-semibold !text-sm">
      {userInf?.fullname
        ? userInf.fullname.charAt(0).toUpperCase()
        : "U"}
    </span>
  </div>

  {/* USER NAME + BRANCH */}
  <div
    className="
      !flex
      !flex-col
      !justify-center
      !min-w-0
      !leading-none
    "
  >
    <div
      className="
        !text-white
        !text-[12px]
        !font-semibold
        !leading-4
        !whitespace-nowrap
        !truncate
        !max-w-[140px]
      "
      title={userInf?.fullname}
    >
      {userInf?.fullname || "System User"}
    </div>

    <div
      className="
        !text-slate-400
        !text-[11px]
        !leading-4
        !whitespace-nowrap
        !truncate
        !max-w-[140px]
      "
      title={userInf?.branch}
    >
      {userInf?.branch || "Main"}
    </div>
  </div>
</div>

            {/* LOGOUT */}
            <Tooltip title="Logout">
              <Button
                type="text"
                onClick={logoutFunc}
                className="
                  !w-10
                  !h-10
                  !rounded-xl
                  hover:!bg-red-500/10
                "
              >
                <LogoutOutlined
                  className="
                    !text-slate-300
                    hover:!text-red-400
                    !text-lg
                  "
                />
              </Button>
            </Tooltip>

          </div>
        </Header>

        {/* =====================================================
            MOBILE DRAWER
        ===================================================== */}
        <Drawer
          placement="left"
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          width={275}
          closable={false}
          styles={{
            body: {
              padding: 0,
              background: "#f8fafc",
            },
          }}
        >

          <div className="!flex !flex-col !h-full !bg-[#f8fafc]">

            {/* DRAWER HEADER */}
            <div
              className="
                !h-[68px]
                !px-5
                !bg-[#0f172a]
                !flex
                !items-center
                !justify-between
              "
            >

              <div className="!flex !items-center !gap-3">

                <div
                  className="
                    !w-10
                    !h-10
                    !rounded-xl
                    !bg-gradient-to-br
                    !from-blue-500
                    !to-cyan-400
                    !flex
                    !items-center
                    !justify-center
                  "
                >
                  <span className="!text-white !font-bold !text-sm">
                    MS
                  </span>
                </div>

                <div>
                  <div className="!text-white !font-semibold !text-sm">
                    Money Services
                  </div>

                  <div className="!text-slate-400 !text-[10px]">
                    Management System
                  </div>
                </div>

              </div>

              <Button
                type="text"
                onClick={() => setOpenDrawer(false)}
                icon={<MenuFoldOutlined />}
                className="
                  !text-slate-300
                  hover:!text-white
                  hover:!bg-white/10
                  !rounded-lg
                "
              />

            </div>

            {/* DRAWER NAVIGATION */}
            <div className="!p-3">

              <div
                className="
                  !px-3
                  !pt-2
                  !pb-3
                  !text-[10px]
                  !font-semibold
                  !uppercase
                  !tracking-widest
                  !text-slate-400
                "
              >
                Navigation
              </div>

              <Menu
                mode="inline"
                theme="light"
                items={menuItems}
                selectedKeys={[location.pathname]}
                onClick={nav}
                className="
                  modern-drawer-menu
                  !border-0
                  !bg-transparent
                "
              />

            </div>

            {/* DRAWER USER */}
            <div className="!mt-auto !p-4">

              <div
                className="
                  !p-3
                  !rounded-xl
                  !bg-white
                  !border
                  !border-slate-200
                  !shadow-sm
                  !flex
                  !items-center
                  !gap-3
                "
              >

                <div
                  className="
                    !w-10
                    !h-10
                    !rounded-full
                    !bg-gradient-to-br
                    !from-blue-500
                    !to-cyan-400
                    !flex
                    !items-center
                    !justify-center
                    !flex-shrink-0
                  "
                >
                  <span className="!text-white !font-semibold">
                    {userInf?.fullname
                      ? userInf.fullname.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>

                <div className="!min-w-0">

                  <div className="!text-sm !font-semibold !text-slate-800 !truncate">
                    {userInf?.fullname || "System User"}
                  </div>

                  <div className="!text-xs !text-slate-500 !truncate">
                    {userInf?.branch || "Main"}
                  </div>

                </div>

              </div>

            </div>

          </div>
        </Drawer>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <Content
          style={{
            margin: 0,
            padding: 0,
            minHeight: 280,
            background: "#f8fafc",
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