import React, { useState, useEffect } from "react";
import { Calendar, Send, AlertCircle, Eye, FileText } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import * as Dialog from "@radix-ui/react-dialog";
import { Cn } from "../../utils/cn.js";
import "../../styles/RequestLeave.css";

const RequestLeave = () => {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [empId, setEmpId] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [errors, setErrors] = useState({});

  const leaveTypes = [
    "Vacation Leave",
    "Sick Leave",
    "Personal Leave",
    "Emergency Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Bereavement Leave",
  ];

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      setEmpId(user.emp_id);
      if (user.emp_id) {
        fetchMyRequests(user.emp_id);
      }
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchMyRequests = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leavereq_table")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      // Error fetching leave requests
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Leave type validation
    if (!leaveType) {
      newErrors.leaveType = "Leave type is required";
    }
    
    // Start date validation
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const start = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      if (leaveType === "Sick Leave" && start < today) {
        newErrors.startDate = "Sick leave cannot be requested for past dates";
      }
    }
    
    // End date validation
    if (!endDate) {
      newErrors.endDate = "End date is required";
    } else if (startDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      if (end < start) {
        newErrors.endDate = "End date must be after or equal to start date";
      }
      
      // Check if leave duration is too long (e.g., more than 30 days)
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 30) {
        newErrors.endDate = "Leave duration cannot exceed 30 days";
      }
    }
    
    // Reason validation
    if (!reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    } else if (reason.trim().length > 500) {
      newErrors.reason = "Reason is too long (max 500 characters)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!empId) {
      showToast("Please bind your Employee ID first", "error");
      return;
    }

    if (!validateForm()) {
      showToast("Please fix the form errors", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Format the description to include dates and reason
      const leaveDescription = `Start Date: ${formatDateForStorage(startDate)}, End Date: ${formatDateForStorage(endDate)}. Reason: ${reason.trim()}`;
      
      // Ensure employee_id is a number
      const employeeIdNum = typeof empId === 'string' ? parseInt(empId) : empId;
      
      if (!employeeIdNum || isNaN(employeeIdNum)) {
        throw new Error("Invalid employee ID");
      }

      const { data, error } = await supabase
        .from("leavereq_table")
        .insert({
          employee_id: employeeIdNum,
          leave_type: leaveType.trim(),
          leave_des: leaveDescription.trim(),
          leave_status: "Pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      showToast("Leave request submitted successfully!", "success");
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setErrors({});
      fetchMyRequests(empId);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      const errorMessage = error.message || "Failed to submit leave request. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForStorage = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return "leave-status-unknown";
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") return "leave-status-approved";
    if (statusLower === "declined") return "leave-status-declined";
    if (statusLower === "pending") return "leave-status-pending";
    return "leave-status-unknown";
  };

  if (!empId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#f59e0b", fontSize: "18px" }}>
          Please bind your Employee ID in the Dashboard to request leave.
        </p>
      </div>
    );
  }

  return (
    <div className="request-leave-container">
      <div className="request-leave-header">
        <h1 className="request-leave-title">Request Leave</h1>
        <p className="request-leave-subtitle">Submit a leave request</p>
      </div>

      <div className="request-leave-content">
        <form onSubmit={handleSubmit} className="request-leave-form">
          <div className="request-leave-form-group">
            <label htmlFor="leaveType" className="request-leave-label">
              Leave Type <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value);
                if (errors.leaveType) {
                  setErrors(prev => ({ ...prev, leaveType: "" }));
                }
              }}
              className={Cn(
                "request-leave-select",
                errors.leaveType && "border-red-500 focus:border-red-500"
              )}
              required
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              </select>
              {errors.leaveType && (
                <p className="text-red-500 text-xs mt-1">{errors.leaveType}</p>
              )}
          </div>

          <div className="request-leave-form-row">
            <div className="request-leave-form-group">
              <label htmlFor="startDate" className="request-leave-label">
                Start Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="request-leave-date-input">
                <Calendar className="request-leave-date-icon" />
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) {
                      setErrors(prev => ({ ...prev, startDate: "" }));
                    }
                  }}
                  className={Cn(
                    "request-leave-date-field",
                    errors.startDate && "border-red-500 focus:border-red-500"
                  )}
                  min={leaveType === "Sick Leave" ? new Date().toISOString().split("T")[0] : undefined}
                  required
                />
              </div>
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>

            <div className="request-leave-form-group">
              <label htmlFor="endDate" className="request-leave-label">
                End Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="request-leave-date-input">
                <Calendar className="request-leave-date-icon" />
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) {
                      setErrors(prev => ({ ...prev, endDate: "" }));
                    }
                  }}
                  className={Cn(
                    "request-leave-date-field",
                    errors.endDate && "border-red-500 focus:border-red-500"
                  )}
                  min={startDate || undefined}
                  required
                />
              </div>
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="request-leave-form-group">
            <label htmlFor="reason" className="request-leave-label">
              Reason <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors(prev => ({ ...prev, reason: "" }));
                }
              }}
              className={Cn(
                "request-leave-textarea",
                errors.reason && "border-red-500 focus:border-red-500"
              )}
              placeholder="Please provide a reason for your leave request..."
              rows={5}
              required
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="request-leave-submit-btn"
          >
            {submitting ? (
              <>
                <Send size={20} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Request
              </>
            )}
          </button>
        </form>

        <div className="request-leave-history">
          <h2 className="request-leave-history-title">My Leave Requests</h2>
          {loading ? (
            <div className="request-leave-loading">
              <p>Loading requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="request-leave-empty">
              <AlertCircle className="request-leave-empty-icon" />
              <p>No leave requests yet</p>
            </div>
          ) : (
            <div className="request-leave-table-wrapper">
              <table className="request-leave-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((request) => {
                    const parsed = parseLeaveDescription(request.leave_des);
                    return (
                      <tr 
                        key={request.leave_id} 
                        onClick={() => setSelectedRequest(request)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="request-leave-table-type">{request.leave_type}</td>
                        <td>
                          <span className={getStatusBadgeClass(request.leave_status)}>
                            {request.leave_status || "Pending"}
                          </span>
                        </td>
                        <td>{formatDate(request.created_at)}</td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                            }}
                            className="request-leave-view-btn"
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Details Dialog */}
      <Dialog.Root open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="request-leave-dialog-overlay" />
          <Dialog.Content className="request-leave-dialog-content">
            {selectedRequest && (() => {
              const parsed = parseLeaveDescription(selectedRequest.leave_des);
              return (
                <>
                  <Dialog.Title className="request-leave-dialog-title">
                    Leave Request Details
                  </Dialog.Title>
                  <div className="request-leave-dialog-body">
                    <div className="request-leave-dialog-section">
                      <h3>Leave Type</h3>
                      <p>{selectedRequest.leave_type}</p>
                    </div>
                    <div className="request-leave-dialog-section">
                      <h3>Status</h3>
                      <span className={getStatusBadgeClass(selectedRequest.leave_status)}>
                        {selectedRequest.leave_status || "Pending"}
                      </span>
                    </div>
                    <div className="request-leave-dialog-section">
                      <h3>Start Date</h3>
                      <p>{parsed.startDate || "N/A"}</p>
                    </div>
                    <div className="request-leave-dialog-section">
                      <h3>End Date</h3>
                      <p>{parsed.endDate || "N/A"}</p>
                    </div>
                    <div className="request-leave-dialog-section">
                      <h3>Reason</h3>
                      <p>{parsed.reason || selectedRequest.leave_des || "N/A"}</p>
                    </div>
                    <div className="request-leave-dialog-section">
                      <h3>Submitted</h3>
                      <p>{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    {selectedRequest.updated_at && selectedRequest.updated_at !== selectedRequest.created_at && (
                      <div className="request-leave-dialog-section">
                        <h3>Last Updated</h3>
                        <p>{formatDate(selectedRequest.updated_at)}</p>
                      </div>
                    )}
                  </div>
                  <Dialog.Close className="request-leave-dialog-close">Close</Dialog.Close>
                </>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast
        isOpen={toast.show}
        message={toast.message}
        variant={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "" })}
      />
    </div>
  );
};

export default RequestLeave;

