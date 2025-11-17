import React, { useState, useEffect } from "react";
import { Search, Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import "../../styles/DailyTimeRecords.css";

const DailyTimeRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [validEmployeeIds, setValidEmployeeIds] = useState(new Set());

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch valid employee IDs from database
  const fetchValidEmployeeIds = async () => {
    try {
      const { data, error } = await supabase
        .from("employee")
        .select("emp_id");

      if (error) throw error;
      
      // Create a Set of employee IDs for fast lookup
      const employeeIdSet = new Set((data || []).map(emp => emp.emp_id.toString()));
      setValidEmployeeIds(employeeIdSet);
      return employeeIdSet;
    } catch (error) {
      showToast("Failed to fetch employee list", "error");
      return new Set();
    }
  };

  // Fetch records from database
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_time_record")
        .select(`
          *,
          employee:employee_id (
            emp_id,
            emp_fname,
            emp_middle,
            emp_lname
          )
        `)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      showToast("Failed to fetch records", "error");
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription and initial fetch
  useEffect(() => {
    fetchRecords();
    fetchValidEmployeeIds();

    // Set up realtime subscription for daily_time_record table
    const channel = supabase
      .channel("dtr-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_time_record",
        },
        (payload) => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter records based on search query and date range
  const filteredRecords = records.filter((record) => {
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const employee = record.employee;
      if (employee) {
        const fullName = `${employee.emp_fname || ""} ${employee.emp_middle || ""} ${employee.emp_lname || ""}`.toLowerCase();
        const employeeId = employee.emp_id?.toString() || "";
        const matchesSearch = (
          fullName.includes(query) ||
          employeeId.includes(query) ||
          record.employee_id?.toString().includes(query)
        );
        if (!matchesSearch) return false;
      } else {
        if (!record.employee_id?.toString().includes(query)) return false;
      }
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

  // Convert month name to date (first day of month)
  const monthNameToDate = (monthName) => {
    const monthMap = {
      JANUARY: "01",
      FEBRUARY: "02",
      MARCH: "03",
      APRIL: "04",
      MAY: "05",
      JUNE: "06",
      JULY: "07",
      AUGUST: "08",
      SEPTEMBER: "09",
      OCTOBER: "10",
      NOVEMBER: "11",
      DECEMBER: "12",
    };
    const month = monthMap[monthName.toUpperCase()];
    if (!month) return null;
    // Use current year or extract from entry_date if available
    const year = new Date().getFullYear();
    return `${year}-${month}-01`;
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }

    return data;
  };

  // Transform CSV data to database format
  const transformCSVData = (csvData, validEmployeeIdSet) => {
    const transformed = [];
    const errors = [];

    // Helper function to format time to HH:MM:SS
    const formatTime = (time) => {
      if (!time) return "00:00:00";
      const parts = time.split(":");
      if (parts.length === 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      }
      if (parts.length === 3) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
      }
      // If no colon, treat as hours only
      return `${time.padStart(2, "0")}:00:00`;
    };

    // Helper function to format hours to HH:MM:SS
    const formatHours = (hours) => {
      if (!hours || hours === "0") return "00:00:00";
      if (hours.includes(":")) {
        const parts = hours.split(":");
        if (parts.length === 2) {
          return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
        }
        return formatTime(hours);
      }
      // If just a number, treat as hours
      return `${hours.padStart(2, "0")}:00:00`;
    };

    csvData.forEach((row, index) => {
      try {
        // Validate required fields
        if (!row.employee_id) {
          throw new Error(`Missing employee_id at row ${index + 2}`);
        }

        // Validate employee_id is a number
        const employeeId = parseInt(row.employee_id);
        if (isNaN(employeeId)) {
          throw new Error(`Invalid employee_id at row ${index + 2}. Must be a number.`);
        }

        // Validate employee_id exists in the employee table
        const employeeIdStr = employeeId.toString();
        if (!validEmployeeIdSet.has(employeeIdStr)) {
          throw new Error(`Employee ID ${employeeId} does not exist in the employee table at row ${index + 2}`);
        }

        // Parse entry_date (format: 8/1/2024 or 8/01/2024)
        let entryDate;
        if (row.entry_date) {
          const entryDateParts = row.entry_date.split("/");
          if (entryDateParts.length !== 3) {
            throw new Error(`Invalid entry_date format at row ${index + 2}. Expected format: M/D/YYYY`);
          }
          entryDate = `${entryDateParts[2]}-${entryDateParts[0].padStart(2, "0")}-${entryDateParts[1].padStart(2, "0")}`;
        } else {
          throw new Error(`Missing entry_date at row ${index + 2}`);
        }

        // Parse time_in and time_out
        const timeIn = formatTime(row.time_in || "00:00");
        const timeOut = formatTime(row.time_out || "00:00");

        // Parse month (format: AUGUST) - extract year from entry_date if needed
        let month;
        if (row.month) {
          const monthDate = monthNameToDate(row.month);
          if (!monthDate) {
            throw new Error(`Invalid month format at row ${index + 2}. Expected format: AUGUST, SEPTEMBER, etc.`);
          }
          // Use year from entry_date
          const year = entryDate.split("-")[0];
          month = `${year}-${monthDate.split("-")[1]}-${monthDate.split("-")[2]}`;
        } else {
          // If month not provided, use first day of entry_date's month
          const dateParts = entryDate.split("-");
          month = `${dateParts[0]}-${dateParts[1]}-01`;
        }

        // Parse hours_worked and overtime_hrs
        const hrsWorked = formatHours(row.hours_worked || row.hrs_worked || "0");
        const overtimeHrs = formatHours(row.overtime_hrs || "0");

        // Parse absent (format: No/Yes to 0/1)
        const absentValue = (row.absent || "").toString().toLowerCase().trim();
        const absent = absentValue === "yes" || absentValue === "1" || absentValue === "true" ? 1 : 0;

        transformed.push({
          employee_id: employeeId,
          entry_date: entryDate,
          time_in: timeIn,
          time_out: timeOut,
          month: month,
          hrs_worked: hrsWorked,
          overtime_hrs: overtimeHrs,
          absent: absent,
        });
      } catch (error) {
        errors.push({
          row: index + 2,
          error: error.message,
          data: row,
        });
      }
    });

    return { transformed, errors };
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type === "text/csv" || file.name.endsWith(".csv")) {
      setSelectedFile(file);
    } else {
      showToast("Please select a CSV file", "error");
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Import CSV data
  const handleImport = async () => {
    if (!selectedFile) {
      showToast("Please select a CSV file", "error");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportSummary(null);

    try {
      // Fetch valid employee IDs (refresh to ensure we have the latest)
      const validEmployeeIdSet = await fetchValidEmployeeIds();
      
      if (validEmployeeIdSet.size === 0) {
        showToast("No employees found. Please add employees first.", "error");
        setIsImporting(false);
        return;
      }

      // Read file
      const text = await selectedFile.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        showToast("CSV file is empty", "error");
        setIsImporting(false);
        return;
      }

      // Transform data with employee ID validation
      const { transformed, errors } = transformCSVData(csvData, validEmployeeIdSet);

      if (transformed.length === 0) {
        showToast("No valid records found in CSV", "error");
        setIsImporting(false);
        return;
      }

      // Check for duplicate records in database
      setImportProgress(10);
      const duplicateCheckPromises = transformed.map(async (record) => {
        const { data, error } = await supabase
          .from("daily_time_record")
          .select("record_id")
          .eq("employee_id", record.employee_id)
          .eq("entry_date", record.entry_date)
          .eq("time_in", record.time_in)
          .eq("time_out", record.time_out)
          .limit(1);

        if (error) {
          return { record, isDuplicate: false, error: error.message };
        }

        return { record, isDuplicate: (data && data.length > 0), error: null };
      });

      const duplicateCheckResults = await Promise.all(duplicateCheckPromises);
      const duplicates = duplicateCheckResults.filter(r => r.isDuplicate);
      const uniqueRecords = duplicateCheckResults
        .filter(r => !r.isDuplicate && !r.error)
        .map(r => r.record);

      setImportProgress(30);

      // If all records are duplicates, show message and return
      if (uniqueRecords.length === 0 && duplicates.length > 0) {
        setImportSummary({
          total: csvData.length,
          imported: 0,
          failed: errors.length,
          duplicates: duplicates.length,
          errors: errors.slice(0, 10),
          duplicateRecords: duplicates.slice(0, 10).map((d, idx) => ({
            row: transformed.findIndex(r => 
              r.employee_id === d.record.employee_id &&
              r.entry_date === d.record.entry_date &&
              r.time_in === d.record.time_in &&
              r.time_out === d.record.time_out
            ) + 2,
            employee_id: d.record.employee_id,
            entry_date: d.record.entry_date,
          })),
        });
        showToast(`All ${duplicates.length} records already exist in database`, "error");
        setIsImporting(false);
        return;
      }

      // Batch insert with progress tracking (only unique records)
      const batchSize = 50;
      let imported = 0;
      let failed = 0;
      const failedRecords = [];

      for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batch = uniqueRecords.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from("daily_time_record")
            .insert(batch);

          if (error) {
            failed += batch.length;
            failedRecords.push(...batch.map((r, idx) => ({
              row: transformed.findIndex(tr => 
                tr.employee_id === r.employee_id &&
                tr.entry_date === r.entry_date &&
                tr.time_in === r.time_in &&
                tr.time_out === r.time_out
              ) + 2,
              error: error.message,
            })));
          } else {
            imported += batch.length;
          }
        } catch (error) {
          failed += batch.length;
        }

        // Update progress (30% to 90% for insertion)
        const progress = 30 + Math.round(((i + batch.length) / uniqueRecords.length) * 60);
        setImportProgress(Math.min(progress, 90));
      }

      setImportProgress(100);

      // Add parsing errors to failed records
      failed += errors.length;
      failedRecords.push(...errors);

      // Show summary with duplicate information
      setImportSummary({
        total: csvData.length,
        imported,
        failed,
        duplicates: duplicates.length,
        errors: failedRecords.slice(0, 10), // Show first 10 errors
        duplicateRecords: duplicates.slice(0, 10).map((d, idx) => {
          const originalIndex = transformed.findIndex(r => 
            r.employee_id === d.record.employee_id &&
            r.entry_date === d.record.entry_date &&
            r.time_in === d.record.time_in &&
            r.time_out === d.record.time_out
          );
          return {
            row: originalIndex + 2,
            employee_id: d.record.employee_id,
            entry_date: d.record.entry_date,
          };
        }),
      });

      if (imported > 0) {
        showToast(`Successfully imported ${imported} records`, "success");
        fetchRecords();
      }

      if (failed > 0) {
        showToast(`${failed} records failed to import`, "error");
      }
    } catch (error) {
      showToast("Failed to import CSV file", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import dialog
  const resetImportDialog = () => {
    setSelectedFile(null);
    setImportProgress(0);
    setIsImporting(false);
    setImportSummary(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    // Handle both HH:MM:SS and HH:MM formats
    const parts = timeString.split(":");
    return `${parts[0]}:${parts[1] || "00"}`;
  };

  // Get employee name
  const getEmployeeName = (record) => {
    if (record.employee) {
      const { emp_fname, emp_middle, emp_lname } = record.employee;
      return `${emp_fname || ""} ${emp_middle || ""} ${emp_lname || ""}`.trim();
    }
    return `Employee ID: ${record.employee_id}`;
  };

  return (
    <div className="daily-time-records">
      <div className="daily-time-records-container">
        <div className="daily-time-records-header">
          <h1 className="daily-time-records-title">Daily Time Records</h1>
          <button
            className="daily-time-records-import-button"
            onClick={() => {
              resetImportDialog();
              setIsImportDialogOpen(true);
            }}
          >
            <Upload className="daily-time-records-icon" />
            Import CSV
          </button>
        </div>

        {/* Search Section */}
        <div className="daily-time-records-search-section">
          <div className="daily-time-records-search-wrapper">
            <div className="daily-time-records-search-input-wrapper">
              <Search className="daily-time-records-search-icon" />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="daily-time-records-search-input"
              />
            </div>
          </div>
          
          {/* Date Filter Section */}
          <div className="daily-time-records-date-filter">
            <div className="daily-time-records-date-filter-label">
              <Calendar className="daily-time-records-date-filter-icon" />
              <span>Filter by Date Range:</span>
            </div>
            <div className="daily-time-records-date-inputs">
              <div className="daily-time-records-date-input-wrapper">
                <label htmlFor="start-date" className="daily-time-records-date-label">
                  From:
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="daily-time-records-date-input"
                  max={endDate || undefined}
                />
              </div>
              <div className="daily-time-records-date-input-wrapper">
                <label htmlFor="end-date" className="daily-time-records-date-label">
                  To:
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="daily-time-records-date-input"
                  min={startDate || undefined}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="daily-time-records-date-clear-button"
                  title="Clear date filters"
                >
                  <X className="daily-time-records-icon" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="daily-time-records-table-section">
          {loading ? (
            <div className="daily-time-records-loading">
              <Loader2 className="daily-time-records-loading-icon" />
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
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Entry Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Hours Worked</th>
                    <th>Overtime</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.record_id}>
                      <td>
                        <div className="daily-time-records-cell-employee">
                          {getEmployeeName(record)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {record.employee_id || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {formatDate(record.entry_date)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {formatTime(record.time_in)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {formatTime(record.time_out)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {formatTime(record.hrs_worked)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {formatTime(record.overtime_hrs)}
                        </div>
                      </td>
                      <td>
                        <div className="daily-time-records-cell-text">
                          {record.absent === 1 ? (
                            <span className="daily-time-records-absent-yes">Yes</span>
                          ) : (
                            <span className="daily-time-records-absent-no">No</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import CSV Dialog */}
      <Dialog.Root open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="daily-time-records-dialog-overlay" />
          <Dialog.Content className="daily-time-records-dialog-content">
            <div className="daily-time-records-dialog-header">
              <Dialog.Title className="daily-time-records-dialog-title">
                Import CSV File
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="daily-time-records-dialog-close"
                  onClick={resetImportDialog}
                >
                  <X />
                </button>
              </Dialog.Close>
            </div>

            <div className="daily-time-records-dialog-body">
              {/* File Dropzone */}
              <div
                className={`daily-time-records-dropzone ${isDragging ? "daily-time-records-dropzone-dragging" : ""} ${selectedFile ? "daily-time-records-dropzone-has-file" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="daily-time-records-file-input"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="daily-time-records-dropzone-label">
                  {selectedFile ? (
                    <>
                      <FileText className="daily-time-records-dropzone-icon" />
                      <p className="daily-time-records-dropzone-file-name">
                        {selectedFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="daily-time-records-dropzone-remove"
                      >
                        <X />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="daily-time-records-dropzone-icon" />
                      <p className="daily-time-records-dropzone-text">
                        <span className="daily-time-records-dropzone-text-bold">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="daily-time-records-dropzone-text-small">
                        CSV file only
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Progress Bar */}
              {isImporting && (
                <div className="daily-time-records-progress-section">
                  <div className="daily-time-records-progress-header">
                    <span>Importing records...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="daily-time-records-progress-bar">
                    <div
                      className="daily-time-records-progress-bar-fill"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import Summary */}
              {importSummary && !isImporting && (
                <div className="daily-time-records-summary">
                  <h3 className="daily-time-records-summary-title">Import Summary</h3>
                  <div className="daily-time-records-summary-stats">
                    <div className="daily-time-records-summary-stat">
                      <CheckCircle2 className="daily-time-records-summary-icon success" />
                      <div>
                        <p className="daily-time-records-summary-stat-value">
                          {importSummary.imported}
                        </p>
                        <p className="daily-time-records-summary-stat-label">Imported</p>
                      </div>
                    </div>
                    {importSummary.duplicates > 0 && (
                      <div className="daily-time-records-summary-stat">
                        <AlertCircle className="daily-time-records-summary-icon warning" />
                        <div>
                          <p className="daily-time-records-summary-stat-value">
                            {importSummary.duplicates}
                          </p>
                          <p className="daily-time-records-summary-stat-label">Duplicates</p>
                        </div>
                      </div>
                    )}
                    <div className="daily-time-records-summary-stat">
                      <AlertCircle className="daily-time-records-summary-icon error" />
                      <div>
                        <p className="daily-time-records-summary-stat-value">
                          {importSummary.failed}
                        </p>
                        <p className="daily-time-records-summary-stat-label">Failed</p>
                      </div>
                    </div>
                    <div className="daily-time-records-summary-stat">
                      <FileText className="daily-time-records-summary-icon" />
                      <div>
                        <p className="daily-time-records-summary-stat-value">
                          {importSummary.total}
                        </p>
                        <p className="daily-time-records-summary-stat-label">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Records List */}
                  {importSummary.duplicateRecords && importSummary.duplicateRecords.length > 0 && (
                    <div className="daily-time-records-summary-duplicates">
                      <p className="daily-time-records-summary-duplicates-title">
                        Duplicate Records (Already Exist):
                      </p>
                      <div className="daily-time-records-summary-duplicates-list">
                        {importSummary.duplicateRecords.map((dup, index) => (
                          <div key={index} className="daily-time-records-summary-duplicate">
                            <span className="daily-time-records-summary-duplicate-row">
                              Row {dup.row}:
                            </span>
                            <span className="daily-time-records-summary-duplicate-info">
                              Employee ID {dup.employee_id} - {formatDate(dup.entry_date)}
                            </span>
                          </div>
                        ))}
                        {importSummary.duplicates > 10 && (
                          <p className="daily-time-records-summary-duplicates-more">
                            ... and {importSummary.duplicates - 10} more duplicate records
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {importSummary.errors.length > 0 && (
                    <div className="daily-time-records-summary-errors">
                      <p className="daily-time-records-summary-errors-title">Errors:</p>
                      <div className="daily-time-records-summary-errors-list">
                        {importSummary.errors.map((error, index) => (
                          <div key={index} className="daily-time-records-summary-error">
                            <span className="daily-time-records-summary-error-row">
                              Row {error.row}:
                            </span>
                            <span className="daily-time-records-summary-error-message">
                              {error.error}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="daily-time-records-dialog-actions">
                <Dialog.Close asChild>
                  <button
                    className="daily-time-records-dialog-button secondary"
                    onClick={resetImportDialog}
                    disabled={isImporting}
                  >
                    {importSummary ? "Close" : "Cancel"}
                  </button>
                </Dialog.Close>
                <button
                  className="daily-time-records-dialog-button primary"
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="daily-time-records-icon spinning" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="daily-time-records-icon" />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast Notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} />
      )}
    </div>
  );
};

export default DailyTimeRecords;
