import React, { useState, useEffect } from "react";
import { Search, FileText, Loader2, X, CheckSquare, Square, Calendar, DollarSign, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import * as Dialog from "@radix-ui/react-dialog";
import "../../styles/PayrollProcessing.css";

const POSITION_LOOKUP = {
  1: "General Manager",
  2: "HR Manager",
  3: "Finance Manager",
  4: "Finance Clerk",
  5: "Front Office Manager",
  6: "Receptionist",
  7: "Porter",
  8: "Reservation Clerk",
  9: "Executive Housekeeper",
  10: "Housekeeping Supervisor",
  11: "Room Attendant",
  12: "Public Area Cleaner",
  13: "Chief Engineer",
  14: "Maintenance Supervisor",
  15: "Maintenance Technician",
  16: "Groundskeeper",
  17: "IT Manager",
  18: "IT Support Specialist",
  19: "Network Administrator",
  20: "System Administrator"
};

const PayrollProcessing = () => {
  const [activeTab, setActiveTab] = useState("view"); // "view" or "generate"
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  
  // Payslip generation states
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [durationLabel, setDurationLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch payslip reports from database
  const fetchReports = async () => {
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
            emp_lname,
            emp_email,
            emp_dept,
            position_table:emp_position (
              emp_position
            )
          ),
          payslip_status:payslip_status_id (
            pay_status_id,
            pay_name
          )
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map the status data correctly
      const reportsWithStatus = (data || []).map(report => {
        // If the join worked and we have pay_name, use it
        if (report.payslip_status && report.payslip_status.pay_name) {
          return {
            ...report,
            payslip_status: {
              ...report.payslip_status,
              status_name: report.payslip_status.pay_name
            }
          };
        }
        // If status is missing or join failed, default to PENDING (ID 1)
        // This handles cases where foreign key isn't set up or status_id is null/1
        const statusId = report.payslip_status_id || 1;
        return {
          ...report,
          payslip_status: statusId === 1 
            ? { pay_status_id: 1, status_name: "PENDING" }
            : (report.payslip_status || { pay_status_id: 1, status_name: "PENDING" })
        };
      });
      
      setReports(reportsWithStatus);
    } catch (error) {
      console.error("Error fetching reports:", error);
      // We intentionally skip showing a toast here so empty states don't look like failures
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription and initial fetch
  useEffect(() => {
    fetchReports();

    // Set up realtime subscription for payslip_reports table
    const channel = supabase
      .channel("payslip-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payslip_reports",
        },
        (payload) => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter reports based on search query
  const filteredReports = reports.filter((report) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const employee = report.employee;
    if (employee) {
      const fullName = `${employee.emp_fname || ""} ${employee.emp_middle || ""} ${employee.emp_lname || ""}`.toLowerCase();
      const employeeId = employee.emp_id?.toString() || "";
      const email = (employee.emp_email || "").toLowerCase();
      const department = (employee.emp_dept || "").toLowerCase();
      
      return (
        fullName.includes(query) ||
        employeeId.includes(query) ||
        email.includes(query) ||
        department.includes(query) ||
        (report.month || "").toLowerCase().includes(query) ||
        report.year?.toString().includes(query) ||
        report.report_id?.toString().includes(query)
      );
    }
    return (
      report.report_id?.toString().includes(query) ||
      (report.month || "").toLowerCase().includes(query) ||
      report.year?.toString().includes(query)
    );
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonthLabel = (report) => {
    if (!report) return "N/A";
    const rawMonth = (report.month || "").toString().trim();
    if (!rawMonth && report.year) return `${report.year}`;
    if (!rawMonth) return "N/A";
    const properMonth =
      rawMonth.length > 1
        ? rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase()
        : rawMonth.toUpperCase();
    return report.year ? `${properMonth} ${report.year}` : properMonth;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get employee name
  const getEmployeeName = (report) => {
    if (report.employee) {
      const { emp_fname, emp_middle, emp_lname } = report.employee;
      return `${emp_fname || ""} ${emp_middle || ""} ${emp_lname || ""}`.trim();
    }
    return `Employee ID: ${report.emp_id}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (statusName) => {
    if (!statusName) return "payroll-status-unknown";
    const status = statusName.toLowerCase();
    if (status.includes("paid") || status.includes("completed")) {
      return "payroll-status-paid";
    } else if (status.includes("pending")) {
      return "payroll-status-pending";
    } else if (status.includes("draft")) {
      return "payroll-status-draft";
    }
    return "payroll-status-unknown";
  };

  // Handle row click
  const handleRowClick = (report) => {
    setSelectedReport(report);
  };

  // Handle delete payslip click
  const handleDeleteClick = (e, report) => {
    e.stopPropagation(); // Prevent row click from triggering
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      const { error } = await supabase
        .from("payslip_reports")
        .delete()
        .eq("report_id", reportToDelete.report_id);

      if (error) throw error;

      showToast("Payslip deleted successfully", "success");
      // Refresh the reports list
      fetchReports();
      // Clear selection if deleted report was selected
      if (selectedReport?.report_id === reportToDelete.report_id) {
        setSelectedReport(null);
      }
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    } catch (error) {
      console.error("Error deleting payslip:", error);
      showToast("Failed to delete payslip", "error");
    }
  };

  // Fetch employees for payslip generation
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employee")
        .select(`
          emp_id,
          emp_fname,
          emp_middle,
          emp_lname,
          emp_dept,
          emp_position,
          hourly_rate,
          position_table:emp_position (
            emp_position
          )
        `)
        .order("emp_id", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      showToast("Failed to fetch employees", "error");
    }
  };

  // Update duration label
  const updateDurationLabel = (monthName, yearValue) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    
    if (monthIndex === -1) return;
    
    const year = parseInt(yearValue);
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    const formatDate = (date) => {
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" });
      return `${day}-${month}-${year}`;
    };
    
    setDurationLabel(`${formatDate(firstDay)} to ${formatDate(lastDay)}`);
  };

  // Handle month change
  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    if (year) {
      updateDurationLabel(newMonth, year);
    }
  };

  // Handle year change
  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    if (month) {
      updateDurationLabel(month, newYear);
    }
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(employees.map(emp => emp.emp_id));
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees(new Set());
    }
  };

  // Handle individual employee selection
  const handleEmployeeSelect = (empId, checked) => {
    const newSelected = new Set(selectedEmployees);
    if (checked) {
      newSelected.add(empId);
    } else {
      newSelected.delete(empId);
    }
    setSelectedEmployees(newSelected);
    setSelectAll(newSelected.size === employees.length);
  };

  // Convert time string to hours (HH:MM:SS or HH:MM to decimal)
  const timeToHours = (timeString) => {
    if (!timeString || timeString === "00:00:00" || timeString === "00:00") return 0;
    const parts = timeString.split(":");
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours + (minutes / 60);
  };

  // Generate payslips
  const handleGeneratePayslips = async () => {
    if (selectedEmployees.size === 0) {
      showToast("Please select at least one employee", "error");
      return;
    }

    if (!month || !year) {
      showToast("Please select month and year", "error");
      return;
    }

    setGenerating(true);
    setSummary("");

    const SSS_RATE = 0.05; // 5%
    const PHILHEALTH_RATE = 0.025; // 2.5%
    const PAGIBIG_FIXED = 200; // ₱200
    // Default status ID is 1 (PENDING) from payslip_status table
    const DEFAULT_STATUS_ID = 1;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
    const selectedYear = parseInt(year);

    let summaryText = "";
    let generatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let duplicateFound = false;

    try {
      for (const empId of selectedEmployees) {
        try {
          // Check if report already exists
          const { data: existingReport } = await supabase
            .from("payslip_reports")
            .select("report_id")
            .eq("emp_id", empId)
            .eq("month", month)
            .eq("year", selectedYear)
            .single();

          if (existingReport) {
            summaryText += `Skipped (already exists): Employee ID ${empId}\n`;
            skippedCount++;
            duplicateFound = true;
            continue;
          }

          // Get employee hourly rate
          const employee = employees.find(emp => emp.emp_id === empId);
          if (!employee || !employee.hourly_rate) {
            summaryText += `Error: Employee ID ${empId} - No hourly rate found\n`;
            errorCount++;
            continue;
          }

          const hourlyRate = parseFloat(employee.hourly_rate);

          // Fetch DTR records for the month
          const firstDay = new Date(selectedYear, monthIndex, 1);
          const lastDay = new Date(selectedYear, monthIndex + 1, 0);
          
          const { data: dtrRecords, error: dtrError } = await supabase
            .from("daily_time_record")
            .select("hrs_worked, overtime_hrs")
            .eq("employee_id", empId)
            .gte("entry_date", firstDay.toISOString().split("T")[0])
            .lte("entry_date", lastDay.toISOString().split("T")[0]);

          if (dtrError) throw dtrError;

          if (!dtrRecords || dtrRecords.length === 0) {
            summaryText += `No DTR records found: Employee ID ${empId}\n`;
            errorCount++;
            continue;
          }

          // Calculate totals
          let totalHours = 0;
          let totalOvertime = 0;

          dtrRecords.forEach(record => {
            totalHours += timeToHours(record.hrs_worked);
            totalOvertime += timeToHours(record.overtime_hrs);
          });

          // Calculate payroll
          const grossSalary = totalHours * hourlyRate;
          const overtimePay = totalOvertime * (hourlyRate * 1.5);
          const contributionBase = grossSalary + overtimePay;
          const sss = contributionBase * SSS_RATE;
          const philhealth = contributionBase * PHILHEALTH_RATE;
          const pagibig = PAGIBIG_FIXED;
          const totalDeductions = sss + philhealth + pagibig;
          const netPay = grossSalary + overtimePay - totalDeductions;

          // Insert payslip report
          const { error: insertError } = await supabase
            .from("payslip_reports")
            .insert({
              emp_id: empId,
              month: month,
              year: selectedYear,
              total_hours: totalHours,
              total_overtime: totalOvertime,
              gross_salary: grossSalary,
              sss: sss,
              phil_health: philhealth,
              pag_ibig: pagibig,
              t_deductions: totalDeductions,
              overtime_pay: overtimePay,
              net_pay: netPay,
              payslip_status_id: DEFAULT_STATUS_ID,
              date_generated: new Date().toISOString()
            });

          if (insertError) throw insertError;

          summaryText += `Generated: Employee ID ${empId}, Month: ${month}, Year: ${selectedYear}, Net Pay: ₱${netPay.toFixed(2)}\n`;
          generatedCount++;

        } catch (error) {
          summaryText += `Error: Employee ID ${empId} - ${error.message}\n`;
          errorCount++;
        }
      }

      setSummary(summaryText);
      
      if (generatedCount > 0) {
        showToast(`Successfully generated ${generatedCount} payslip(s)`, "success");
        fetchReports(); // Refresh reports list
      }
      
      if (skippedCount > 0) {
        showToast(`${skippedCount} payslip(s) already exist and were skipped`, "error");
      }

      if (duplicateFound && generatedCount === 0 && errorCount === 0) {
        showToast("Selected employees already have payslips for this period.", "error");
      }

    } catch (error) {
      showToast("Error occurred while generating payslips", "error");
    } finally {
      setGenerating(false);
    }
  };

  const resolvePositionName = (emp) => {
    if (!emp) return "N/A";
    if (emp.position_table?.emp_position) {
      return emp.position_table.emp_position;
    }
    const posId = emp.emp_position;
    if (posId === null || posId === undefined) return "N/A";
    const numericId = typeof posId === "string" ? parseInt(posId, 10) : posId;
    return POSITION_LOOKUP[numericId] || "N/A";
  };

  // Initialize month and year
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString("en-US", { month: "long" });
    const currentYear = currentDate.getFullYear();
    
    setMonth(currentMonth);
    setYear(currentYear.toString());
    updateDurationLabel(currentMonth, currentYear);
    
    if (activeTab === "generate") {
      fetchEmployees();
    }
  }, [activeTab]);

  // Filter employees for generation table
  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchQuery.trim()) return true;
    const query = employeeSearchQuery.toLowerCase().trim();
    const fullName = `${emp.emp_fname || ""} ${emp.emp_middle || ""} ${emp.emp_lname || ""}`.toLowerCase();
    return (
      fullName.includes(query) ||
      emp.emp_id?.toString().includes(query) ||
      emp.emp_dept?.toLowerCase().includes(query) ||
      resolvePositionName(emp).toLowerCase().includes(query)
    );
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i.toString());
  }

  return (
    <div className="payroll-processing">
      <div className="payroll-processing-container">
        <div className="payroll-processing-header">
          <h1 className="payroll-processing-title">Payroll Processing</h1>
        </div>

        {/* Tabs */}
        <div className="payroll-processing-tabs">
          <button
            className={`payroll-processing-tab ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            <FileText className="payroll-processing-tab-icon" />
            View Reports
          </button>
          <button
            className={`payroll-processing-tab ${activeTab === "generate" ? "active" : ""}`}
            onClick={() => setActiveTab("generate")}
          >
            <DollarSign className="payroll-processing-tab-icon" />
            Generate Payslips
          </button>
        </div>

        {/* View Reports Tab */}
        {activeTab === "view" && (
          <>
            {/* Search Section */}
            <div className="payroll-processing-search-section">
          <div className="payroll-processing-search-wrapper">
            <div className="payroll-processing-search-input-wrapper">
              <Search className="payroll-processing-search-icon" />
              <input
                type="text"
                placeholder="Search by employee name, ID, month, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="payroll-processing-search-input"
              />
            </div>
          </div>
        </div>

        {/* Main Content: Table and Summary */}
        <div className="payroll-processing-content">
          {/* Table Section */}
          <div className="payroll-processing-table-section">
            {loading ? (
              <div className="payroll-processing-loading">
                <Loader2 className="payroll-processing-loading-icon" />
                <p>Loading payslip reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="payroll-processing-empty">
                <FileText className="payroll-processing-empty-icon" />
                <p>No payslip reports found</p>
              </div>
            ) : (
              <div className="payroll-processing-table-wrapper">
                <table className="payroll-processing-table">
                  <colgroup>
                    <col className="col-employee" />
                    <col className="col-id" />
                    <col className="col-period" />
                    <col className="col-money" />
                    <col className="col-money" />
                    <col className="col-money" />
                    <col className="col-status" />
                    <col className="col-actions" />
                  </colgroup>
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
                    {filteredReports.map((report) => (
                      <tr
                        key={report.report_id}
                        className={selectedReport?.report_id === report.report_id ? "payroll-processing-row-selected" : ""}
                        onClick={() => handleRowClick(report)}
                      >
                        <td className="col-employee">
                          <div className="payroll-processing-cell-employee">
                            {getEmployeeName(report)}
                          </div>
                        </td>
                        <td className="col-id">
                          <div className="payroll-processing-cell-text">
                            {report.employee?.emp_id || report.emp_id}
                          </div>
                        </td>
                        <td className="col-period">
                          <div className="payroll-processing-cell-text">
                            {formatMonthLabel(report)}
                          </div>
                        </td>
                        <td className="numeric-column">
                          <div className="payroll-processing-cell-amount">
                            {formatCurrency(report.gross_salary)}
                          </div>
                        </td>
                        <td className="numeric-column">
                          <div className="payroll-processing-cell-amount">
                            {formatCurrency(report.t_deductions)}
                          </div>
                        </td>
                        <td className="numeric-column">
                          <div className="payroll-processing-cell-amount payroll-processing-cell-net">
                            {formatCurrency(report.net_pay)}
                          </div>
                        </td>
                        <td className="col-status">
                          <span className={`payroll-processing-status-badge ${getStatusBadgeClass(report.payslip_status?.status_name)}`}>
                            {report.payslip_status?.status_name || "Unknown"}
                          </span>
                        </td>
                        <td className="col-actions">
                          <button
                            className="payroll-processing-delete-button"
                            onClick={(e) => handleDeleteClick(e, report)}
                            title="Delete payslip"
                          >
                            <Trash2 className="payroll-processing-delete-icon" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Panel */}
          <div className={`payroll-processing-summary-panel ${selectedReport ? "payroll-processing-summary-panel-visible" : ""}`}>
            {selectedReport ? (
              <div className="payroll-processing-summary-content">
                <div className="payroll-processing-summary-header">
                  <h2 className="payroll-processing-summary-title">Payslip Details</h2>
                  <button
                    className="payroll-processing-summary-close"
                    onClick={() => setSelectedReport(null)}
                  >
                    <X />
                  </button>
                </div>

                <div className="payroll-processing-summary-body">
                  {/* Employee Information */}
                  <div className="payroll-processing-summary-section">
                    <h3 className="payroll-processing-summary-section-title">Employee Information</h3>
                    <div className="payroll-processing-summary-grid">
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Name:</span>
                        <span className="payroll-processing-summary-value">
                          {getEmployeeName(selectedReport)}
                        </span>
                      </div>
                      {selectedReport.employee?.emp_email && (
                        <div className="payroll-processing-summary-item">
                          <span className="payroll-processing-summary-label">Email:</span>
                          <span className="payroll-processing-summary-value">
                            {selectedReport.employee.emp_email}
                          </span>
                        </div>
                      )}
                      {selectedReport.employee?.emp_dept && (
                        <div className="payroll-processing-summary-item">
                          <span className="payroll-processing-summary-label">Department:</span>
                          <span className="payroll-processing-summary-value">
                            {selectedReport.employee.emp_dept}
                          </span>
                        </div>
                      )}
                      {selectedReport.employee?.position_table?.emp_position && (
                        <div className="payroll-processing-summary-item">
                          <span className="payroll-processing-summary-label">Position:</span>
                          <span className="payroll-processing-summary-value">
                            {selectedReport.employee.position_table.emp_position}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pay Period */}
                  <div className="payroll-processing-summary-section">
                    <h3 className="payroll-processing-summary-section-title">Pay Period</h3>
                    <div className="payroll-processing-summary-grid">
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Period:</span>
                        <span className="payroll-processing-summary-value">
                          {formatMonthLabel(selectedReport)}
                        </span>
                      </div>
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Date Generated:</span>
                        <span className="payroll-processing-summary-value">
                          {formatDate(selectedReport.date_generated)}
                        </span>
                      </div>
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Status:</span>
                        <span className={`payroll-processing-summary-value ${getStatusBadgeClass(selectedReport.payslip_status?.status_name)}`}>
                          {selectedReport.payslip_status?.status_name || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="payroll-processing-summary-section">
                    <h3 className="payroll-processing-summary-section-title">Hours</h3>
                    <div className="payroll-processing-summary-grid">
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Total Hours:</span>
                        <span className="payroll-processing-summary-value">
                          {selectedReport.total_hours || 0} hrs
                        </span>
                      </div>
                      <div className="payroll-processing-summary-item">
                        <span className="payroll-processing-summary-label">Overtime Hours:</span>
                        <span className="payroll-processing-summary-value">
                          {selectedReport.total_overtime || 0} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="payroll-processing-summary-section">
                    <h3 className="payroll-processing-summary-section-title">Earnings</h3>
                    <div className="payroll-processing-summary-list">
                      <div className="payroll-processing-summary-list-item">
                        <span className="payroll-processing-summary-list-label">Gross Salary:</span>
                        <span className="payroll-processing-summary-list-value">
                          {formatCurrency(selectedReport.gross_salary)}
                        </span>
                      </div>
                      {selectedReport.overtime_pay > 0 && (
                        <div className="payroll-processing-summary-list-item">
                          <span className="payroll-processing-summary-list-label">Overtime Pay:</span>
                          <span className="payroll-processing-summary-list-value">
                            {formatCurrency(selectedReport.overtime_pay)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="payroll-processing-summary-section">
                    <h3 className="payroll-processing-summary-section-title">Deductions</h3>
                    <div className="payroll-processing-summary-list">
                      <div className="payroll-processing-summary-list-item">
                        <span className="payroll-processing-summary-list-label">SSS:</span>
                        <span className="payroll-processing-summary-list-value payroll-processing-summary-deduction">
                          {formatCurrency(selectedReport.sss)}
                        </span>
                      </div>
                      <div className="payroll-processing-summary-list-item">
                        <span className="payroll-processing-summary-list-label">PhilHealth:</span>
                        <span className="payroll-processing-summary-list-value payroll-processing-summary-deduction">
                          {formatCurrency(selectedReport.phil_health)}
                        </span>
                      </div>
                      <div className="payroll-processing-summary-list-item">
                        <span className="payroll-processing-summary-list-label">Pag-IBIG:</span>
                        <span className="payroll-processing-summary-list-value payroll-processing-summary-deduction">
                          {formatCurrency(selectedReport.pag_ibig)}
                        </span>
                      </div>
                      <div className="payroll-processing-summary-list-item payroll-processing-summary-list-item-total">
                        <span className="payroll-processing-summary-list-label">Total Deductions:</span>
                        <span className="payroll-processing-summary-list-value payroll-processing-summary-deduction">
                          {formatCurrency(selectedReport.t_deductions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="payroll-processing-summary-section payroll-processing-summary-section-net">
                    <div className="payroll-processing-summary-net">
                      <span className="payroll-processing-summary-net-label">Net Pay:</span>
                      <span className="payroll-processing-summary-net-value">
                        {formatCurrency(selectedReport.net_pay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="payroll-processing-summary-empty">
                <FileText className="payroll-processing-summary-empty-icon" />
                <p>Select a payslip report to view details</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Generate Payslips Tab */}
        {activeTab === "generate" && (
          <div className="payroll-processing-generate">
            {/* Month/Year Selection */}
            <div className="payroll-processing-generate-controls">
              <div className="payroll-processing-generate-control-group">
                <label className="payroll-processing-generate-label">
                  <Calendar className="payroll-processing-generate-icon" />
                  Month:
                </label>
                <select
                  value={month}
                  onChange={handleMonthChange}
                  className="payroll-processing-generate-select"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="payroll-processing-generate-control-group">
                <label className="payroll-processing-generate-label">
                  <Calendar className="payroll-processing-generate-icon" />
                  Year:
                </label>
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="payroll-processing-generate-select"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {durationLabel && (
                <div className="payroll-processing-duration-label">
                  <span>Duration: {durationLabel}</span>
                </div>
              )}
            </div>

            {/* Search Section */}
            <div className="payroll-processing-search-section">
              <div className="payroll-processing-search-wrapper">
                <div className="payroll-processing-search-input-wrapper">
                  <Search className="payroll-processing-search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees by name, ID, department, or position..."
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    className="payroll-processing-search-input"
                  />
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="payroll-processing-generate-table-section">
              <div className="payroll-processing-generate-table-header">
                <label className="payroll-processing-generate-select-all">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span>Select All</span>
                </label>
                <button
                  className="payroll-processing-generate-button"
                  onClick={handleGeneratePayslips}
                  disabled={generating || selectedEmployees.size === 0}
                >
                  {generating ? (
                    <>
                      <Loader2 className="payroll-processing-icon spinning" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="payroll-processing-icon" />
                      Generate Payslips
                    </>
                  )}
                </button>
              </div>

              <div className="payroll-processing-generate-table-wrapper">
                <table className="payroll-processing-generate-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Select</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Hourly Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="payroll-processing-generate-empty">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = selectedEmployees.has(emp.emp_id);
                        const fullName = `${emp.emp_fname || ""} ${emp.emp_middle || ""} ${emp.emp_lname || ""}`.trim();
                        return (
                          <tr key={emp.emp_id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleEmployeeSelect(emp.emp_id, e.target.checked)}
                              />
                            </td>
                            <td>{emp.emp_id}</td>
                            <td>{fullName || "N/A"}</td>
                            <td>{emp.emp_dept || "N/A"}</td>
                            <td>{resolvePositionName(emp)}</td>
                            <td>{formatCurrency(emp.hourly_rate || 0)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Area */}
            {summary && (
              <div className="payroll-processing-generate-summary">
                <h3 className="payroll-processing-generate-summary-title">Generation Summary</h3>
                <textarea
                  readOnly
                  value={summary}
                  className="payroll-processing-generate-summary-textarea"
                  rows={10}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="payroll-processing-delete-dialog-overlay" />
          <Dialog.Content className="payroll-processing-delete-dialog-content">
            <Dialog.Title className="payroll-processing-delete-dialog-title">
              Delete Payslip
            </Dialog.Title>
            <div className="payroll-processing-delete-dialog-body">
              <p>
                Are you sure you want to delete the payslip for{" "}
                <strong>
                  {reportToDelete && getEmployeeName(reportToDelete)} ({reportToDelete && formatMonthLabel(reportToDelete)})
                </strong>
                ?
              </p>
              <p className="payroll-processing-delete-dialog-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="payroll-processing-delete-dialog-actions">
              <button
                className="payroll-processing-delete-dialog-cancel"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setReportToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="payroll-processing-delete-dialog-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast Notification */}
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

export default PayrollProcessing;
