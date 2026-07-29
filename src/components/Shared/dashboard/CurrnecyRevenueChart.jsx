import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CurrencyRevenueChart({ data }) {
  return (
    <div className="!rounded-3xl !border !border-white/10 !bg-white/5 !backdrop-blur-2xl !p-6 !shadow-[0_10px_40px_rgba(0,0,0,.25)]">

      <div className="!mb-6">
        <h2 className="!text-xl !font-bold !text-white">
          Revenue by Currency
        </h2>

        <p className="!text-sm !text-slate-400">
          Total transaction amount
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid
            stroke="rgba(255,255,255,.08)"
            vertical={false}
          />

          <XAxis
            dataKey="currency"
            stroke="#94a3b8"
          />

          <YAxis
            stroke="#94a3b8"
          />

          <Tooltip />

          <Bar
            dataKey="amount"
            radius={[8, 8, 0, 0]}
            fill="#06b6d4"
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}