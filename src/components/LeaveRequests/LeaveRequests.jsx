import React, { useEffect, useMemo, useState } from "react";
import { Search, UserCheck, UserX, Filter } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import "../../styles/LeaveRequests.css";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Declined"];

const LeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const parseLeaveDescription = (description) => {
    if (!description) return { startDate: "", endDate: "", reason: "" };
    
    const startMatch = description.match(/Start Date: ([^,]+)/);
    const endMatch = description.match(/End Date: ([^.]+)/);
    const reasonMatch = description.match(/Reason: (.+)/);
    
    return {
      startDate: startMatch ? startMatch[1].trim() : "",
      endDate: endMatch ? endMatch[1].trim() : "",
      reason: reasonMatch ? reasonMatch[1].trim() : description,
    };
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leavereq_table")
        .select(
          `
            leave_id,
            employee_id,
            leave_type,
            leave_des,
            leave_status,
            created_at,
            updated_at,
            employee:employee_id (
              emp_id,
              emp_fname,
              emp_middle,
              emp_lname,
              emp_dept
            )
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse the leave_des field and map to expected format
      const parsedData = (data || []).map((request) => {
        const parsed = parseLeaveDescription(request.leave_des);
        return {
          ...request,
          request_id: request.leave_id,
          start_date: parsed.startDate,
          end_date: parsed.endDate,
          reason: parsed.reason,
          status: request.leave_status,
        };
      });
      
      setLeaveRequests(parsedData);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      showToast("Failed to fetch leave requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();

    const channel = supabase
      .channel("leave-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leavereq_table" },
        () => fetchLeaveRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      setActionLoading(requestId);
      const { error } = await supabase
        .from("leavereq_table")
        .update({ 
          leave_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("leave_id", requestId);

      if (error) throw error;
      showToast(`Request ${newStatus.toLowerCase()} successfully.`, "success");
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error updating leave request:", error);
      showToast("Failed to update leave request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" ||
        (request.status &&
          request.status.toLowerCase() === statusFilter.toLowerCase());

      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const employee = request.employee || {};
      const fullName = `${employee.emp_fname || ""} ${
        employee.emp_middle || ""
      } ${employee.emp_lname || ""}`.toLowerCase();

      return (
        fullName.includes(query) ||
        employee.emp_id?.toString().includes(query) ||
        (request.leave_type || "").toLowerCase().includes(query) ||
        (request.status || "").toLowerCase().includes(query)
      );
    });
  }, [leaveRequests, searchQuery, statusFilter]);

  const getStatusBadgeClass = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "approved") return "leave-status-badge approved";
    if (normalized === "declined") return "leave-status-badge declined";
    return "leave-status-badge pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (start, end) => {
    if (!start) return "N/A";
    if (!end || start === end) return `${formatDate(start)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const pendingCount = leaveRequests.filter(
    (req) => (req.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <div className="leave-requests">
      <div className="leave-requests-header">
        <div>
          <h1 className="leave-requests-title">Leave Requests</h1>
          <p className="leave-requests-subtitle">
            Manage employee leave submissions
          </p>
        </div>
        <div className="leave-requests-meta">
          <div className="leave-requests-meta-card">
            <span className="leave-requests-meta-label">Total Requests</span>
            <span className="leave-requests-meta-value">
              {leaveRequests.length}
            </span>
          </div>
          <div className="leave-requests-meta-card pending">
            <span className="leave-requests-meta-label">Pending</span>
            <span className="leave-requests-meta-value">{pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="leave-requests-filter-bar">
        <div className="leave-requests-search">
          <Search className="leave-requests-search-icon" />
          <input
            type="text"
            placeholder="Search by employee, ID, leave type, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="leave-requests-status-filter">
          <Filter className="leave-requests-filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="leave-requests-table-wrapper">
        {loading ? (
          <div className="leave-requests-loading">
            <p>Loading leave requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="leave-requests-empty">
            <p>No leave requests found.</p>
          </div>
        ) : (
          <table className="leave-requests-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                const employee = request.employee || {};
                const fullName = `${employee.emp_fname || ""} ${
                  employee.emp_middle || ""
                } ${employee.emp_lname || ""}`.trim();
                const status = request.status || "Pending";

                return (
                  <tr key={request.request_id}>
                    <td>
                      <div className="leave-requests-employee-cell">
                        <span className="leave-requests-employee-name">
                          {fullName || `Employee ID ${employee.emp_id}`}
                        </span>
                        <span className="leave-requests-employee-id">
                          ID: {employee.emp_id || request.employee_id}
                        </span>
                      </div>
                    </td>
                    <td>{employee.emp_dept || "N/A"}</td>
                    <td>{request.leave_type || "N/A"}</td>
                    <td>{formatDuration(request.start_date, request.end_date)}</td>
                    <td>{request.reason || "No reason provided"}</td>
                    <td>
                      <span className={getStatusBadgeClass(status)}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="leave-requests-actions">
                        <button
                          className="leave-requests-action-button approve"
                          onClick={() =>
                            handleUpdateStatus(request.request_id, "Approved")
                          }
                          disabled={
                            actionLoading === request.request_id ||
                            status.toLowerCase() === "approved"
                          }
                        >
                          <UserCheck className="leave-requests-action-icon" />
                          {actionLoading === request.request_id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          className="leave-requests-action-button decline"
                          onClick={() =>
                            handleUpdateStatus(request.request_id, "Declined")
                          }
                          disabled={
                            actionLoading === request.request_id ||
                            status.toLowerCase() === "declined"
                          }
                        >
                          <UserX className="leave-requests-action-icon" />
                          {actionLoading === request.request_id ? "Processing..." : "Decline"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast.show && (
        <Toast
          isOpen={toast.show}
          onClose={() => setToast({ show: false, message: "", type: "" })}
          message={toast.message}
          variant={toast.type}
        />
      )}
    </div>
  );
};

export default LeaveRequests;

