'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Flame, Clock, Star, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API_URL}/summary`).then(res => setData(res.data));
  }, []);

  if (!data) return <div className="p-10 text-center">Loading Stats...</div>;

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'คะแนน',
        data: data.scores,
        fill: true,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 10 } }
  };

  const avgScore = data.scores.length > 0 
    ? (data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length).toFixed(1) 
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
        <TrendingUp className="text-indigo-600" /> สรุปผลการฝึกฝน
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<Flame className="text-orange-500" />} label="Streak (วัน)" value={data.current_streak} color="bg-orange-100" />
        <StatCard icon={<Clock className="text-blue-500" />} label="เวลาฝึก (นาที)" value={data.total_minutes} color="bg-blue-100" />
        <StatCard icon={<Star className="text-green-500" />} label="คะแนนเฉลี่ย" value={avgScore} color="bg-green-100" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-lg font-bold mb-6 text-gray-700">พัฒนาการคะแนน 10 ครั้งล่าสุด</h2>
        <div className="h-[300px] w-full">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}