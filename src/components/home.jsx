import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Spin,
  Avatar,
  Flex,
  Progress,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  DollarCircleOutlined,
  ThunderboltOutlined,
  LockOutlined,
  BankOutlined,
} from "@ant-design/icons";
import swal from "sweetalert";
import Cookies from "universal-cookie";
import { http, trimData, fetcher } from "./Modules/http";
import "./home.css";
import useSWR from "swr";
import MainLayout from "./Shared/Layouts/MainLayout";
import AppLoader from "./Shared/loader";
const API_URL = import.meta.env.VITE_API_URL;
const { Title, Text } = Typography;
const cookies = new Cookies();

const Login = () => {
  const navigate = useNavigate();

  const [loader, setLoader] = useState(false);
  const [dots, setDots] = useState("");
  const [branding, setBranding] = useState([]);
  const [progress, setProgress] = useState(0);

  const { data: brandingData } = useSWR("/api/branding/read", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const logo = brandingData?.data[0]?.logo || "";
  useEffect(() => {
    if (brandingData) {
      setBranding(brandingData.data);
    }
  }, []);

  const onFinish = async (values) => {
    setLoader(true);
    setProgress(0);

    try {
      const finalObj = trimData(values);
      const httpReq = http();

      // CALL LOGIN API FIRST
      const { data } = await httpReq.post("/api/auth/login", finalObj, {
        withCredentials: true,
      });

      //  IF LOGIN FAILS → STOP HERE
      if (!data) {
        swal("Login Failed", "Invalid credentials, Please try again!", "error");
        setLoader(false);

        return;
      }

      const { user } = data;
      localStorage.setItem("userInfo", JSON.stringify(user));

      const branding = await httpReq.get("/api/branding/read", {
        withCredentials: true,
      });
      localStorage.setItem("branding", JSON.stringify(branding.data));

      //  RUN PROGRESS AFTER SUCCESS
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        setProgress(current);

        if (current >= 100) {
          clearInterval(interval);

          //  NAVIGATE AFTER PROGRESS
          if (user.role === "admin") return navigate("/admin-dash");
          if (user.role === "user") return navigate("/user-dash");

          setLoader(false);
        }
      }, 100);
    } catch (err) {
      console.log(err);
      swal("Login Failed", "Invalid credentials, Please try again!", "error");
      setLoader(false);
    }
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#03111F] via-[#0B2239] to-[#071A2C] px-4">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        {/* Background Glow */}
        {/* Top Left */}
        <div className="absolute -top-40 -left-32 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse"></div>

        {/* Bottom Right */}
        <div className="absolute -bottom-40 -right-32 w-[550px] h-[550px] rounded-full bg-emerald-500/10 blur-[160px] animate-pulse"></div>
        {/* Gold Accent */}
        <div className="!absolute !top-1/3 right-1/4 w-60 h-60 rounded-full bg-yellow-400/5 blur-[120px]"></div>

        {/* Loader */}
        {loader && (
          <AppLoader
            progress={progress}
            title="Signing In"
            message="Authenticating your account..."
          />
        )}

        {/* Login Card */}
        <div className="relative w-full max-w-md backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[32px] p-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden z-10">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl"></div>
          {/* Logo */}

          <div className="flex flex-col items-center mb-8">
            <img
              src={import.meta.env.VITE_LOGO_URL}
              alt="Yadgar Tech"
              className="w-24 drop-shadow-2xl"
            />
          </div>

          {/* Title */}

          <div className="mt-8 mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>

            <p className="mt-2 text-gray-300">
              Sign in securely to access your dashboard.
            </p>
          </div>

          <Card bordered={false} className="!bg-transparent !shadow-none">
            <Form
              layout="vertical"
              name="login"
              onFinish={onFinish}
              initialValues={{ remember: true }}
            >
              {/* Email */}

              <Form.Item
                name="email"
                label={<span className="text-white">Email Address</span>}
                rules={[
                  {
                    required: true,
                    message: "Please enter your email!",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={
                    <UserOutlined className="!text-cyan-400 !text-lg !mr-2" />
                  }
                  placeholder="Email Address"
                  className="!h-14 !rounded-2xl !bg-slate-900/50 !border-white/10 !text-white placeholder:!text-zinc-200 hover:!border-cyan-400 focus:!border-cyan-400"
                />
              </Form.Item>

              {/* Password */}

              <Form.Item
                name="password"
                label={<span className="text-white">Password</span>}
                rules={[
                  {
                    required: true,
                    message: "Please enter your password!",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={
                    <LockOutlined className="!text-cyan-400 text-lg mr-2" />
                  }
                  placeholder="Password"
                  className="!h-14 !rounded-2xl !bg-slate-900/50 !border-white/10 !text-white placeholder:!text-gray-400 hover:!border-cyan-400 focus:!border-cyan-400"
                />
              </Form.Item>

              {/* Remember */}

              <div className="flex justify-between items-center mb-6">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="!text-gray-300">Remember me</Checkbox>
                </Form.Item>

                <a
                  href="#"
                  className="text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login */}

              <Button
                htmlType="submit"
                type="primary"
                size="large"
                className="w-full !h-14 !rounded-2xl !border-none !bg-gradient-to-r from-cyan-500 to-emerald-500 hover:!from-cyan-400 hover:!to-emerald-400 !text-lg !font-semibold shadow-lg hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-300"
              >
                Sign In
              </Button>
            </Form>

            {/* Footer */}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
              <SafetyCertificateOutlined className="text-emerald-400" />
              Protected with 256-bit SSL Encryption
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
