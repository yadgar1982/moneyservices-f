import React from "react";
import { Layout, Button, Avatar, Dropdown } from "antd";

import {
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const items = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: logout,
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-100">

      <Header
        className="
          flex
          justify-between
          items-center
          px-8
          shadow-lg
          !bg-[#483702]
        "
      >
        {/* Logo */}

        <div className="flex items-center gap-3">


          <div>

            <h1 className="text-xl font-bold text-yellow-400">
              Yadgar Money Services
            </h1>

            <p className="text-xs text-gray-300">
              Management System
            </p>

          </div>

        </div>

        {/* User */}

        
      </Header>

      <Content className=" bg-gray-100">

        {children}

      </Content>

    </Layout>
  );
};

export default MainLayout;