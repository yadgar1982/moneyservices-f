import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Modal,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
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
  const [forgotForm] = Form.useForm();
  const navigate = useNavigate();

  const [loader, setLoader] = useState(false);
  const [loaderTitle, setLoaderTitle] = useState("Please Wait");
  const [loaderMessage, setLoaderMessage] = useState("Loading...");
  const [branding, setBranding] = useState([]);
  const [progress, setProgress] = useState(0);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

  const { data: brandingData } = useSWR("/api/branding/read", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

 const myLogo = "/assets/logo.png";
  useEffect(() => {
    if (brandingData) {
      setBranding(brandingData.data);
    }
  }, []);

  const onFinish = async (values) => {
    setLoaderTitle("Signing In");
    setLoaderMessage("Authenticating your account securely...");

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

  const sendOTP = async (values) => {
    setLoader(true);
    setLoaderTitle("Sending Verification Code");
    setLoaderMessage(
      "Sending a secure verification code to your registered email...",
    );

    setProgress(null);
    setLoader(true);

    try {
      const httpReq = http();

      const finalObj = trimData(values);

      const { data } = await httpReq.post(
        "/api/auth/forgot-password",
        finalObj,
      );

      if (!data.success) {
        return swal("Error", data.message, "error");
      }

      setEmail(values.email);

      swal("Success", data.message, "success");

      forgotForm.resetFields();

      setStep(2);
    } catch (err) {
      console.log(err);

      swal(
        "Error",
        err.response?.data?.message || "Failed to send OTP.",
        "error",
      );
    } finally {
      setLoader(false);
    }
  };

  const verifyOTP = async () => {
    try {
      if (otp.length !== 6) {
        return swal(
          "Error",
          "Please enter the complete 6-digit verification code.",
          "error",
        );
      }

      setLoaderTitle("Verifying Identity");
      setLoaderMessage("Please wait while we verify your security code...");

      setProgress(null);
      setLoader(true);

      const httpReq = http();

      const { data } = await httpReq.post("/api/auth/verify-otp", {
        email,
        otp,
      });

      if (!data.success) {
        return swal("Error", data.message, "error");
      }

      swal("Success", data.message, "success");

      setStep(3);
    } catch (err) {
      swal("Error", err.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setLoader(false);
    }
  };
  const resetPassword = async () => {
    try {
      setLoader(true);

      const values = await forgotForm.validateFields([
        "password",
        "confirmPassword",
      ]);

      setLoaderTitle("Updating Security");
      setLoaderMessage("Encrypting and updating your new password...");
      setProgress(null);
      setLoader(true);
      const httpReq = http();

      const { data } = await httpReq.post("/api/auth/reset-password", {
        email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      if (!data.success) {
        return swal("Error", data.message, "error");
      }

      await swal(
        "Success",
        "Password reset successfully.\nPlease login with your new password.",
        "success",
      );

      forgotForm.resetFields();

      setForgotOpen(false);
      setStep(1);
      setEmail("");
    } catch (err) {
      swal(
        "Error",
        err.response?.data?.message || "Password reset failed.",
        "error",
      );
    } finally {
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
            title={loaderTitle}
            message={loaderMessage}
          />
        )}

        {/* Login Card */}
        <div className="relative w-full max-w-md backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[32px] p-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden z-10">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl"></div>
          {/* Logo */}

          <div className="flex flex-col items-center mb-8 bg-slate-400 rounded-xl p-2">
            <img
              src={myLogo}
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

                <Button
                  type="link"
                  className="!p-0 !text-cyan-400 hover:!text-cyan-300"
                  onClick={() => {
                    forgotForm.resetFields();
                    setForgotOpen(true);
                    setStep(1);
                    setEmail("");
                  }}
                >
                  Forgot Password?
                </Button>
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

      {/* forget password Modal */}
      <Modal
        title={null}
        open={forgotOpen}
        footer={null}
        centered
        destroyOnClose
        width={500}
        onCancel={() => {
          forgotForm.resetFields();
          setForgotOpen(false);
          setStep(1);
          setEmail("");
        }}
        styles={{
          content: {
            borderRadius: "28px",
            padding: "32px",
          },
        }}
      >
        <div className="!text-center !mb-8">
          <img
            src={import.meta.env.VITE_LOGO_URL}
            alt="Logo"
            className="!w-20 !mx-auto !mb-5 !drop-shadow-xl"
          />

          <h2 className="!text-3xl !font-bold !text-slate-800">
            {step === 1
              ? "Forgot Password"
              : step === 2
                ? "Verify OTP"
                : "Reset Password"}
          </h2>

          <p className="!mt-2 !text-sm !text-gray-500">
            {step === 1 &&
              "Enter your email address to receive a verification code."}

            {step === 2 && `Enter the verification code sent to ${email}`}

            {step === 3 && "Create a strong password for your account."}
          </p>
        </div>

        <Form
          form={forgotForm}
          layout="vertical"
          className="!mt-2"
          onFinish={step === 1 ? sendOTP : undefined}
        >
          {/* STEP 1 */}

          {step === 1 && (
            <>
              <Form.Item
                label={
                  <span className="!text-slate-700 !font-semibold">
                    Email Address
                  </span>
                }
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please enter your email.",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email.",
                  },
                ]}
              >
                <Input
                  size="large"
                  autoComplete="email"
                  placeholder="Email Address"
                  prefix={
                    <UserOutlined className="!text-cyan-500 !text-lg !mr-2" />
                  }
                  className="!h-14 !rounded-2xl !border-gray-300 hover:!border-cyan-500 focus:!border-cyan-500"
                />
              </Form.Item>

              <Button
                htmlType="submit"
                type="primary"
                loading={loader}
                block
                className="!w-full !h-14 !mt-4 !rounded-2xl !border-none !bg-gradient-to-r !from-cyan-500 !to-emerald-500 hover:!from-cyan-400 hover:!to-emerald-400 !text-lg !font-semibold !shadow-lg hover:!shadow-cyan-500/40 hover:!scale-[1.02] !transition-all !duration-300"
              >
                Send Verification Code
              </Button>
            </>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <>
              <Form.Item
                label={
                  <span className="!text-slate-700 !font-semibold">
                    Verification Code
                  </span>
                }
              >
                <div className="!flex !justify-center !mb-6">
                  <Input.OTP
                    length={6}
                    size="large"
                    value={otp}
                    onChange={(value) => {
                      console.log("OTP:", value);
                      setOtp(value);
                    }}
                    className="!gap-3"
                  />
                </div>
              </Form.Item>

              <Button
                type="primary"
                loading={loader}
                block
                onClick={verifyOTP}
                className="!w-full !h-14 !rounded-2xl !border-none !bg-gradient-to-r !from-cyan-500 !to-emerald-500 hover:!from-cyan-400 hover:!to-emerald-400 !text-lg !font-semibold"
              >
                Verify OTP
              </Button>
            </>
          )}

          {/* STEP 3 */}

          {step === 3 && (
            <>
              <Form.Item
                label={
                  <span className="!text-slate-700 !font-semibold">
                    New Password
                  </span>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your new password.",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="New Password"
                  prefix={
                    <LockOutlined className="!text-cyan-500 !text-lg !mr-2" />
                  }
                  className="!h-14 !rounded-2xl"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="!text-slate-700 !font-semibold">
                    Confirm Password
                  </span>
                }
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your password.",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("Passwords do not match."),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Confirm Password"
                  prefix={
                    <LockOutlined className="!text-cyan-500 !text-lg !mr-2" />
                  }
                  className="!h-14 !rounded-2xl"
                />
              </Form.Item>

              <Button
                type="primary"
                loading={loader}
                block
                onClick={resetPassword}
                className="!w-full !h-14 !rounded-2xl mt-4 !border-none !bg-gradient-to-r !from-cyan-500 !to-emerald-500 hover:!from-cyan-400 hover:!to-emerald-400 !text-lg !font-semibold !shadow-lg hover:!shadow-cyan-500/40 hover:!scale-[1.02] !transition-all !duration-300"
              >
                Reset Password
              </Button>
            </>
          )}
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default Login;
