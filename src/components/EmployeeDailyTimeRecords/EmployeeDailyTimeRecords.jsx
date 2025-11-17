import React, { useState, useEffect } from "react";
import { Search, FileText, Calendar } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import "../../styles/DailyTimeRecords.css";

const EmployeeDailyTimeRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [empId, setEmpId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      setEmpId(user.emp_id);
      if (user.emp_id) {
        fetchRecords(user.emp_id);
      }
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchRecords = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_time_record")
        .select("*")
        .eq("employee_id", employeeId)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      showToast("Failed to fetch records", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredRecords = records.filter((record) => {
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const entryDate = formatDate(record.entry_date).toLowerCase();
      if (!entryDate.includes(query)) return false;
    }

    // Filter by date range
    if (startDate || endDate) {
      if (!record.entry_date) return false;
      
      const recordDate = new Date(record.entry_date);
      recordDate.setHours(0, 0, 0, 0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
    }

    return true;
  });

  if (!empId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#f59e0b", fontSize: "18px" }}>
          Please bind your Employee ID in the Dashboard to view your daily time records.
        </p>
      </div>
    );
  }

  return (
    <div className="daily-time-records-container">
      <div className="daily-time-records-header">
        <h1 className="daily-time-records-title">Daily Time Records</h1>
        <p className="daily-time-records-subtitle">View your attendance history</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search className="daily-time-records-search-icon" />
        <input
          type="text"
          placeholder="Search by date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="daily-time-records-search-input"
        />
      </div>
      <div className="daily-time-records-date-filters">
        <div className="daily-time-records-date-input">
          <Calendar className="daily-time-records-date-icon" />
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="daily-time-records-date-field"
          />
        </div>
        <div className="daily-time-records-date-input">
          <Calendar className="daily-time-records-date-icon" />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="daily-time-records-date-field"
          />
        </div>
      </div>

      {loading ? (
        <div className="daily-time-records-loading">
          <p>Loading records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="daily-time-records-empty">
          <FileText className="daily-time-records-empty-icon" />
          <p>No records found</p>
        </div>
      ) : (
        <div className="daily-time-records-table-wrapper">
          <table className="daily-time-records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours Worked</th>
                <th>Overtime Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.dtr_id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 500 }}>{formatDate(record.entry_date)}</td>
                  <td>{record.time_in || "N/A"}</td>
                  <td>{record.time_out || "N/A"}</td>
                  <td>{record.hrs_worked || "00:00:00"}</td>
                  <td>{record.overtime_hrs || "00:00:00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast
        isOpen={toast.show}
        message={toast.message}
        variant={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "" })}
      />
    </div>
  );
};

export default EmployeeDailyTimeRecords;

