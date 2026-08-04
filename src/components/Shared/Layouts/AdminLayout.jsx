import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../Modules/http";
const API_URL = import.meta.env.VITE_API_URL;
import AppLoader from "../loader";
import {
  BranchesOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoneyCollectOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Layout,
  Menu,
  theme,
  Tooltip,
  Spin,
  Drawer,
} from "antd";
const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [myLogo, setmyLogo] = useState([]);
  const [userInf, setUserInf] = useState(false);
  const nav = (e) => {
    navigate(`/${e.key}`);
  };

  //parsing the branding and user data from local storage
  useEffect(() => {
    const parsed = JSON.parse(localStorage.getItem("branding") || "{}");
    setmyLogo(parsed?.data?.[0]?.logo || "");
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");

    if (stored) {
      setUserInf(JSON.parse(stored));
    }
  }, []);

  // Logout function

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

  const menuItems = [
    {
      key: "admin-dash",
      icon: <DashboardOutlined className="!text-[#022c22]" />,
      label: <span className="!text-zinc-100 ">Dashboard</span>,
    },
    {
      key: "register",
      icon: <UserOutlined />,
      label: <span className="!text-zinc-100 ">User Register</span>,
    },
    {
      key: "branding",
      icon: <UploadOutlined />,
      label: <span className="!text-zinc-100 ">Branding</span>,
    },
    {
      key: "currency",
      icon: <MoneyCollectOutlined />,
      label: <span className="!text-zinc-100 ">Currency</span>,
    },
    {
      key: "branch",
      icon: <BranchesOutlined />,
      label: <span className="!text-zinc-100 ">Branch</span>,
    },
    {
      key: "backup",
      icon: <DatabaseOutlined />,
      label: <span className="!text-zinc-100">Backup & Restore</span>,
    },
  ];
 
  const items = [
    {
      key: "admin-dash",
      icon: <DashboardOutlined className="!text-[#022c22]" />,
      label: <span className="!text-zinc-900 ">Dashboard</span>,
    },
    {
      key: "register",
      icon: <UserOutlined />,
      label: <span className="!text-zinc-900 ">User Register</span>,
    },

    {
      key: "setting",
      icon: <SettingOutlined />,
      label: <span className="!text-zinc-900 ">Settings</span>,
      children: [
        {
          key: "branding",
          icon: <UploadOutlined />,
          label: <span className="!text-slate-900 ">Branding</span>,
        },
        {
          key: "currency",
          icon: <MoneyCollectOutlined />,
          label: <span className="!text-slate-900 ">Currency</span>,
        },
        {
          key: "branch",
          icon: <BranchesOutlined />,
          label: <span className="!text-slate-900 ">Branches</span>,
        },
        {
          key: "backup",
          icon: <DatabaseOutlined />,
          label: <span className="!text-slate-900 ">Backup & Restore</span>,
        },
      ],
    },
  ];
  return (
    <Layout className="!min-h-screen  ">
      {loading && (
        <AppLoader
          title="Signing Out..."
          // message="Closing your secure session..."
        />
      )}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        closable={false}
        bodyStyle={{
          padding: 0,
          background: "#fff",
        }}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="w-full h-16 !bg-gradient-to-r !from-[#022c22] !via-[#064e3b] !to-[#022c22] flex items-center justify-between px-4 text-white text-xl font-bold">
            M S
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setDrawerOpen(false)}
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

      <Layout>
        <Header className="!bg-gradient-to-r !from-[#022c22] !via-[#064e3b] !to-[#022c22] !px-6 !flex !items-center !justify-between !border-b !border-emerald-700/40 !shadow-lg">
          {/* Left */}
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setDrawerOpen(true)}
            className="!text-white hover:!text-emerald-300 md:!text-2xl !text-lg"
          />
          {!drawerOpen ? (
            <Menu
              mode="horizontal "
              theme="dark"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={nav}
              className="!bg-transparent !border-0 flex-1 !text-white hidden md:flex"
              overflowedIndicator={null}
            />
          ) : (
            " "
          )}
          {/* Right */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span className="text-white font-semibold text-sm">
                {userInf?.fullname
                  ? userInf.fullname.charAt(0).toUpperCase() +
                    userInf.fullname.slice(1)
                  : "User"}
              </span>

              <span className="text-emerald-200 text-xs">Administrator</span>
            </div>

            <Tooltip title="Logout">
              <Button
                type="text"
                onClick={logoutFunc}
                className="hover:!bg-white/10 !rounded-xl"
              >
                <LogoutOutlined className="!text-white hover:!text-red-300 !text-xl md:!text-2xl" />
              </Button>
            </Tooltip>
          </div>
        </Header>
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
export default AdminLayout;
