// src/pages/admin/AdminDashboard/AdminDashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { adminService } from '../../../services/api/adminService';
import { courseService } from '../../../services/api/courseService';

// Define interfaces for our data
interface Activity {
  id: string;
  type: string;
  message: string;
  details: string;
  timestamp: string;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface MonthlyRevenueData {
  name: string;
  revenue: number;
  courses: number;
}

interface UserGrowthData {
  name: string;
  users: number;
  newUsers: number;
}

interface PlatformActivityData {
  name: string;
  registrations: number;
  enrollments: number;
}

interface ChartData {
  monthlyRevenue: MonthlyRevenueData[];
  userGrowth: UserGrowthData[];
  courseCategories: CategoryData[];
  platformActivity: PlatformActivityData[];
  colors: string[];
}

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    revenue: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    monthlyRevenue: [],
    userGrowth: [],
    courseCategories: [],
    platformActivity: [],
    colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
  });
  const [courses, setCourses] = useState<any[]>([]);

  const processMonthlyRevenue = useCallback((courses: any[]): MonthlyRevenueData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = months.map((month, index) => {
      const monthCourses = courses.filter(course => {
        const courseDate = new Date(course.createdAt);
        return courseDate.getMonth() === index;
      });

      const revenue = monthCourses.reduce((sum, course) => {
        return sum + (course.fullCoursePrice || 0) * (course.currentEnrollments || 0);
      }, 0);

      return {
        name: month,
        revenue: Math.round(revenue),
        courses: monthCourses.length
      };
    });

    return monthlyData.slice(0, 6);
  }, []);

  const processUserGrowth = useCallback((users: any[]): UserGrowthData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      const monthUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === index;
      });

      const cumulativeUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() <= index;
      }).length;

      return {
        name: month,
        users: cumulativeUsers,
        newUsers: monthUsers.length
      };
    }).slice(0, 6);
  }, []);

  const processCourseCategories = useCallback((courses: any[]): CategoryData[] => {
    const categoryCount: { [key: string]: number } = {};
    
    courses.forEach(course => {
      const category = course.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / courses.length) * 100)
    }));
  }, []);

  const processPlatformActivity = useCallback((): PlatformActivityData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map(day => {
      const randomRegistrations = Math.floor(Math.random() * 10) + 2;
      const randomEnrollments = Math.floor(Math.random() * 15) + 5;

      return {
        name: day,
        registrations: randomRegistrations,
        enrollments: randomEnrollments
      };
    });
  }, []);

  const formatTimeAgo = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }, []);

  const generateRecentActivity = useCallback((courses: any[], users: any[]): Activity[] => {
    const activities: Activity[] = [];
    
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    const recentCourses = courses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: 'user_registration',
        message: 'New user registration',
        details: `${user.fullName} registered as ${user.role}`,
        timestamp: formatTimeAgo(user.createdAt)
      });
    });

    recentCourses.forEach(course => {
      activities.push({
        id: `course-${course._id}`,
        type: 'course_published',
        message: 'Course published',
        details: `"${course.title}" by ${course.instructor?.fullName}`,
        timestamp: formatTimeAgo(course.createdAt)
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [formatTimeAgo]);

  const processChartData = useCallback((courses: any[], users: any[], stats: any): ChartData => {
    const monthlyRevenue = processMonthlyRevenue(courses);
    const userGrowth = processUserGrowth(users);
    const courseCategories = processCourseCategories(courses);
    const platformActivity = processPlatformActivity();

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return {
      monthlyRevenue,
      userGrowth,
      courseCategories,
      platformActivity,
      colors: COLORS
    };
  }, [processMonthlyRevenue, processUserGrowth, processCourseCategories, processPlatformActivity]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const usersStats = await adminService.getUsersStats();
      const coursesResponse = await courseService.getCourses({ 
        page: 1, 
        limit: 1000
      });
      const usersResponse = await adminService.getUsers({ 
        page: 1, 
        limit: 1000 
      });

      setCourses(coursesResponse.courses);

      const processedChartData = processChartData(
        coursesResponse.courses, 
        usersResponse.users,
        usersStats
      );

      setChartData(processedChartData);

      setStats({
        totalUsers: usersStats.totalUsers || usersResponse.users.length,
        totalCourses: coursesResponse.pagination.totalCourses || coursesResponse.courses.length,
        revenue: usersStats.revenue || 0,
        loading: false
      });

      const activityData = generateRecentActivity(coursesResponse.courses, usersResponse.users);
      setRecentActivity(activityData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [processChartData, generateRecentActivity]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getPendingCoursesCount = (): number => {
    return courses.filter(course => 
      course.approvalStatus?.status === 'pending' || 
      course.status === 'pending'
    ).length;
  };

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  // Custom label renderer for PieChart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">Active platform users</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Courses</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalCourses.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">Published courses</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">Total platform revenue</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue & Courses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, 'Value']} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
              <Bar dataKey="courses" fill="#82ca9d" name="Courses Published" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Area Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, 'Users']} />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Total Users" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Course Categories Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
               data={chartData.courseCategories.map((item) => ({
  name: item.name,
  value: item.value,
  percentage: item.percentage
}))}

                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.courseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartData.colors[index % chartData.colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} courses`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Activity Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Platform Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.platformActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="#8884d8" 
                name="New Registrations" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="enrollments" 
                stroke="#82ca9d" 
                name="Course Enrollments" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition duration-200"
          onClick={() => window.location.href = '/admin/users'}
        >
          <div className="font-semibold">Manage Users</div>
          <div className="text-sm opacity-90">View and manage all users</div>
        </button>
        
        <button 
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition duration-200"
          onClick={() => window.location.href = '/admin/courses'}
        >
          <div className="font-semibold">Manage Courses</div>
          <div className="text-sm opacity-90">Approve and manage courses</div>
        </button>
        
        <button 
          className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition duration-200"
          onClick={() => window.location.href = '/admin/analytics'}
        >
          <div className="font-semibold">View Analytics</div>
          <div className="text-sm opacity-90">Platform performance</div>
        </button>
        
        <button 
          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg text-center transition duration-200"
          onClick={() => window.location.href = '/admin/settings'}
        >
          <div className="font-semibold">Settings</div>
          <div className="text-sm opacity-90">Platform configuration</div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'user_registration' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div>
                  <p className="font-medium text-gray-800">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email Service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Actions</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Courses Pending Review</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                {getPendingCoursesCount()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">User Reports</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Support Tickets</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;