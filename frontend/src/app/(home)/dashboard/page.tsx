'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Common/Sidebar';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: '2,543',
      change: '+12.5%',
      changeType: 'increase',
      icon: <Users size={24} />,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Orders',
      value: '1,423',
      change: '+8.2%',
      changeType: 'increase',
      icon: <ShoppingCart size={24} />,
      color: 'bg-green-500'
    },
    {
      title: 'Revenue',
      value: '$54,239',
      change: '+15.3%',
      changeType: 'increase',
      icon: <DollarSign size={24} />,
      color: 'bg-purple-500'
    },
    {
      title: 'Growth Rate',
      value: '12.8%',
      change: '-2.1%',
      changeType: 'decrease',
      icon: <TrendingUp size={24} />,
      color: 'bg-orange-500'
    }
  ];

  const recentOrders = [
    { id: '#12345', customer: 'John Doe', amount: '$299.00', status: 'Completed', date: '2024-01-15' },
    { id: '#12346', customer: 'Jane Smith', amount: '$159.00', status: 'Pending', date: '2024-01-15' },
    { id: '#12347', customer: 'Mike Johnson', amount: '$89.00', status: 'Processing', date: '2024-01-14' },
    { id: '#12348', customer: 'Sarah Wilson', amount: '$199.00', status: 'Completed', date: '2024-01-14' },
    { id: '#12349', customer: 'Tom Brown', amount: '$349.00', status: 'Cancelled', date: '2024-01-13' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'increase' ? (
                        <ArrowUpRight size={16} className="text-green-500" />
                      ) : (
                        <ArrowDownRight size={16} className="text-red-500" />
                      )}
                      <span className={`text-sm font-medium ml-1 ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">from last month</span>
                    </div>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <span className="text-white">{stat.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Users size={20} className="text-gray-400 group-hover:text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Add New User</p>
                      <p className="text-sm text-gray-500">Create a new user account</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart size={20} className="text-gray-400 group-hover:text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">New Product</p>
                      <p className="text-sm text-gray-500">Add product to inventory</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <BarChart3 size={20} className="text-gray-400 group-hover:text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-500">Check detailed reports</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Activity size={20} className="text-gray-400 group-hover:text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">System Health</p>
                      <p className="text-sm text-gray-500">Monitor system status</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;