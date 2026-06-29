import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const logo = import.meta.env.VITE_LOGO_URL;
import { Avatar, Button, Drawer, Layout, Menu, theme } from "antd";
const { Header, Sider, Content } = Layout;

// import LanguageSwitcher from "../../Shared/LanguageSwitcher";
// import i18n from "i18next";
// import { useTranslation } from "react-i18next";
import { CloseOutlined, ContactsOutlined, EyeOutlined, HomeOutlined, LoginOutlined, MenuOutlined, ProductOutlined, ProfileOutlined } from "@ant-design/icons";


const MainLayout = ({ children }) => {
//   const { t } = useTranslation("about");

  const location = useLocation(); // Get current URL path
  const currentPath = location.pathname;
  const navigate = useNavigate();
 
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    
    {
      key: "help",
      label: "Help",
      id: "help",
      icon:<ProfileOutlined/>
    },
    {
      key: "contact",
      label: "Contact",
      id: "contact",
      icon:<ContactsOutlined/>
    },
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      window.scrollTo({
        top: section.offsetTop - 7,
        behavior: "smooth",
      });
    }
  };

  return (
    <Layout className="h-screen">
    {/* <Layout className="h-screen" dir={i18n.language === "fa" ? "rtl" : "ltr"}> */}
      <Layout>
        <Header
          style={{ padding: 0, background: colorBgContainer }}
          className="!fixed !z-100 !w-full top-0 left-0 !bg-[#483702] !text-white   flex justify-between items-center !px-5"
        >
          {/* <LanguageSwitcher className="!border-none !text-[#3d3100]" /> */}

          <div className="md:!hidden block  ">
            <Button type="primary" onClick={() => setOpen(true)}
              className="!bg-yellow-500 hover:!bg-yellow-200 !text-orange-900">
              {open ? <CloseOutlined /> : <MenuOutlined />}
            </Button>
          </div>

          <Drawer
            title="Quick Links"
            closable={{ "aria-label": "Close Button" }}
            onClose={() => setOpen(false)}
             width={250}
            open={open}
            className="!flex !justify-left !w-full !bg-zinc-150"
          >
            <div className="!w-full !flex !flex-col !text-left   ">
              {currentPath == "/" && (
                <div  className="!w-full !flex !flex-col !justify-start !items-center !text-left !gap-5">
                 
                  <Button
                    type="text"
                    size="small"
                    shape="round"
                    style={{
                      fontSize: 14,
                    }}
                    icon={<LoginOutlined className="!text-xl !font-bold" />}
                    className="!w-full !flex !justify-start !items-center !text-left !text-zinc-900 hover:!text-yellow-600 !font-bold"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                </div>
              )}

                    {/* Show Home button only if not on home page */}
               
              <div className="flex flex-col gap-3  ">

                 {(currentPath === "/login" || currentPath === "/about") && (
                  <Button
                    type="text"
                    size="small"
                    shape="round"
                  
                    className="!w-full !flex !justify-start !items-center !text-left !px-4"
                    onClick={() => navigate("/")}
                    icon={<HomeOutlined/>}
                  >
                    Home
                  </Button>
                )}
                {currentPath === "/about" && (
                  <div className="flex flex-col justify-left gap-3 w-full">
                    {menuItems.map((item) => (
                      <Button
                        key={item.key}
                        type="text"
                         className="!w-full !flex !justify-start !items-center !text-left"
                        onClick={() =>{
                           scrollToSection(item.id)
                           setOpen(false)
                        }}
                        icon={item.icon}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                )}

               
              </div>
            </div>
          </Drawer>

          <div className="hidden md:flex w-full gap-3">
            {/* Center menu */}
            <div className=" flex justify-left w-full items-end !text-yellow-500 gap-2">
              {currentPath === "/about" &&
                menuItems.map((item) => (
                  <Button
                    key={item.key}
                    type="text"
                    className="!text-yellow-300 !font-semibold hover:!text-blue-200 hover:!text-lg"
                    onClick={() => scrollToSection(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
            </div>

            {/* Right buttons */}
            <div className="flex gap-2 ml-auto">
              {currentPath === "/" && (
                <>
                  
                  <Button
                    className="!text-yellow-300 !font-semibold !bg-transparent hover:!text-blue-300"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </Button>
                </>
              )}

              {(currentPath === "/login" || currentPath === "/about") && (
                <Button onClick={() => navigate("/")}
                className="!text-yellow-300 !font-semibold !bg-transparent hover:!text-blue-300"
                icon={<HomeOutlined/>}
                >Home
                </Button>
              )}
            </div>
          </div>
        </Header>
        <Content
            style={{
            margin: "0px 0px",
            padding: 0,
            minHeight: 280,
          }}
          className="!h-screen"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
export default MainLayout;
