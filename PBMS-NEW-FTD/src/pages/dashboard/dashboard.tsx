import React, { useState, useEffect } from 'react';
import { 
  FaArrowUp, FaArrowDown, FaShoppingCart, FaDollarSign, 
  FaUsers, FaChartLine 
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { apiRequest } from '../../libs/apiConfig';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// 🔹 Metric card component
const MetricCard = ({ title, value, change, icon, isPositive }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {value?.toLocaleString?.() || 0}
          </p>
          <div className={`flex items-center mt-2 ${isPositive ? 'text-gray-700' : 'text-red-600'}`}>
            {isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            <span className="text-sm">{change}% from last period</span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

const SalesDashboard = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiRequest('/api/dashboard/metrics', 'GET', '');
        if (res.status === 200 && res.data) {
          const data = res.data;

          // salesPointData removed - meals not attached to stores
          setRevenueData(data.weeklyRevenue || []);
          setPerformanceData(data.topSellingItems || []);
          setMetrics(data.metrics || {});

          setActivities([
            'New order placed',
            'Client registered',
            'Inventory low alert',
            'Payment processed',
            'Sales target achieved'
          ]);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Real-time performance metrics and analytics</p>
      </header>

      {/* 🔹 Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <MetricCard 
          title="Total Revenue(UGX)" 
          value={metrics.totalRevenue?.value}
          change={metrics.totalRevenue?.change}
          icon={<FaDollarSign className="text-xl" />} 
          isPositive={metrics.totalRevenue?.isPositive}
        />
        
        <MetricCard 
          title="Daily Sales(UGX)" 
          value={metrics.dailySales?.value}
          change={metrics.dailySales?.change}
          icon={<FaShoppingCart className="text-xl" />} 
          isPositive={metrics.dailySales?.isPositive}
        />
       
      </div>

      {/* 🔹 Charts - Revenue Trend & Top Items Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Revenue Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`UGX ${value}`, 'Revenue']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#374151" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
                name="Revenue (UGX)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Items */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Performing Items</h2>
          <div className="space-y-3">
            {performanceData.map((item, index) => {
              const totalSales = performanceData.reduce((sum, curr) => sum + curr.sales, 0);
              const percentage = Math.round((item.sales / totalSales) * 100);
              return (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-3 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">{percentage}%</p>
                    <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-1 rounded-full" 
                        style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
