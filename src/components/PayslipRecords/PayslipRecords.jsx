import React, { useState, useEffect } from "react";
import { Search, FileText, Eye, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import * as Dialog from "@radix-ui/react-dialog";
import "../../styles/PayslipRecords.css";

const PayslipRecords = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [empId, setEmpId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [payslipToDelete, setPayslipToDelete] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      setEmpId(user.emp_id);
      if (user.emp_id) {
        fetchPayslips(user.emp_id);
      }
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchPayslips = async (employeeId) => {
    if (!employeeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payslip_reports")
        .select(`
          *,
          employee:emp_id (
            emp_id,
            emp_fname,
            emp_middle,
            emp_lname
          ),
          payslip_status:payslip_status_id (
            pay_status_id,
            pay_name
          )
        `)
        .eq("emp_id", employeeId)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map the status data correctly
      const payslipsWithStatus = (data || []).map(payslip => {
        // If the join worked and we have pay_name, use it
        if (payslip.payslip_status && payslip.payslip_status.pay_name) {
          return {
            ...payslip,
            payslip_status: {
              ...payslip.payslip_status,
              status_name: payslip.payslip_status.pay_name
            }
          };
        }
        // If status is missing or join failed, default to PENDING (ID 1)
        // This handles cases where foreign key isn't set up or status_id is null/1
        const statusId = payslip.payslip_status_id || 1;
        return {
          ...payslip,
          payslip_status: statusId === 1 
            ? { pay_status_id: 1, status_name: "PENDING" }
            : (payslip.payslip_status || { pay_status_id: 1, status_name: "PENDING" })
        };
      });
      
      setPayslips(payslipsWithStatus);
    } catch (error) {
      showToast("Failed to fetch payslip records", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusBadgeClass = (statusName) => {
    if (!statusName) return "payslip-status-unknown";
    const status = statusName.toLowerCase();
    if (status.includes("paid") || status.includes("completed")) {
      return "payslip-status-paid";
    } else if (status.includes("pending")) {
      return "payslip-status-pending";
    } else if (status.includes("draft")) {
      return "payslip-status-draft";
    }
    return "payslip-status-unknown";
  };

  const getEmployeeName = (payslip) => {
    if (payslip.employee) {
      const { emp_fname, emp_middle, emp_lname } = payslip.employee;
      return `${emp_fname || ""} ${emp_middle || ""} ${emp_lname || ""}`.trim();
    }
    return `Employee ID: ${payslip.emp_id}`;
  };

  const handleDeleteClick = (e, payslip) => {
    e.stopPropagation(); // Prevent row click from triggering
    setPayslipToDelete(payslip);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!payslipToDelete) return;

    try {
      const { error } = await supabase
        .from("payslip_reports")
        .delete()
        .eq("report_id", payslipToDelete.report_id);

      if (error) throw error;

      showToast("Payslip deleted successfully", "success");
      // Refresh the payslip list
      if (empId) {
        fetchPayslips(empId);
      }
      setDeleteConfirmOpen(false);
      setPayslipToDelete(null);
    } catch (error) {
      console.error("Error deleting payslip:", error);
      showToast("Failed to delete payslip", "error");
    }
  };

  const filteredPayslips = payslips.filter((payslip) => {
    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const monthYear = `${payslip.month} ${payslip.year}`.toLowerCase();
      const employeeName = getEmployeeName(payslip).toLowerCase();
      const employeeId = payslip.emp_id?.toString() || "";
      if (!monthYear.includes(searchLower) && !employeeName.includes(searchLower) && !employeeId.includes(searchLower)) {
        return false;
      }
    }

    // Filter by month
    if (monthFilter && payslip.month !== monthFilter) {
      return false;
    }

    // Filter by year
    if (yearFilter && payslip.year?.toString() !== yearFilter) {
      return false;
    }

    // Filter by status
    if (statusFilter !== "All") {
      const status = payslip.payslip_status?.status_name || "UNKNOWN";
      if (status.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  if (!empId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#f59e0b", fontSize: "18px" }}>
          Please bind your Employee ID in the Dashboard to view your payslip records.
        </p>
      </div>
    );
  }

  return (
    <div className="payslip-records-container">
      <div className="payslip-records-header">
        <h1 className="payslip-records-title">Payslip Records</h1>
        <p className="payslip-records-subtitle">View your payslip history</p>
      </div>

      <div className="payslip-records-filters">
        <div className="payslip-records-search">
          <Search className="payslip-records-search-icon" />
          <input
            type="text"
            placeholder="Search by month, year, or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="payslip-records-search-input"
          />
        </div>
        <div className="payslip-records-filter-row">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="payslip-records-filter-select"
          >
            <option value="">All Months</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="payslip-records-filter-select"
          >
            <option value="">All Years</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="payslip-records-filter-select"
          >
            <option value="All">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="RELEASED">RELEASED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="payslip-records-loading">
          <p>Loading payslip records...</p>
        </div>
      ) : filteredPayslips.length === 0 ? (
        <div className="payslip-records-empty">
          <FileText className="payslip-records-empty-icon" />
          <p>No payslip records found</p>
        </div>
      ) : (
        <div className="payslip-records-table-wrapper">
          <table className="payslip-records-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Period</th>
                <th className="numeric-column">Gross Salary</th>
                <th className="numeric-column">Deductions</th>
                <th className="numeric-column">Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayslips.map((payslip) => (
                <tr key={payslip.report_id} onClick={() => setSelectedPayslip(payslip)} style={{ cursor: 'pointer' }}>
                  <td className="payslip-employee-name">{getEmployeeName(payslip)}</td>
                  <td>{payslip.emp_id}</td>
                  <td>{payslip.month} {payslip.year}</td>
                  <td className="numeric-column">{formatCurrency(payslip.gross_salary)}</td>
                  <td className="numeric-column">{formatCurrency(payslip.t_deductions)}</td>
                  <td className="numeric-column payslip-net-pay">{formatCurrency(payslip.net_pay)}</td>
                  <td>
                    <span className={getStatusBadgeClass(payslip.payslip_status?.status_name)}>
                      {payslip.payslip_status?.status_name || "UNKNOWN"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="payslip-delete-button"
                      onClick={(e) => handleDeleteClick(e, payslip)}
                      title="Delete payslip"
                    >
                      <Trash2 className="payslip-delete-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip Details Dialog */}
      <Dialog.Root open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="payslip-dialog-overlay" />
          <Dialog.Content className="payslip-dialog-content">
            {selectedPayslip && (
              <>
                <Dialog.Title className="payslip-dialog-title">
                  Payslip Details - {selectedPayslip.month} {selectedPayslip.year}
                </Dialog.Title>
                <div className="payslip-dialog-body">
                  <div className="payslip-dialog-section">
                    <h3>Period</h3>
                    <p>{selectedPayslip.month} {selectedPayslip.year}</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Hours Worked</h3>
                    <p>{selectedPayslip.total_hours?.toFixed(2) || 0} hours</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Overtime Hours</h3>
                    <p>{selectedPayslip.total_overtime?.toFixed(2) || 0} hours</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Gross Salary</h3>
                    <p>{formatCurrency(selectedPayslip.gross_salary)}</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Overtime Pay</h3>
                    <p>{formatCurrency(selectedPayslip.overtime_pay)}</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Deductions</h3>
                    <div className="payslip-dialog-deductions">
                      <p>SSS: {formatCurrency(selectedPayslip.sss)}</p>
                      <p>PhilHealth: {formatCurrency(selectedPayslip.phil_health)}</p>
                      <p>Pag-IBIG: {formatCurrency(selectedPayslip.pag_ibig)}</p>
                      <p className="payslip-dialog-total">Total Deductions: {formatCurrency(selectedPayslip.t_deductions)}</p>
                    </div>
                  </div>
                  <div className="payslip-dialog-section payslip-dialog-net">
                    <h3>Net Pay</h3>
                    <p className="payslip-dialog-net-amount">{formatCurrency(selectedPayslip.net_pay)}</p>
                  </div>
                  <div className="payslip-dialog-section">
                    <h3>Status</h3>
                    <span className={getStatusBadgeClass(selectedPayslip.payslip_status?.status_name)}>
                      {selectedPayslip.payslip_status?.status_name || "Unknown"}
                    </span>
                  </div>
                </div>
                <Dialog.Close className="payslip-dialog-close">Close</Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="payslip-delete-dialog-overlay" />
          <Dialog.Content className="payslip-delete-dialog-content">
            <Dialog.Title className="payslip-delete-dialog-title">
              Delete Payslip
            </Dialog.Title>
            <div className="payslip-delete-dialog-body">
              <p>
                Are you sure you want to delete the payslip for{" "}
                <strong>
                  {payslipToDelete?.month} {payslipToDelete?.year}
                </strong>
                ?
              </p>
              <p className="payslip-delete-dialog-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="payslip-delete-dialog-actions">
              <button
                className="payslip-delete-dialog-cancel"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPayslipToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="payslip-delete-dialog-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
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

export default PayslipRecords;

