import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FileSearch, Clock, AlertTriangle, Check, X } from "lucide-react";
import axios from "axios";

import Header from "../components/common/Header";
import LineGraph from "../components/overview/lineGraph";
import CategoryDistributionChart from "../components/overview/CategoryDistributionChart";
import TwoValueRadialChart from "../components/overview/TwoValueRadialChart";
import AverageResolutionTimeChart from '../components/adminOverview/AverageResolutionTimeChart';

import QueryStatusChart from "../components/queries/QueryStatusChart";
import QueryTypeDistribution from "../components/queries/QueryTypeDistribution";
import QueryTrends from "../components/queries/QueryTrends";
import StatCard from "../components/common/StatCard";

import InfractionsByDivisionChart from "../components/adminOverview/InfractionsByDivisionChart";
import HorizontalBarChart from "../components/adminOverview/HorizontalBarChart";

import DivisionNames from "../utils/DivisionNames";

const userData = JSON.parse(localStorage.getItem("userData"));

const backendUrl = import.meta.env.VITE_Backend_URL || "http://localhost:3000";

const AdminOverviewPage = () => {

  const [dashboardData, setDashboardData] = useState({
    queriesPerDay: [],
    queryTypes: [],
    queryStatus: { pending: 0, inProgress: 0, resolved: 0, rejected: 0 },
    totalQueries: 0,
    userCount: 0,
    activeSessions: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timelineActive, setTimelineActive] = useState(false);
  const [filteredStats, setFilteredStats] = useState({
    byStatus: {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    },
    byType: {
      trafficViolation: 0,
      trafficCongestion: 0,
      irregularity: 0,
      roadDamage: 0,
      illegalParking: 0,
      suggestion: 0,
      trafficsignalissue: 0,
    },
    total: 0,
  });

  const transitionDuration = 1;
  const transitionDelay = 0.2;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const dashboardPromises = [];
        let allRecentActivities = [];

        if (userData && userData.role === "division_admin") {
          dashboardPromises.push(
            axios.get(
              `${backendUrl}/api/dashboard/summary?division=${userData.divisionId}`
            )
          );
          let page = 1;
          let hasMore = true;
          while (hasMore) {
            const activityRes = await axios.get(
              `${backendUrl}/api/dashboard/recent-activity?division=${userData.divisionId}&limit=1000&page=${page}`
            );
            const activities = activityRes.data.data || [];
            allRecentActivities = [...allRecentActivities, ...activities];
            hasMore = activities.length === 1000;
            page += 1;
          }
        } else {
          dashboardPromises.push(
            axios.get(`${backendUrl}/api/dashboard/summary`)
          );
          let page = 1;
          let hasMore = true;
          while (hasMore) {
            const activityRes = await axios.get(
              `${backendUrl}/api/dashboard/recent-activity?limit=1000&page=${page}`
            );
            const activities = activityRes.data.data || [];
            allRecentActivities = [...allRecentActivities, ...activities];
            hasMore = activities.length === 1000;
            page += 1;
          }
        }

        const [summaryRes] = await Promise.all(dashboardPromises);

        setDashboardData(summaryRes.data.data || {});
      
        setRecentActivity(allRecentActivities);
        
        if (allRecentActivities.length > 0) {
          //console.log("Sample recent activity:", allRecentActivities[0]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendUrl]);


  useEffect(() => {
    if (!dashboardData) return;
    
    // First transform the data (same as your existing code)
    const queryTypesData = dashboardData.queryTypes?.map((item) => ({
      name: item._id,
      value: item.count,
    })) || [];
  
    // Now set the filteredStats after we have the queryTypesData
    setFilteredStats({
      byStatus: dashboardData.queryStatus || {
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
      },
      byType: {
        trafficViolation: queryTypesData.find(item => item.name === "Traffic Violation")?.value || 0,
        trafficCongestion: queryTypesData.find(item => item.name === "Traffic Congestion")?.value || 0,
        irregularity: queryTypesData.find(item => item.name === "Irregularity")?.value || 0,
        roadDamage: queryTypesData.find(item => item.name === "Road Damage")?.value || 0,
        illegalParking: queryTypesData.find(item => item.name === "Illegal Parking")?.value || 0,
        suggestion: queryTypesData.find(item => item.name === "Suggestion")?.value || 0,
        trafficsignalissue: queryTypesData.find(item => item.name === "Traffic Signal Issue")?.value || 0,
      },
      total: dashboardData.totalQueries || 0,
    });
  }, [dashboardData]);

  // Transform existing dashboard data
  const queryTypesData =
    dashboardData.queryTypes?.map((item) => ({
      name: item._id,
      value: item.count,
    })) || [];

  const pendingQueriesData = [
    { name: "Pending", value: dashboardData.queryStatus?.pending || 0 },
    {
      name: "Total",
      value:
        (dashboardData.totalQueries || 0) -
        (dashboardData.queryStatus?.pending || 0),
    },
  ];

  const inProgressQueriesData = [
    { name: "In Progress", value: dashboardData.queryStatus?.inProgress || 0 },
    {
      name: "Total",
      value:
        (dashboardData.totalQueries || 0) -
        (dashboardData.queryStatus?.inProgress || 0),
    },
  ];

  const resolvedQueriesData = [
    { name: "Resolved", value: dashboardData.queryStatus?.resolved || 0 },
    {
      name: "Total",
      value:
        (dashboardData.totalQueries || 0) -
        (dashboardData.queryStatus?.resolved || 0),
    },
  ];

  const rejectedQueriesData = [
    { name: "Rejected", value: dashboardData.queryStatus.rejected },
    {
      name: "Total",
      value: dashboardData.totalQueries - dashboardData.queryStatus.rejected,
    },
  ];

  const queriesPerDayData =
    dashboardData.queriesPerDay?.map((item) => ({
      name: new Date(item._id).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      reports: item.count,
    })) || [];

  // Transform recentActivity into date-wise resolved percentage data for all divisions
  const resolvedPercentageData = (() => {
    const allDivisions = [
      ...new Set(
        recentActivity.map((activity) => {
          const divisionName =
            activity.divisionName || activity.division?._id || "Unknown";
          return divisionName
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        })
      ),
    ].filter((division) => DivisionNames.includes(division));

    const groupedData = recentActivity.reduce((acc, activity) => {
      const date = new Date(activity.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const rawDivisionName =
        activity.divisionName || activity.division?._id || "Unknown";
      const divisionName = rawDivisionName
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (!DivisionNames.includes(divisionName)) return acc;

      const status = activity.status || "Unknown";

      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][divisionName]) {
        acc[date][divisionName] = { total: 0, resolved: 0 };
      }

      acc[date][divisionName].total += 1;
      if (status === "Resolved") {
        acc[date][divisionName].resolved += 1;
      }

      return acc;
    }, {});

    const startDate = new Date("2025-02-28");
    const endDate = new Date("2025-03-22");
    const dates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(
        new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );
    }

    return dates.map((date) => {
      const entry = { name: date };
      allDivisions.forEach((divisionName) => {
        const dataForDivision = groupedData[date]?.[divisionName] || {
          total: 0,
          resolved: 0,
        };
        const percentage =
          dataForDivision.total > 0
            ? (dataForDivision.resolved / dataForDivision.total) * 100
            : 0;
        entry[divisionName] = percentage;
      });
      return entry;
    });
  })();

  // Transform recentActivity into infractions by division
  const infractionsByDivision = (() => {
    const allStatuses = [
      ...new Set(
        recentActivity.map((activity) =>
          activity.status ? activity.status.toLowerCase() : "unknown"
        )
      ),
    ];
    //onsole.log("All statuses in recentActivity:", allStatuses);

    const allDivisions = [
      ...new Set(
        recentActivity.map((activity) => {
          const divisionName =
            activity.divisionName || activity.division?._id || "Unknown";
          return divisionName
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        })
      ),
    ].filter((division) => DivisionNames.includes(division));

    //Whoever wrote this bro WHYYYYYYy
    ////onsole.log("Filtered divisions (only allowed ones):", allDivisions);

    const groupedByDivision = recentActivity.reduce((acc, activity) => {
      const rawDivisionName =
        activity.divisionName || activity.division?._id || "Unknown";
      const divisionName = rawDivisionName
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (!DivisionNames.includes(divisionName)) return acc;

      const status = activity.status
        ? activity.status.toLowerCase()
        : "unknown";

      if (!acc[divisionName]) {
        acc[divisionName] = {
          pending: 0,
          inProgress: 0,
          resolved: 0,
          rejected: 0,
        };
      }

      if (status === "pending") {
        acc[divisionName].pending += 1;
      } else if (status === "in progress") {
        acc[divisionName].inProgress += 1;
      } else if (status === "resolved" || status === "closed") {
        acc[divisionName].resolved += 1;
      } else if (status === "rejected") {
        acc[divisionName].rejected += 1;
      } else {
        acc[divisionName].pending += 1;
        /*console.log(
          `Mapped status "${status}" to Pending for division ${divisionName}`
        );*/
      }

      return acc;
    }, {});

    /* console.log(
       "Grouped by division (only allowed divisions):",
       groupedByDivision
     );*/

    const result = allDivisions.map((divisionName) => ({
      name: divisionName,
      pending: groupedByDivision[divisionName]?.pending || 0,
      inProgress: groupedByDivision[divisionName]?.inProgress || 0,
      resolved: groupedByDivision[divisionName]?.resolved || 0,
      rejected: groupedByDivision[divisionName]?.rejected || 0,
    }));

    const totalQueriesInChart = result.reduce((sum, division) => {
      return (
        sum +
        division.pending +
        division.inProgress +
        division.resolved +
        division.rejected
      );
    }, 0);
    // console.log(
    //   "Total queries in chart (only allowed divisions):",
    //   totalQueriesInChart
    // );

    return result;
  })();

  // Average Resolution Time Per Division (for allowed divisions)
  const avgResolutionTimePerDivision = (() => {
    if (!recentActivity || recentActivity.length === 0) {
      return [];
    }

    const allDivisions = [
      ...new Set(
        recentActivity.map((activity) => {
          const divisionName =
            activity.divisionName || activity.division?._id || "Unknown";
          return divisionName
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        })
      ),
    ].filter((division) => DivisionNames.includes(division));

    const groupedByDivision = recentActivity.reduce((acc, activity) => {
      const divisionName = (
        activity.divisionName ||
        activity.division?._id ||
        "Unknown"
      )
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (!DivisionNames.includes(divisionName)) return acc;

      const resolutionTime = activity.resolved_at || activity.updatedAt;
      if (!resolutionTime || !activity.timestamp) return acc;

      const timeToResolve =
        (new Date(resolutionTime) - new Date(activity.timestamp)) /
        (1000 * 60 * 60);
      if (timeToResolve < 0) return acc;

      if (!acc[divisionName]) {
        acc[divisionName] = { totalTime: 0, count: 0, resolvedQueries: [] };
      }
      acc[divisionName].totalTime += timeToResolve;
      acc[divisionName].count += 1;
      acc[divisionName].resolvedQueries.push({
        id: activity._id,
        timestamp: activity.timestamp,
        resolved_at: resolutionTime,
        timeToResolve: timeToResolve,
      });

      return acc;
    }, {});

    return allDivisions.map((divisionName) => {
      const divisionData = groupedByDivision[divisionName] || {
        totalTime: 0,
        count: 0,
      };
      const averageTime =
        divisionData.count > 0
          ? parseFloat((divisionData.totalTime / divisionData.count).toFixed(2))
          : 0;
      return { name: divisionName, value: averageTime };
    });
  })();

  const _innerRadius = 20;
  const _outerRadius = 35;

  //onsole.log("Total queries from dashboardData:", dashboardData.totalQueries);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10 flex flex-col items-center justify-center h-screen bg-bgPrimary">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="w-12 h-12 absolute top-1/2 left-1/2 -ml-6 -mt-6 border-4 border-t-4 border-green-400 border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
        </div>
        <div className="mt-6 text-tBase text-lg font-medium animate-pulse">
          Loading dashboard data...
        </div>
        <div className="mt-2 w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-[progressBar_2s_ease-in-out_infinite]"></div>
        </div>
        <style jsx>{`
          @keyframes progressBar {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto relative z-10 flex items-center justify-center">
        <div className="bg-red-800 bg-opacity-50 backdrop-blur-md p-5 rounded-lg text-tBase">
          {error}
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <>
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: transitionDuration }}
      >
        <TwoValueRadialChart
          name={"Pending Issues"}
          categoryData={pendingQueriesData}
          innerRadius={_innerRadius}
          outerRadius={_outerRadius}
          height={100}
        />
        <TwoValueRadialChart
          name={"In Progress"}
          categoryData={inProgressQueriesData}
          innerRadius={_innerRadius}
          outerRadius={_outerRadius}
          height={100}
        />
        <TwoValueRadialChart
          name={"Resolved Issues"}
          categoryData={resolvedQueriesData}
          innerRadius={_innerRadius}
          outerRadius={_outerRadius}
          height={100}
        />
        <TwoValueRadialChart
          name={"Rejected Issues"}
          categoryData={rejectedQueriesData}
          innerRadius={_innerRadius}
          outerRadius={_outerRadius}
          height={100}
        />
      </motion.div>

      <motion.div
        className="bg-bgSecondary bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-borderPrimary mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: transitionDuration, delay: transitionDelay }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-tBase">
            Total Traffic Reports
          </h2>
          <div className="text-3xl font-bold text-tTrafficReports">
            {dashboardData.totalQueries || 0}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 2.2,
        }}
      >
        <QueryStatusChart stats={filteredStats.byStatus} />
        <QueryTypeDistribution 
          stats={filteredStats.byType} 
          division_admin={true}
          loading={loading} 
        />
      </motion.div>

      <motion.div
        className="bg-bgSecondary bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-borderPrimary mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 2.25,
        }}
      >
        <div className="flex flex-col gap-3 mb-4">
          <StatCard
            name="Total Queries"
            icon={FileSearch}
            value={filteredStats.total.toLocaleString()}
            color="#6366F1"
          />
          <div className="grid grid-cols-2 gap-3"> 
            <StatCard
              name="Pending"
              icon={Clock}
              value={filteredStats.byStatus?.pending || 0}
              color="#F59E0B"
            />
            <StatCard
              name="In Progress"
              icon={AlertTriangle}
              value={filteredStats.byStatus?.inProgress || 0}
              color="#3B82F6"
            />
            <StatCard
              name="Resolved"
              icon={Check}
              value={filteredStats.byStatus?.resolved || 0}
              color="#10B981"
            />
            <StatCard
              name="Rejected"
              icon={X}
              value={filteredStats.byStatus?.rejected || 0}
              color="#EF4444"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 2.3,
        }}
      >
        <QueryTrends
          timelineActive={timelineActive}
          startDate={startDate}
          endDate={endDate}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 2,
        }}
      >
        <LineGraph data={queriesPerDayData} name={"Reports Per Day"} />
        <CategoryDistributionChart
          categoryData={queryTypesData}
          name={"Report Categories"}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 2.5,
        }}
      >
        <InfractionsByDivisionChart
          data={infractionsByDivision}
          name={"Infractions by Division"}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 3,
        }}
      >
        <HorizontalBarChart
          data={avgResolutionTimePerDivision}
          name={"Average Resolution Time Per Division (Hours)"}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 3.5,
        }}
      > 
        {/* { <LineGraph
          data={resolvedPercentageData}
          name={"Percentage of Resolved Queries by Division"}
        /> */}
        <AverageResolutionTimeChart
          data={avgResolutionTimePerDivision}
          name={"Average Resolution Time For Traffic Congestion Per Division (Hours)"}
          innerRadius={_innerRadius}
          outerRadius={_outerRadius}
          height={100}
        />
      </motion.div> 

      <motion.div
        className="bg-bgSecondary bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-borderPrimary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: transitionDuration,
          delay: transitionDelay * 4,
        }}
      >
        <h2 className="text-lg font-medium mb-4 text-tBase">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-seperationPrimary">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-tBase uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tBase uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tBase uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tBase uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tBase uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-seperationPrimary">
              {recentActivity.slice(0, 5).map((activity, idx) => {
                const locationAddress = activity.location?.address
                  ? activity.location.address.split(",").slice(0, 2).join(",")
                  : "Location not available";

                return (
                  <tr
                    key={activity._id}
                    className={
                      idx % 2 === 0
                        ? "bg-bgSecondary bg-opacity-40"
                        : "bg-bgSecondary bg-opacity-20"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {activity.query_type || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200">
                      {activity.description || "No description"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {locationAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            activity.status === "Pending"
                              ? "bg-yellow-800 text-yellow-100"
                              : activity.status === "In Progress"
                              ? "bg-blue-800 text-blue-100"
                              : "bg-green-800 text-green-100"
                          }`}
                      >
                        {activity.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleString()
                        : "Unknown time"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Traffic Buddy Dashboard" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {renderOverviewTab()}
      </main>
    </div>
  );
};

export default AdminOverviewPage;
