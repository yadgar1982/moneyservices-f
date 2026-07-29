import { Progress } from "antd";

export default function AppLoader({
  progress = null,
  title = "Please Wait",
  message = "Loading...",
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950/80 via-black/60 to-slate-900/80 backdrop-blur-md">
      <div
        className="
          w-[600px]
          max-w-[90%]
          rounded-3xl
          bg-slate-900/80
          backdrop-blur-2xl
          border border-white/10
          shadow-2xl
          p-10
          text-center
        "
      >
        {/* Premium Spinner */}
        <div className="flex justify-center mb-5">
          <div className="relative w-15 h-15">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20" />

            {/* Animated Ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"
              style={{ animationDuration: "1.2s" }}
            />

            {/* Center Dot */}
            <div className="absolute inset-5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_20px_#D4AF37]" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white">{title}</h2>

        <p className="text-gray-300 mt-3">{message}</p>

        {progress !== null && (
          <>
            <Progress
              className="mt-8"
              percent={progress}
              showInfo={false}
              strokeWidth={10}
              strokeColor={{
                "0%": "#D4AF37",
                "100%": "#FFD700",
              }}
              trailColor="rgba(255,255,255,.08)"
            />

            <div className="flex justify-between mt-3 text-sm">
              <span className="text-gray-400">Processing...</span>

              <span className="text-yellow-400 font-semibold">{progress}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
