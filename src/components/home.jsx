import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { MailOutlined, ManOutlined, PhoneOutlined } from "@ant-design/icons";
import MainLayout from "./Shared/Layouts/MainLayout";
const Home = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      {/* Hero Section */}

      {/* Content */}
      <div className="relative w-full h-screen">
        {/* Hero Background */}

        <div
          className="
  
     
      h-[100vh]
      w-full
      bg-[url('../assets/desktop.png')]
      bg-cover
      bg-center
      bg-no-repeat
    "
        />
        {/* Center Content */}
        <section className="absolute inset-0 z-30 flex items-center justify-center px-5">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center text-white">
            <Button
              size="large"
              type="primary"
              className="
          !bg-cyan-700
          !text-white
          hover:!text-white
          !font-bold
          !rounded-full
          !border-none
          !px-5
          !h-10
          mb-6
          !text-lg
          !shadow-sm
          !shadow-white
          hover:scale-105
          hover:!bg-blue-500
        "
              onClick={() => (window.location.href = "/login")}
            >
              Login Here
            </Button>

            <h2 className="text-3xl md:text-5xl font-bold ">
              <TypeAnimation
                style={{
                  color: "#f6f4ef",
                  textShadow: "0 0 10px #e8e88f",
                }}
                sequence={[
                  "Money Services",
                  3000,
                  "Fast Transfers",
                  3000,
                  "Secure Payments",
                  3000,
                  "Trusted Worldwide",
                  3000,
                ]}
                wrapper="span"
                speed={20}
                repeat={Infinity}
              />
            </h2>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer
        className="
      bg-black
      border-t
      border-yellow-500/40
      text-yellow-500
      py-5
      px-4
      fixed
      bottom-0
      w-full
    "
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center gap-3 md:gap-12 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <ManOutlined />
            hadiagroup2023@gmail.com
          </div>

          <div className="flex items-center gap-2">
            <PhoneOutlined />
            +7 (747) 420-3722
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Home;
