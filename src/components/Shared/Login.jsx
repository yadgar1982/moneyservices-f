import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, Checkbox, Typography, Spin, Avatar, Flex, Progress } from "antd";
import { useNavigate } from 'react-router-dom'
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import swal from "sweetalert"
import Cookies from "universal-cookie";
import { http, trimData, fetcher } from "../Modules/http"
import "./login.css";
import useSWR from "swr";
import MainLayout from "./Layouts/MainLayout";
const API_URL = import.meta.env.VITE_API_URL
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
    dedupingInterval: 10000
  });

  const logo = brandingData?.data[0]?.logo || "";
  useEffect(() => {
    if (brandingData) {
      setBranding(brandingData.data)

    }
  }, [])



  const onFinish = async (values) => {
    setLoader(true);
    setProgress(0);

    try {
      const finalObj = trimData(values);
      const httpReq = http();

      // CALL LOGIN API FIRST
      const { data } = await httpReq.post("/api/auth/login", finalObj);

      //  IF LOGIN FAILS → STOP HERE
      if (!data) {
        swal("Login Failed", "Invalid credentials, Please try again!", "error");
        setLoader(false);
        return;
      }

      const { token, user } = data;
      localStorage.setItem("userInfo", JSON.stringify(user));
      cookies.set("authToken", token, { path: "/", maxAge: 7200 });

      const branding = await httpReq.get("/api/branding/read");
      localStorage.setItem("branding", JSON.stringify(branding.data));

      //  RUN PROGRESS AFTER SUCCESS
      let current = 0;
      const interval = setInterval(() => {
        current += 5;
        setProgress(current);

        if (current >= 100) {
          clearInterval(interval);

          //  NAVIGATE AFTER PROGRESS
          if (user.role === "admin") return navigate('/admin-dash');
          if (user.role === "user") return navigate('/user-dash');

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
      <div className="min-h-screen  flex items-center  w-full justify-center bg-[#0b3528] px-4">
      {loader && (
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
            zIndex: 9999
          }}
        >
          <div className="h-22 w-70 md:w-130 bg-zinc-100 flex items-center gap-3 p-3 rounded shodow-lg">
            <p className="whitespace-nowrap">Please wait...</p>
            <div className="flex-1">
              <Progress percent={progress} status="active" strokeWidth={20} />
            </div>
          </div>
        </div>
      )}
      <div className=" bg-zinc-100 rounded-lg shadow-xl !border-sm !border-zinc-300 p-2  flex flex-col gap-5 ">
        <div className="w-full px-12 flex gap-4 justify-between  items-center ">
         
          <h1 className="!text-zinc-500 font-bold text-lg mt-9">Login to your account here</h1>
        </div>
        <div className="  rounded-lg  px-4 ">
          <Card className="!bg-zinc-100 !rounded-lg !w-full mx-auto " >
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="email"
                label={<span className="!text-zinc-500">Email</span>}
                rules={[{ required: true, message: "Please enter your Email!" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your Email"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="!text-zinc-500">Password</span>}
                rules={[{ required: true, message: "Please enter your password!" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item className="flex justify-between items-center">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="!text-zinc-500">Remember me</Checkbox>
                </Form.Item>
                <a className="!text-cyan-600 font-bold hover:!text-blue-500 hover:underline" href="#">
                  Forgot password?
                </a>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full py-3 rounded-lg !bg-cyan-600 hover:!bg-cyan-300 hover:!text-zinc-900 !font-bold"
                >
                  Log in
                </Button>
              </Form.Item>
            </Form>

          </Card>
        </div>
      </div>

    </div>
  </MainLayout>
  );
}

export default Login;
