import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LogoutOutlined,
  UserAddOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, theme, Spin, Tooltip } from "antd";
const { Header, Sider, Content } = Layout;

const HomeLayout = ({ children }) => {
  const [myLogo, setmyLogo] = useState([]);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInf, setUserInf] = useState(false);

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



  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const nav = (e) => {
    navigate(`/${e.key}`);
  };

  const items = [
    {
      key: "/user-dash",
      icon: <HomeOutlined />,
      label: <span className="!text-zinc-900 ">Dashboard</span>,
    },
    {
      key: "account",
      icon: <UserAddOutlined />,
      label: "Account",
    },
    {
      key: "transaction",
      icon: <UploadOutlined />,
      label: "Transaction",
    },
    {
      key: "report",
      icon: <VideoCameraOutlined />,
      label: "Report",
    },
  ];

  const logoutFunc = () => {
    setLoading(true);

    setTimeout(() => {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("branding");

      navigate("/login");
      setLoading(false);
    }, 800); // small delay so loader is visible
  };

  return (
    <Layout className="!min-h-screen  ">
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Spin size="large" />
        </div>
      )}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="md"
        collapsedWidth={55}
        onBreakpoint={(broken) => setCollapsed(broken)}
        className="   !bg-white shadow-sm !border-r !border-zinc-300"
      >
        <div className="demo-logo-vertical !bg-white " />
        <div className="flex flex-col h-screen bg-white  py-9 justify-start items-start">
          <div className="w-full bg-zinc-600 flex justify-center items-center text-white text-xl top-0 mb-9 -mt-9 h-16">
            <Avatar
  src={myLogo ? `${API_URL}${myLogo}` : "/default-logo.png"}
  alt="logo"
  size={40}
/>
          </div>
          <br />

          <Menu
            theme="light"
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={items}
            onClick={nav}
            className="!bg-transparent !w-full"
          />
        </div>
      </Sider>
      <Layout>
        <Header className="!text-zinc-100 !bg-zinc-500 !flex !items-center !justify-between ">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="!text-zinc-50 md:!text-2xl !text-1xl "
          />
          <div className="flex !items-center !justify-center gap-1">
           
            <span className="!text-white !font-bold md:!text-1xl !text-[10px]">
              {" "}
              {userInf?.fullname
                ? userInf.fullname.charAt(0).toUpperCase() +
                  userInf.fullname.slice(1)
                : "User"}
            </span>
            |
            
             <span className="!text-white !font-bold md:!text-1xl !text-[10px]">
              {" "}
              {userInf?.branch
                ? userInf.branch.charAt(0).toUpperCase() +
                  userInf.branch.slice(1)
                : "User"}
            </span>
            <p className="!text-white !font-bold !text-[10px] md:!text-1xl">Branch:</p>
            <Tooltip title="Logout">
              <Button type="text" onClick={logoutFunc}>
                <LogoutOutlined className="!text-white !font-bold md:!text-3xl !text-xl" />
              </Button>
            </Tooltip>
          </div>
        </Header>
        <Content
          style={{
            margin: "0px 0px",
            padding: 24,
            minHeight: 280,
            background: "white",
          }}
          className="!h-screen !overflow-auto !p-4"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
export default HomeLayout;
