import { Button } from "antd";
import { Link } from "react-router-dom";
import { LockOutlined, HomeOutlined } from "@ant-design/icons";

const NotFound = () => {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#03111F] via-[#0B2239] to-[#071A2C] px-6">

      {/* Background Glow */}
      <div className="absolute -top-40 -left-32 w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[140px] animate-pulse"></div>
      <div className="absolute -bottom-40 -right-32 w-[450px] h-[450px] rounded-full bg-blue-500/15 blur-[140px] animate-pulse"></div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-10 text-center">

        {/* Lock Icon */}
        <div className="mx-auto mb-8 flex items-center justify-center w-24 h-24 rounded-full bg-cyan-500/15 border border-cyan-400/20">
          <LockOutlined className="text-5xl text-cyan-400" />
        </div>

        {/* Error Number */}
        <h1 className="text-7xl md:text-8xl font-extrabold text-white tracking-widest">
          404
        </h1>

        {/* Title */}
        <h2 className="mt-4 text-3xl font-semibold text-white">
          Access Denied
        </h2>

        {/* Description */}
        <p className="mt-5 text-gray-300 leading-7">
          The page you're trying to access either doesn't exist or you don't
          have permission to view it.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">

          <Link to="/">
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              className="!h-12 !px-8 !rounded-xl !font-semibold"
            >
              Back to Login
            </Button>
          </Link>

          <Button
            size="large"
            onClick={() => window.history.back()}
            className="!h-12 !px-8 !rounded-xl"
          >
            Go Back
          </Button>

        </div>

        {/* Footer */}
        <p className="mt-10 text-sm text-gray-500">
          Money Services Management System
        </p>

      </div>
    </div>
  );
};

export default NotFound;