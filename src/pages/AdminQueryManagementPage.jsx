import { useState, useEffect } from "react";
import CustomDropdown from "../components/common/CustomDropdown";
import Pagination from "../components/common/Pagination";
import {
  AlertTriangle,
  Check,
  Clock,
  FileSearch,
  Mail,
  MapPin,
  Search,
  Calendar,
  Download,
  Mic,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import * as XLSX from "xlsx";

import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import QueryStatusChart from "../components/queries/QueryStatusChart";
import QueryTypeDistribution from "../components/queries/QueryTypeDistribution";
import QueryTrends from "../components/queries/QueryTrends";

const backendUrl = import.meta.env.VITE_Backend_URL || "http://localhost:3000";

const divisions = [
  { value: "MAHALUNGE", label: "Mahalunge", id: "67dac1a2a771ed87f82890b2" },
  { value: "CHAKAN", label: "Chakan", id: "67dc019a6532e1c784d60840" },
  {
    value: "DIGHI ALANDI",
    label: "Dighi-Alandi",
    id: "67db077dfa28812fe4f9573f",
  },
  { value: "BHOSARI", label: "Bhosari", id: "67dc19f0a9ae16de2619b735" },
  { value: "TALWADE", label: "Talwade", id: "67dac59365aca82fe28bb003" },
  { value: "PIMPRI", label: "Pimpri", id: "67dc18f0a9ae16de2619b72c" },
  { value: "CHINCHWAD", label: "Chinchwad", id: "67dc1a41a9ae16de2619b739" },
  { value: "NIGDI", label: "Nigdi", id: "67dc184da9ae16de2619b728" },
  { value: "SANGAVI", label: "Sangavi", id: "67dc198ea9ae16de2619b731" },
  { value: "HINJEWADI", label: "Hinjewadi", id: "67dc19b7a9ae16de2619b733" },
  { value: "WAKAD", label: "Wakad", id: "67dc189fa9ae16de2619b72a" },
  { value: "BAVDHAN", label: "Bavdhan", id: "67dc1969a9ae16de2619b72f" },
  { value: "DEHUROAD", label: "Dehuroad", id: "67dc1a22a9ae16de2619b737" },
  { value: "TALEGAON", label: "Talegaon", id: "67dac3e9bb20f51c531c1509" },
];

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Rejected", label: "Rejected" },
];

const AdminQueryManagementPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timelineActive, setTimelineActive] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedQueryForEmail, setSelectedQueryForEmail] = useState(null);
  const [departmentEmail, setDepartmentEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [isAggregate, setIsAggregate] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [resolverName, setResolverName] = useState("");

  // Original query stats (all data)
  const [queryStats, setQueryStats] = useState({
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
      generalReport: 0,
    },
    total: 0,
  });
  // New state for filtered query stats
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
      generalReport: 0,
    },
    total: 0,
  });
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDivision, setSelectedDivison] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // For main page filter
  const [detailsSelectedStatus, setDetailsSelectedStatus] = useState(""); // For details popup
  const [viewDetailsId, setViewDetailsId] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Resolve modal states
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedQueryForResolve, setSelectedQueryForResolve] = useState(null);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false); // For voice recognition
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedQueryForReject, setSelectedQueryForReject] = useState(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectSuccess, setRejectSuccess] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [isRejectListening, setIsRejectListening] = useState(false); // For voice recognition

  // State for selected action in dropdown (not used anymore, but kept for compatibility)
  const [selectedAction, setSelectedAction] = useState("");

  useEffect(() => {
    fetchQueryStats();
    fetchDepartments();
    if (!timelineActive) {
      fetchQueries();
    }
  }, [
    currentPage,
    searchTerm,
    selectedType,
    selectedStatus,
    selectedDivision,
    timelineActive,
    isAggregate,
  ]);

  // Update filtered stats whenever queries change
  useEffect(() => {
    // Only recalculate filtered stats when we have meaningful data
    if (queries && queries.length > 0 && !loading) {
      console.log("Recalculating stats from queries...");
      calculateFilteredStats();
    }
  }, [queries, loading]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/departments`);
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchQueryStats = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/queries/statistics`);
      if (response.data.success) {
        setQueryStats(response.data.stats);
        if (
          !searchTerm &&
          !selectedType &&
          !selectedStatus &&
          !selectedDivision &&
          !timelineActive
        ) {
          setFilteredStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error("Error fetching query statistics:", error);
    }
  };

  // const calculateFilteredStats = () => {
  //   if (!queries.length) return;

  //   const byStatus = {
  //     pending: 0,
  //     inProgress: 0,
  //     resolved: 0,
  //     rejected: 0,
  //   };

  //   const byType = {
  //     trafficViolation: 0,
  //     trafficCongestion: 0,
  //     irregularity: 0,
  //     roadDamage: 0,
  //     illegalParking: 0,
  //     trafficSignalIssue: 0,
  //     suggestion: 0,
  //     generalReport: 0,
  //   };

  //   queries.forEach((query) => {
  //     if (query.status === "Pending") byStatus.pending++;
  //     else if (query.status === "In Progress") byStatus.inProgress++;
  //     else if (query.status === "Resolved") byStatus.resolved++;
  //     else if (query.status === "Rejected") byStatus.rejected++;

  //     const typeKey =
  //       query.query_type.replace(/\s+/g, "").charAt(0).toLowerCase() +
  //       query.query_type.replace(/\s+/g, "").slice(1);
  //     if (byType.hasOwnProperty(typeKey)) {
  //       byType[typeKey]++;
  //     } else {
  //       if (query.query_type === "Traffic Violation") byType.trafficViolation++;
  //       else if (query.query_type === "Traffic Congestion")
  //         byType.trafficCongestion++;
  //       else if (query.query_type === "Irregularity") byType.irregularity++;
  //       else if (query.query_type === "Road Damage") byType.roadDamage++;
  //       else if (query.query_type === "Illegal Parking")
  //         byType.illegalParking++;
  //       else if (query.query_type === "Traffic Signal Issue") byType.trafficSignalIssue++;
  //       else if (query.query_type === "Suggestion") byType.suggestion++;
  //       else if (query.query_type === "General Report") byType.generalReport++;
  //     }
  //   });

  //   const total = queries.length;

  //   setFilteredStats({
  //     byStatus,
  //     byType,
  //     total,
  //   });
  // };

  const calculateFilteredStats = () => {
    if (!queries || !queries.length) {
      console.log("No queries to calculate stats from");
      return;
    }
  
    console.log("Calculating filtered stats from", queries.length, "queries");
  
    const byStatus = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };
  
    const byType = {
      trafficViolation: 0,
      trafficCongestion: 0,
      irregularity: 0,
      roadDamage: 0,
      illegalParking: 0,
      suggestion: 0,
      generalReport: 0,
    };
  
    // Count query types and log them for debugging
    const typeCounter = {};
    
    queries.forEach((query) => {
      // For status counting
      if (query.status === "Pending") byStatus.pending++;
      else if (query.status === "In Progress") byStatus.inProgress++;
      else if (query.status === "Resolved") byStatus.resolved++;
      else if (query.status === "Rejected") byStatus.rejected++;
  
      // For type counting - track in a simple object first for debugging
      if (!typeCounter[query.query_type]) {
        typeCounter[query.query_type] = 0;
      }
      typeCounter[query.query_type]++;
  
      // For the actual counts
      if (query.query_type === "Traffic Violation") byType.trafficViolation++;
      else if (query.query_type === "Traffic Congestion") byType.trafficCongestion++;
      else if (query.query_type === "Irregularity") byType.irregularity++;
      else if (query.query_type === "Road Damage") byType.roadDamage++;
      else if (query.query_type === "Illegal Parking") byType.illegalParking++;
      else if (query.query_type === "Suggestion") byType.suggestion++;
      else if (query.query_type === "General Report") byType.generalReport++;
    });
  
    // Log the count of each type for debugging
    console.log("Type counts:", typeCounter);
    console.log("Calculated irregularity count:", byType.irregularity);
  
    const total = queries.length;
  
    setFilteredStats({
      byStatus,
      byType,
      total,
    });
  };

  const fetchQueries = async () => {
    setLoading(true);
    try {      // Using consistent limit of 15 items per page across all management pages
      let url = `${backendUrl}/api/queries?page=${currentPage}&limit=15&aggregate=${isAggregate}`;

      // Add search term if provided
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      if (selectedType && selectedType !== "all") {
        url += `&query_type=${selectedType}`;
      }

      if (selectedStatus && selectedStatus !== "all") {
        url += `&status=${selectedStatus}`;
      }

      if (selectedDivision) {
        const divisionId =
          divisions.find((d) => d.value === selectedDivision)?.id || "";
        url += `&division=${divisionId}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        setQueries(response.data.data);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryDetails = async (id) => {
    try {
      const response = await axios.get(`${backendUrl}/api/queries/${id}`);
      if (response.data.success) {
        setDetailsData(response.data.data);
        setViewDetailsId(id);
        setDetailsSelectedStatus(response.data.data.status); // Initialize with current status
      }
    } catch (error) {
      console.error("Error fetching query details:", error);
    }
  };

  const updateQueryStatus = async (id, newStatus) => {
    try {
      await axios.put(`${backendUrl}/api/queries/${id}/status`, {
        status: newStatus,
      });

      fetchQueries();
      fetchQueryStats();

      if (viewDetailsId === id) {
        fetchQueryDetails(id);
      }
    } catch (error) {
      console.error("Error updating query status:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!departmentEmail || !departmentName) {
      alert("Please enter both department email and name");
      return;
    }

    console.log("Sending email for query:", selectedQueryForEmail);
    setEmailSending(true);

    try {
      const queryId = selectedQueryForEmail._id || selectedQueryForEmail.id;

      console.log(
        `Making request to: ${backendUrl}/api/queries/${queryId}/notify-department`
      );

      const response = await axios.post(
        `${backendUrl}/api/queries/${queryId}/notify-department`,
        {
          emails: departmentEmail,
          departmentName: departmentName,
        }
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        alert(`Email successfully sent to ${departmentName}`);
        setEmailModalOpen(false);
        setDepartmentEmail("");
        setDepartmentName("");
        setSelectedQueryForEmail(null);
      }
    } catch (error) {
      console.error("Error sending email:", error);

      let errorMessage = "Failed to send email. Please try again.";

      if (error.response) {
        errorMessage = `Error: ${
          error.response.data.message || error.response.statusText
        }`;
        console.log("Server error details:", error.response.data);
      } else if (error.request) {
        errorMessage = "Server did not respond. Check your connection.";
      }

      alert(errorMessage);
    } finally {
      setEmailSending(false);
    }
  };

  const openInGoogleMaps = (latitude, longitude) => {
    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}`,
      "_blank"
    );
  };

  const applyTimelineFilter = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setTimelineActive(true);

    try {
      console.log("Date strings from inputs:", startDate, endDate);

      const formattedStartDate = startDate;
      const formattedEndDate = endDate;

      const divisionId =
        divisions.find((d) => d.value === selectedDivision)?.id || "";

      console.log(
        `Sending timeline request with dates: ${formattedStartDate}, ${formattedEndDate}, division ID: ${divisionId}`
      );

      const response = await axios.get(
        `${backendUrl}/api/queries/time-filter?start=${formattedStartDate}&end=${formattedEndDate}&division=${divisionId}`
      );      if (response.data.success) {
        console.log(`Received ${response.data.count} queries for time range`);
        setQueries(response.data.data);
        setTotalPages(Math.ceil(response.data.count / 15));
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching timeline queries:", error);
      if (error.response) {
        console.error("Server response data:", error.response.data);
      }
      alert("Error fetching data. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const clearTimelineFilter = () => {
    setStartDate("");
    setEndDate("");
    setTimelineActive(false);
    setIsAggregate(true);
    fetchQueries();
  };

  const sendEmail = (query) => {
    console.log("Query being sent:", query);
    setSelectedQueryForEmail(query);
    setEmailModalOpen(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  const handleDivisionFilter = (e) => {
    setSelectedDivison(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleAggregateChange = (e) => {
    setIsAggregate(e.target.checked);
    setCurrentPage(1);
  };

  const handleDepartmentChange = (e) => {
    const selectedOption = e.target.value;
    const selectedDepartment = departments.find(
      (dept) => dept.name === selectedOption
    );
    if (selectedDepartment) {
      setDepartmentEmail(selectedDepartment.emails);
      setDepartmentName(selectedDepartment.name);
    } else {
      setDepartmentEmail("");
      setDepartmentName("");
    }
    setSelectedDepartment(selectedOption);
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-red-700 text-yellow-100";
      case "In Progress":
        return "bg-yellow-500 text-blue-100";
      case "Resolved":
        return "bg-green-700 text-green-100";
      case "Rejected":
        return "bg-purple-500 text-red-100"; // Try purple-500
      default:
        return "bg-bgSecondary text-tBase";
    }
  };

  const closeDetails = () => {
    setViewDetailsId(null);
    setDetailsData(null);
    setDetailsSelectedStatus(""); // Reset details popup status
    setSelectedAction(""); // Reset selected action when closing
  };

  const downloadAsExcel = async () => {
    setExportLoading(true);
    try {
      let dataToDownload = [];

      if (
        searchTerm ||
        selectedType ||
        selectedStatus ||
        selectedDivision ||
        timelineActive
      ) {
        if (queries.length < 100) {
          dataToDownload = queries;
        } else {
          let url = `${backendUrl}/api/queries?limit=1000?aggregate=${isAggregate}`;

          if (searchTerm) {
            url += `&search=${searchTerm}`;
          }

          if (selectedType && selectedType !== "all") {
            url += `&query_type=${selectedType}`;
          }

          if (selectedStatus && selectedStatus !== "all") {
            url += `&status=${selectedStatus}`;
          }

          if (selectedDivision) {
            const divisionId =
              divisions.find((d) => d.value === selectedDivision)?.id || "";
            url += `&division=${divisionId}`;
          }

          if (timelineActive && startDate && endDate) {
            url = `${backendUrl}/api/queries/timeline?start=${startDate}T00:00:00.000Z&end=${endDate}T23:59:59.999Z&limit=1000&aggregate=${isAggregate}`;
            if (selectedDivision) {
              const divisionId =
                divisions.find((d) => d.value === selectedDivision)?.id || "";
              url += `&division=${divisionId}`;
            }
          }

          const response = await axios.get(url);
          if (response.data.success) {
            dataToDownload = response.data.data;
          }
        }
      } else {
        const response = await axios.get(
          `${backendUrl}/api/queries?limit=1000&aggregate=${isAggregate}`
        );
        if (response.data.success) {
          dataToDownload = response.data.data;
        }
      }

      const excelData = dataToDownload.map((q) => ({
        ID: q._id,
        Type: q.query_type,
        Description: q.description,
        Status: q.status,
        User: q.user_name,
        Contact: q.user_id,
        Date: formatDate(q.timestamp),
        Location: q.location?.address || "N/A",
        Latitude: q.location?.latitude || "N/A",
        Longitude: q.location?.longitude || "N/A",
        "Resolution Note": q.resolution_note || "",
        "Resolved At": q.resolved_at ? formatDate(q.resolved_at) : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Queries");

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      let fileName = `traffic-buddy-queries-${dateStr}.xlsx`;

      if (selectedType) fileName = `${selectedType.toLowerCase()}-${fileName}`;
      if (selectedStatus)
        fileName = `${selectedStatus.toLowerCase()}-${fileName}`;
      if (timelineActive) fileName = `timeline-${fileName}`;

      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("There was an error exporting your data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const openRejectModal = (query) => {
    setSelectedQueryForReject(query);
    setRejectModalOpen(true);
    setRejectMessage("");
    setRejectError("");
    setRejectSuccess("");
  };
  
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setRejectError("");
    setRejectSuccess("");
    
    // Validate that name is provided
    if (!resolverName.trim()) {
      setRejectError("Please enter your name");
      return;
    }
    
    setRejectLoading(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${backendUrl}/api/queries/${selectedQueryForReject._id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Rejected",
            resolution_note: rejectMessage,
            resolver_name: resolverName,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update query");
      }
      
      setRejectSuccess("Query rejected successfully!");
      setTimeout(() => {
        setRejectModalOpen(false);
        setRejectMessage("");
        setResolverName("");
        fetchQueries();
      }, 2000);
    } catch (error) {
      setRejectError(error.message || "Failed to reject query");
    } finally {
      setRejectLoading(false);
    }
  };

  // New Functions for Resolve Modal
  const openResolveModal = (query) => {
    setSelectedQueryForResolve(query);
    setResolveModalOpen(true);
    setMessage("");
    setImage(null);
    setError("");
    setSuccess("");
    setIsListening(false); // Reset listening state
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  // Voice-to-Text Functionality
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Set language to English (adjust as needed)

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Voice recognition started...");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setMessage((prev) => prev + finalTranscript);
      // Optionally display interim results in real-time:
      // setMessage((prev) => prev + finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Voice recognition ended.");
    };

    recognition.start();

    // Store recognition instance to stop it later
    window.recognition = recognition;
  };

    // Voice-to-Text Functionality
    const startRejectListening = () => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }
  
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US"; // Set language to English (adjust as needed)
  
      recognition.onstart = () => {
        setIsRejectListening(true);
        console.log("Voice recognition started...");
      };
  
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
  
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
  
        setRejectMessage((prev) => prev + finalTranscript);
        // Optionally display interim results in real-time:
        // setMessage((prev) => prev + finalTranscript + interimTranscript);
      };
  
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRejectListening(false);
      };
  
      recognition.onend = () => {
        setIsRejectListening(false);
        console.log("Voice recognition ended.");
      };
  
      recognition.start();
  
      // Store recognition instance to stop it later
      window.recognition = recognition;
    };

  const stopListening = () => {
    if (window.recognition) {
      window.recognition.stop();
      setIsListening(false);
    }
  };

  const stopRejectListening = () => {
    if (window.recognition) {
      window.recognition.stop();
      setIsRejectListening(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate that name is provided
    if (!resolverName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("authToken");
      
      // If no image is being uploaded, use simple JSON
      if (!image) {
        const response = await fetch(
          `${backendUrl}/api/queries/${selectedQueryForResolve._id}/status`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              status: "Resolved",
              resolution_note: message,
              resolver_name: resolverName
            })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update query");
        }
      } else {
        // For image uploads, use FormData
        const formData = new FormData();
        formData.append("status", "Resolved");
        formData.append("resolution_note", message);
        formData.append("resolver_name", resolverName);
        formData.append("image", image);
        
        const response = await fetch(
          `${backendUrl}/api/queries/${selectedQueryForResolve._id}/status`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${token}`
              // Don't set Content-Type with FormData
            },
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update query");
        }
      }
      
      setSuccess("Query resolved successfully!");
      setTimeout(() => {
        setResolveModalOpen(false);
        setMessage("");
        setImage(null);
        setResolverName("");
        fetchQueries();
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to resolve query");
    } finally {
      setIsLoading(false);
    }
  };

  const applyAction = () => {
    if (!detailsSelectedStatus) {
      alert("Please select a status.");
      return;
    }
  
    if (detailsSelectedStatus === "Resolved") {
      openResolveModal(detailsData);
    } else if (detailsSelectedStatus === "Rejected") {
      openRejectModal(detailsData);
    } else if (
      detailsSelectedStatus &&
      detailsSelectedStatus !== detailsData.status
    ) {
      updateQueryStatus(detailsData._id, detailsSelectedStatus);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Query Management" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <QueryStatusChart stats={filteredStats.byStatus} />
          <QueryTypeDistribution 
            stats={filteredStats.byType} 
            division_admin={true}
            loading={loading} 
          />
          <QueryTrends
            className="lg:col-span-2"
            timelineActive={timelineActive}
            startDate={startDate}
            endDate={endDate}
          />
          <motion.div
            className="flex flex-col gap-3 mb-8" // Changed gap-4 to gap-3 to save space
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
                icon={X} // Need to import X from lucide-react at the top
                value={filteredStats.byStatus?.rejected || 0}
                color="#EF4444"
              />
            </div>
          </motion.div>
        </div> */}

        <motion.div
          className="bg-bgSecondary bg-opacity-50 backdrop-blur-md shadow-lg shadow-bgPrimary rounded-xl p-6 border border-borderPrimary mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-row md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search queries..."
                  className="bg-primary text-tBase placeholder-tDisabled rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary w-full"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Search
                  className="absolute left-3 top-2.5 text-tSecondary"
                  size={18}
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <select
                  value={selectedType}
                  onChange={handleTypeFilter}
                  className="bg-primary text-tBase rounded-lg border-2 border-borderPrimary px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option className="bg-primary hover:bg-hovPrimary" value="">
                    All Types
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Traffic Violation"
                  >
                    Traffic Violation
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Traffic Congestion"
                  >
                    Traffic Congestion
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Irregularity"
                  >
                    Irregularity
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Road Damage"
                  >
                    Road Damage
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Illegal Parking"
                  >
                    Illegal Parking
                  </option>
                  <option 
                    className="bg-primary hover:bg-hovPrimary"
                    value="Traffic Signal Issue"
                  >
                    Traffic Signal Issue
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Suggestion"
                  >
                    Suggestion
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="General Report"
                  >
                    General Report
                  </option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={handleStatusFilter}
                  className="bg-primary text-tBase rounded-lg border-2 border-borderPrimary px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option className="bg-primary hover:bg-hovPrimary" value="">
                    All Statuses
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Pending"
                  >
                    Pending
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="In Progress"
                  >
                    In Progress
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Resolved"
                  >
                    Resolved
                  </option>
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Rejected"
                  >
                    Rejected
                  </option>
                </select>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="bg-primary text-tBase rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                    checked={isAggregate}
                    onChange={handleAggregateChange}
                  />
                  <span className="text-tBase ml-2">Show Aggregate</span>
                </div>

                <button
                  onClick={downloadAsExcel}
                  disabled={exportLoading}
                  className="bg-green-600 hover:bg-green-700 text-tBase px-3 py-2 rounded-lg flex items-center"
                >
                  {exportLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={18} className="mr-2" />
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex text-tBase items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
              <label className="text-tBase">Select Division:</label>
              <select
                id="division-select"
                name="divisions"
                value={selectedDivision}
                onChange={handleDivisionFilter}
                className="bg-primary text-tBase rounded-lg border-2 border-borderPrimary px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option className="bg-primary hover:bg-hovPrimary" value="">
                  All Divisions
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="MAHALUNGE"
                >
                  Mahalunge
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="CHAKAN"
                >
                  Chakan
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="DIGHI ALANDI"
                >
                  Dighi-Alandi
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="BHOSARI"
                >
                  Bhosari
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="TALWADE"
                >
                  Talwade
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="PIMPRI"
                >
                  Pimpri
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="CHINCHWAD"
                >
                  Chinchwad
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="NIGDI"
                >
                  Nigdi
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="SANGAVI"
                >
                  Sangavi
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="HINJEWADI"
                >
                  Hinjewadi
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="WAKAD"
                >
                  Wakad
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="BAVDHAN"
                >
                  Bavdhan
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="DEHUROAD"
                >
                  Dehuroad
                </option>
                <option
                  className="bg-primary hover:bg-hovPrimary"
                  value="TALEGAON"
                >
                  Talegaon
                </option>
              </select>
              <div className="flex items-center">
                <Calendar size={18} className="text-tBase mr-2" />
                <span className="text-tBase mr-2">From:</span>
                <input
                  type="date"
                  className="bg-primary text-tBase rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                  onChange={(e) => setStartDate(e.target.value)}
                  value={startDate}
                />
              </div>
              <div className="flex items-center">
                <span className="text-tBase mr-2">To:</span>
                <input
                  type="date"
                  className="bg-primary text-tBase rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                  onChange={(e) => setEndDate(e.target.value)}
                  value={endDate}
                />
              </div>
              <button
                className="bg-secondary hover:bg-hovSecondary text-tBase px-3 py-2 rounded-lg"
                onClick={applyTimelineFilter}
              >
                Apply
              </button>
              {timelineActive && (
                <button
                  className="bg-gray-600 hover:bg-bgSecondary text-tBase px-3 py-2 rounded-lg"
                  onClick={clearTimelineFilter}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-bgSecondary bg-opacity-50 backdrop-blur-md shadow-lg shadow-bgPrimary rounded-xl p-6 border border-borderPrimary mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-tBase mb-4">Queries</h2>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Top Pagination Controls */}
              <div className="px-4 py-3 border-b border-borderPrimary mb-4">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages}
                  onPageChange={page => setCurrentPage(page)}
                />
              </div>
              <table className="min-w-full divide-y divide-gray-700 table-fixed">
                <thead>
                  <tr>
                    {/* Sr.No. Header - kept narrow */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                      Sr.No.
                    </th>
                    {/* Type */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24"> {/* Kept as w-24 */}
                      Type
                    </th>
                    {/* Description - Aggressively Reduced width */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12"> {/* CHANGED: w-16 to w-12 or even w-10 */}
                      Description
                    </th>
                    {/* User - Adjusted width */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20"> {/* CHANGED: w-16 back to w-20 to give it a bit more space if description is very narrow */}
                      User
                    </th>
                    {/* Status */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24"> {/* Kept as w-24 */}
                      Status
                    </th>
                    {/* Date */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-28"> {/* Kept as w-28 */}
                      Date
                    </th>
                    {/* Actions */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20"> {/* Kept as w-20 */}
                      Actions
                    </th>
                    {/* Division */}
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16"> {/* Kept as w-16 */}
                      Division
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {queries.map((query, index) => (
                    <motion.tr
                      key={query._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-hovPrimary/50"
                    >                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-300">
                        {/* Serial number using 15 items per page */}
                        {index + 1 + (currentPage - 1) * 15}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className="px-1 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-800 text-blue-100">
                          {query.query_type}
                        </span>
                      </td>
                      {/* Description cell - uses line-clamp for overflow, now in a very narrow column */}
                      <td className="px-2 py-3">
                        <div className="text-sm text-gray-300 line-clamp-2 max-h-10 overflow-hidden" title={query.description}>
                          {query.description}
                        </div>
                      </td>
                      {/* User cell - uses truncate and max-w for overflow */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-tBase font-semibold text-sm">
                              {query.user_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          </div>
                          <div className="ml-2 truncate max-w-[70px]"> {/* CHANGED: max-w-[50px] back to max-w-[70px] or adjust as needed for user name */}
                            <div className="text-sm font-medium text-tBase" title={query.user_name}>
                              {query.user_name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(
                            query.status
                          )}`}
                        >
                          {query.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(query.timestamp)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-400 hover:text-blue-300 text-sm"
                            onClick={() => fetchQueryDetails(query._id)}
                            title="View Details"
                          >
                            Details
                          </button>
                          {query.location?.latitude && query.location?.longitude && (
                            <button
                              className="text-green-400 hover:text-green-300"
                              onClick={() =>
                                openInGoogleMaps(
                                  query.location.latitude,
                                  query.location.longitude
                                )
                              }
                              title="View on Map"
                            >
                              <MapPin size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className="px-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-200" title={query.divisionName}>
                          {query.divisionName || 'N/A'} {/* Display full name if possible, let cell width truncate */}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

                <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages}
                onPageChange={page => setCurrentPage(page)}
              />
            </>
          )}
        </motion.div>

        {viewDetailsId && detailsData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-bgSecondary rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-tBase">
                  {detailsData.query_type} Report
                </h2>
                <button
                  className="text-gray-400 hover:text-tBase"
                  onClick={closeDetails}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-4">
              {detailsData.photo_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Photo Evidence:
                  </h3>
                  <a 
                    href={detailsData.photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Click to view full size"
                    className="block"
                  >
                    <img
                      src={detailsData.photo_url}
                      alt="Report evidence"
                      className="rounded-lg object-contain max-w-full mx-auto border border-borderPrimary cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: "400px" }}
                    />
                    <p className="text-xs text-center text-blue-400 mt-1">
                      Click to view full size image
                    </p>
                  </a>
                </div>
              )}

                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Description:
                  </h3>
                  <p className="text-gray-200">{detailsData.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Reported By:
                    </h3>
                    <p className="text-gray-200">{detailsData.user_name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Reporter Contact:
                    </h3>
                    <p className="text-gray-200">
                      {detailsData.user_id.replace("whatsapp:", "")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Reported On:
                    </h3>
                    <p className="text-gray-200">
                      {formatDate(detailsData.timestamp)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Current Status:
                    </h3>
                    <div>
                      <CustomDropdown
                        value={detailsSelectedStatus}
                        onChange={(value) => setDetailsSelectedStatus(value)}
                        options={statusOptions}
                      />
                    </div>
                  </div>
                </div>

                {/* <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Location Address:
                  </h3>
                  <p className="text-gray-200">
                    {detailsData.location.address}
                  </p>
                  <button
                    className="mt-2 flex items-center text-blue-400 hover:text-blue-300"
                    onClick={() =>
                      openInGoogleMaps(
                        detailsData.location.latitude,
                        detailsData.location.longitude
                      )
                    }
                  >
                    <MapPin size={16} className="mr-1" /> View on Google Maps
                  </button>
                </div> */}


                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Location Address:
                  </h3>
                  <p className="text-gray-200">
                    {detailsData.location?.address || "No address available"}
                  </p>
                  {detailsData.location?.latitude && detailsData.location?.longitude ? (
                    <button
                      className="mt-2 flex items-center text-blue-400 hover:text-blue-300"
                      onClick={() =>
                        openInGoogleMaps(
                          detailsData.location.latitude,
                          detailsData.location.longitude
                        )
                      }
                    >
                      <MapPin size={16} className="mr-1" /> View on Google Maps
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">No location coordinates available</p>
                  )}
                </div>

                {detailsData.resolution_note && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Resolution Notes:
                    </h3>
                    <p className="text-gray-200">
                      {detailsData.resolution_note}
                    </p>
                    {detailsData.resolved_at && (
                      <p className="text-sm text-gray-400 mt-1">
                        Resolved on: {formatDate(detailsData.resolved_at)}
                      </p>
                    )}
                  </div>
                )}

                {detailsData && detailsData.resolved_by && detailsData.resolved_by.name && (
                  <div className="mt-3">
                    <h5>Resolution Information</h5>
                    <p><strong>Resolved by:</strong> {detailsData.resolved_by.name}</p>
                    <p><strong>Resolved on:</strong> {formatDate(detailsData.resolved_at)}</p>
                    {detailsData.resolved_by.ip_address && (
                      <p><small className="text-muted">Device IP: {detailsData.resolved_by.ip_address}</small></p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-tBase px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={applyAction}
                    disabled={
                      !detailsSelectedStatus ||
                      detailsSelectedStatus === detailsData.status
                    }
                  >
                    Apply Change
                  </button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-tBase px-4 py-2 rounded flex items-center"
                    onClick={() => sendEmail(detailsData)}
                  >
                    <Mail size={16} className="mr-2" /> Forward to Department
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {emailModalOpen && selectedQueryForEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-bgSecondary rounded-xl p-6 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-tBase">
                  Forward to Department
                </h2>
                <button
                  className="text-gray-400 hover:text-tBase"
                  onClick={() => setEmailModalOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Query Type:
                  </h3>
                  <p className="text-gray-200">
                    {selectedQueryForEmail.query_type}
                  </p>
                </div>

                {/* Department Dropdown */}
                <select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="bg-primary text-tBase my-4 w-full rounded-lg border-2 border-borderPrimary px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option
                    disabled
                    className="bg-primary hover:bg-hovPrimary"
                    value=""
                  >
                    Select Department
                  </option>
                  {departments.map((department) => (
                    <option
                      className="bg-primary hover:bg-hovPrimary"
                      key={department.name}
                      value={department.name}
                    >
                      {department.name}
                    </option>
                  ))}
                  <option
                    className="bg-primary hover:bg-hovPrimary"
                    value="Other"
                  >
                    Other
                  </option>
                </select>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Department Name:
                  </label>
                  <input
                    type="text"
                    className="bg-primary text-tBase placeholder-gray-400 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Traffic Police Department"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Department Email:
                  </label>
                  <input
                    type="email"
                    className="bg-primary text-tBase placeholder-gray-400 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="department1@email.com;department2@email.com"
                    value={departmentEmail}
                    onChange={(e) => setDepartmentEmail(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-600 text-tBase rounded-lg hover:bg-bgSecondary"
                    onClick={() => setEmailModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-tBase rounded-lg hover:bg-blue-700 flex items-center"
                    onClick={handleSendEmail}
                    disabled={emailSending}
                  >
                    {emailSending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} className="mr-2" /> Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Resolve Modal */}
        {resolveModalOpen && selectedQueryForResolve && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-bgSecondary rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-tBase">
                  Resolve Query
                </h2>
                <button
                  className="text-gray-400 hover:text-tBase"
                  onClick={() => {
                    stopListening(); // Stop listening when closing the modal
                    setResolveModalOpen(false);
                  }}
                >
                  Close
                </button>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-tBase">
                  Submit Resolution
                </h3>
                <p className="text-sm text-gray-400">
                  Provide details to mark this query as resolved
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleResolveSubmit}>
                {error && (
                  <div className="bg-red-500 bg-opacity-20 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-200">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500 bg-opacity-20 border-l-4 border-green-500 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-200">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="rounded-md -space-y-px">
                <div className="mb-5">
                  <label
                    htmlFor="resolverName"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Your Name (required)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="resolverName"
                      name="resolverName"
                      value={resolverName}
                      onChange={(e) => setResolverName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm"
                      placeholder="Enter your name"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                </div>

                <div className="rounded-md -space-y-px">
                  <div className="mb-5">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-400 mb-1"
                    >
                      Resolution Notes
                    </label>
                    <div className="relative">
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm"
                        placeholder="Enter resolution details"
                        disabled={isLoading}
                        rows="4"
                      />
                      {/* <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                        className={`absolute right-2 top-2 p-2 rounded-full ${
                          isListening
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-tBase focus:outline-none focus:ring-2 focus:ring-secondary`}
                      >
                        <Mic size={20} />
                      </button> */}
                    </div>
                    {isListening && (
                      <p className="text-sm text-blue-400 mt-1">Listening...</p>
                    )}
                  </div>
                  {/* <div className="mb-5">
                    <label
                      htmlFor="image"
                      className="block text-sm font-medium text-gray-400 mb-1"
                    >
                      Resolution Image (Optional)
                    </label>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-tBase hover:file:bg-blue-700"
                      disabled={isLoading}
                    />
                  </div> */}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-tBase ${
                      isLoading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                    } transition-colors duration-150`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-tBase"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Resolution"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Traffic Buddy Administration Portal ©{" "}
                  {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          </div>
        )}


        {/* IMPROVED REJECTION BUTTON */}
        {/* Rejection Modal */}
        {rejectModalOpen && selectedQueryForReject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-bgSecondary rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-tBase">
                  Reject Query
                </h2>
                <button
                  className="text-gray-400 hover:text-tBase"
                  onClick={() => {
                    stopRejectListening(); // Stop listening when closing the modal
                    setRejectModalOpen(false);
                  }}
                >
                  Close
                </button>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-tBase">
                  Reject Query
                </h3>
                <p className="text-sm text-gray-400">
                  Provide details to reject this query
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleRejectSubmit}>
                {rejectError && (
                  <div className="bg-red-500 bg-opacity-20 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-200">{rejectError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {rejectSuccess && (
                  <div className="bg-green-500 bg-opacity-20 border-l-4 border-green-500 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-200">{rejectSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="rounded-md -space-y-px">
                <div className="mb-5">
                  <label
                    htmlFor="resolverName"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Your Name (required)

                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="resolverName"
                      name="resolverName"
                      value={resolverName}
                      onChange={(e) => setResolverName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm"
                      placeholder="Enter your name"
                      disabled={rejectLoading}
                      required
                    />
                  </div>
                </div>
                </div>

                <div className="rounded-md -space-y-px">
                  <div className="mb-5">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-400 mb-1"
                    >
                      Rejection Notes
                    </label>
                    <div className="relative">
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm"
                        placeholder="Enter rejection details or use voice input"
                        disabled={rejectLoading}
                        rows="4"
                      />
                      {/* <button
                        type="button"
                        onClick={isRejectListening ? stopRejectListening : startRejectListening}
                        disabled={rejectLoading}
                        className={`absolute right-2 top-2 p-2 rounded-full ${
                          isRejectListening
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-tBase focus:outline-none focus:ring-2 focus:ring-secondary`}
                      >
                        <Mic size={20} />
                      </button> */}
                    </div>
                    {isRejectListening && (
                      <p className="text-sm text-blue-400 mt-1">Listening...</p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={rejectLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-tBase ${
                      rejectLoading
                        ? "bg-red-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    } transition-colors duration-150`}
                  >
                    {rejectLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-tBase"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Rejecting...
                      </>
                    ) : (
                      "Reject Query"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Traffic Buddy Administration Portal ©{" "}
                  {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
        {/* IMPROVED REJECTION BUTTON */}


        {/* Rejection Modal */}
          {/*rejectModalOpen && selectedQueryForReject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-bgSecondary rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-tBase">
                    Reject Query
                  </h2>
                  <button
                    className="text-gray-400 hover:text-tBase"
                    onClick={() => {
                      setRejectModalOpen(false);
                    }}
                  >
                    Close
                  </button>
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-tBase">
                    Submit Rejection Reason
                  </h3>
                  <p className="text-sm text-gray-400">
                    Please provide a reason for rejecting this query
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleRejectSubmit}>
                  {rejectError && (
                    <div className="bg-red-500 bg-opacity-20 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-200">{rejectError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {rejectSuccess && (
                    <div className="bg-green-500 bg-opacity-20 border-l-4 border-green-500 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-200">{rejectSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="resolverName" className="form-label">
                      Your Name (required)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="resolverName"
                      value={resolverName}
                      onChange={(e) => setResolverName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rounded-md -space-y-px">
                    <div className="mb-5">
                      <label
                        htmlFor="reject-message"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Rejection Reason
                      </label>
                      <div className="relative">
                        <textarea
                          id="reject-message"
                          name="reject-message"
                          required
                          value={rejectMessage}
                          onChange={(e) => setRejectMessage(e.target.value)}
                          className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-bgSecondary text-tBase placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary sm:text-sm"
                          placeholder="Enter reason for rejection..."
                          disabled={rejectLoading}
                          rows="4"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={rejectLoading}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-tBase ${
                        rejectLoading
                          ? "bg-red-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      } transition-colors duration-150`}
                    >
                      {rejectLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-tBase"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Rejecting...
                        </>
                      ) : (
                        "Submit Rejection"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )*/}
      </main>
    </div>
  );
};

export default AdminQueryManagementPage;
