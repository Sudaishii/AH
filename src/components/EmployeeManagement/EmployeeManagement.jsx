import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Upload, MoreHorizontal, Eye } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Label } from "@radix-ui/react-label";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import { ViewEmployeeDetails } from "../ViewEmployeeDetails/ViewEmployeeDetails";
import "../../styles/EmployeeManagement.css";

// Department constants
const DEPARTMENTS = [
  "Executive Department",
  "Human Resource Department",
  "Finance Department",
  "Front Desk Department",
  "Housekeeping Department",
  "Maintenance Department",
  "Information Technology Department"
];

// Position to Department mapping
const POSITION_DEPARTMENT_MAP = {
  "General Manager": "Executive Department",
  "HR Manager": "Human Resource Department",
  "Finance Manager": "Finance Department",
  "Finance Clerk": "Finance Department",
  "Front Office Manager": "Front Desk Department",
  "Receptionist": "Front Desk Department",
  "Porter": "Front Desk Department",
  "Reservation Clerk": "Front Desk Department",
  "Executive Housekeeper": "Housekeeping",
  "Housekeeping Supervisor": "Housekeeping Department",
  "Room Attendant": "Housekeeping Department",
  "Public Area Cleaner": "Housekeeping Department",
  "Chief Engineer": "Maintenance Department",
  "Maintenance Supervisor": "Maintenance Department",
  "Maintenance Technician": "Maintenance Department",
  "Groundskeeper": "Maintenance Department",
  "IT Manager": "Information Technology Department",
  "IT Support Specialist": "Information Technology Department",
  "Network Administrator": "Information Technology Department",
  "System Administrator": "Information Technology Department"
};

// Static positions array with fixed IDs (matching database)
const STATIC_POSITIONS = [
  { pos_id: 1, emp_position: "General Manager", department: "Executive Department" },
  { pos_id: 2, emp_position: "HR Manager", department: "Human Resource Department" },
  { pos_id: 3, emp_position: "Finance Manager", department: "Finance Department" },
  { pos_id: 4, emp_position: "Finance Clerk", department: "Finance Department" },
  { pos_id: 5, emp_position: "Front Office Manager", department: "Front Desk Department" },
  { pos_id: 6, emp_position: "Receptionist", department: "Front Desk Department" },
  { pos_id: 7, emp_position: "Porter", department: "Front Desk Department" },
  { pos_id: 8, emp_position: "Reservation Clerk", department: "Front Desk Department" },
  { pos_id: 9, emp_position: "Executive Housekeeper", department: "Housekeeping Department" },
  { pos_id: 10, emp_position: "Housekeeping Supervisor", department: "Housekeeping Department" },
  { pos_id: 11, emp_position: "Room Attendant", department: "Housekeeping Department" },
  { pos_id: 12, emp_position: "Public Area Cleaner", department: "Housekeeping Department" },
  { pos_id: 13, emp_position: "Chief Engineer", department: "Maintenance Department" },
  { pos_id: 14, emp_position: "Maintenance Supervisor", department: "Maintenance Department" },
  { pos_id: 15, emp_position: "Maintenance Technician", department: "Maintenance Department" },
  { pos_id: 16, emp_position: "Groundskeeper", department: "Maintenance Department" },
  { pos_id: 17, emp_position: "IT Manager", department: "Information Technology Department" },
  { pos_id: 18, emp_position: "IT Support Specialist", department: "Information Technology Department" },
  { pos_id: 19, emp_position: "Network Administrator", department: "Information Technology Department" },
  { pos_id: 20, emp_position: "System Administrator", department: "Information Technology Department" }
];

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  // Form state
  const [formData, setFormData] = useState({
    emp_fname: "",
    emp_middle: "",
    emp_lname: "",
    emp_age: "",
    emp_sex: "",
    emp_add: "",
    emp_email: "",
    emp_contact: "",
    emp_hdate: "",
    emp_dept: "",
    emp_position: "",
    hourly_rate: "",
    emp_type: "",
    profile_picture: "",
  });

  const isContractual = formData.emp_type === "Contractual";

  const [formErrors, setFormErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

  // Fetch employees and initialize positions
  useEffect(() => {
    // Initialize positions from static array (no database fetch needed)
    const positionsWithAlias = STATIC_POSITIONS.map(pos => ({
      ...pos,
      pos_name: pos.emp_position // Add alias for compatibility
    }));
    setPositions(positionsWithAlias);
  }, []);

  // Set up realtime subscription and initial fetch
  useEffect(() => {
    fetchEmployees();

    // Set up realtime subscription for employee table
    const channel = supabase
      .channel('employee-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employee'
        },
        (payload) => {
          // Refetch employees when any change occurs
          fetchEmployees();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee")
        .select(`
          *,
          position_table (
            pos_id,
            emp_position
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };


  // Filter employees based on search query (prioritize name search)
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) {
      return true; // Show all if search is empty
    }
    
    const query = searchQuery.toLowerCase().trim();
    const fullName = `${emp.emp_fname} ${emp.emp_middle || ""} ${emp.emp_lname}`.toLowerCase();
    const firstName = (emp.emp_fname || "").toLowerCase();
    const lastName = (emp.emp_lname || "").toLowerCase();
    const middleName = (emp.emp_middle || "").toLowerCase();
    
    // Primary: Search by full name, first name, last name, or middle name
    return (
      fullName.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      middleName.includes(query) ||
      // Secondary: Also search by email, department, contact, or position
      emp.emp_email.toLowerCase().includes(query) ||
      emp.emp_dept.toLowerCase().includes(query) ||
      emp.emp_contact.includes(query) ||
      (emp.position_table?.emp_position || "").toLowerCase().includes(query)
    );
  });


  // Get filtered positions based on selected department
  const getFilteredPositions = () => {
    if (!formData.emp_dept || !formData.emp_dept.trim()) {
      return [];
    }
    
    const selectedDept = formData.emp_dept.trim();
    
    let filtered = positions.filter(pos => {
      // Use the department field directly from static positions
      const posDept = pos.department;
      
      // Compare with selected department (exact match, trimmed)
      return posDept && posDept.trim() === selectedDept;
    });
    
    // If editing and current position is not in filtered list, include it
    if (editingEmployee && formData.emp_position) {
      const currentPositionId = parseInt(formData.emp_position);
      const currentPosition = positions.find(p => p.pos_id === currentPositionId);
      if (currentPosition && !filtered.find(p => p.pos_id === currentPositionId)) {
        // Add current position even if it doesn't match the department filter
        filtered.push(currentPosition);
      }
    }
    
    return filtered.sort((a, b) => {
      // Sort positions alphabetically
      const nameA = a.emp_position || a.pos_name || "";
      const nameB = b.emp_position || b.pos_name || "";
      return nameA.localeCompare(nameB);
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          profile_picture: "Please select an image file",
        }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          profile_picture: "Image size must be less than 5MB",
        }));
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profile_picture: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      
      // Clear error
      if (formErrors.profile_picture) {
        setFormErrors((prev) => ({
          ...prev,
          profile_picture: null,
        }));
      }
    } else {
      // If department changes, reset position (but only if not editing or if position doesn't match new department)
      if (name === "emp_dept") {
        setFormData((prev) => {
          const newDept = value;
          const currentPositionId = prev.emp_position;
          
          // If editing and position exists, check if it still matches the new department
          if (editingEmployee && currentPositionId) {
            const currentPosition = positions.find(p => p.pos_id === parseInt(currentPositionId));
            // Only reset position if it doesn't match the new department
            if (currentPosition && currentPosition.department !== newDept) {
              return {
                ...prev,
                [name]: value,
                emp_position: "", // Reset position when department changes and position doesn't match
              };
            }
          }
          
          // For new employees or when position doesn't match, reset position
          if (!editingEmployee || !currentPositionId) {
            return {
              ...prev,
              [name]: value,
              emp_position: "", // Reset position when department changes
            };
          }
          
          // Keep position if it matches the new department
          return {
            ...prev,
            [name]: value,
          };
        });
        // Clear position error
        if (formErrors.emp_position) {
          setFormErrors((prev) => ({
            ...prev,
            emp_position: null,
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    }
  };

  // Get initials for avatar fallback
  const getInitials = (fname, mname, lname) => {
    const first = fname ? fname[0].toUpperCase() : "";
    const last = lname ? lname[0].toUpperCase() : "";
    return first + last;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // First name validation
    if (!formData.emp_fname.trim()) {
      errors.emp_fname = "First name is required";
    } else if (formData.emp_fname.trim().length < 2) {
      errors.emp_fname = "First name must be at least 2 characters";
    } else if (!/^[\p{L}\s'-]+$/u.test(formData.emp_fname.trim())) {
      errors.emp_fname = "First name can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Last name validation
    if (!formData.emp_lname.trim()) {
      errors.emp_lname = "Last name is required";
    } else if (formData.emp_lname.trim().length < 2) {
      errors.emp_lname = "Last name must be at least 2 characters";
    } else if (!/^[\p{L}\s'-]+$/u.test(formData.emp_lname.trim())) {
      errors.emp_lname = "Last name can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Middle name validation (optional)
    if (formData.emp_middle && !/^[\p{L}\s'-]+$/u.test(formData.emp_middle.trim())) {
      errors.emp_middle = "Middle name can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Age validation
    if (!formData.emp_age) {
      errors.emp_age = "Age is required";
    } else if (formData.emp_age < 18 || formData.emp_age > 100) {
      errors.emp_age = "Age must be between 18 and 100";
    }

    // Sex validation
    if (!formData.emp_sex) {
      errors.emp_sex = "Sex is required";
    }

    // Address validation
    if (!formData.emp_add.trim()) {
      errors.emp_add = "Address is required";
    } else if (formData.emp_add.trim().length < 5) {
      errors.emp_add = "Address must be at least 5 characters";
    }

    // Email validation
    if (!formData.emp_email.trim()) {
      errors.emp_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emp_email.trim())) {
      errors.emp_email = "Invalid email format";
    }

    // Contact validation
    if (!formData.emp_contact.trim()) {
      errors.emp_contact = "Contact is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.emp_contact.trim())) {
      errors.emp_contact = "Contact can only contain numbers, spaces, hyphens, plus signs, and parentheses";
    } else if (formData.emp_contact.replace(/\D/g, '').length < 10) {
      errors.emp_contact = "Contact must contain at least 10 digits";
    }

    // Hire date validation
    if (!formData.emp_hdate) {
      errors.emp_hdate = "Hire date is required";
    } else {
      const hireDate = new Date(formData.emp_hdate);
      const today = new Date();
      // Set both dates to midnight to compare only the date part (not time)
      today.setHours(0, 0, 0, 0);
      hireDate.setHours(0, 0, 0, 0);
      
      if (hireDate > today) {
        errors.emp_hdate = "Hire date cannot be in the future";
      }
    }

    // Department validation
    if (!formData.emp_dept.trim()) {
      errors.emp_dept = "Department is required";
    } else if (!DEPARTMENTS.includes(formData.emp_dept.trim())) {
      errors.emp_dept = "Please select a valid department";
    }

    // Position validation - must select department first
    if (!formData.emp_dept.trim()) {
      errors.emp_position = "Please select a department first";
    } else if (!formData.emp_position) {
      errors.emp_position = "Position is required";
    } else {
      // Validate that the selected position belongs to the selected department
      const filteredPositions = getFilteredPositions();
      const selectedPosition = positions.find(pos => pos.pos_id === parseInt(formData.emp_position));
      if (selectedPosition && !filteredPositions.find(pos => pos.pos_id === selectedPosition.pos_id)) {
        errors.emp_position = "Selected position does not belong to the selected department";
      }
    }

    // Hourly rate validation
    if (!formData.hourly_rate || formData.hourly_rate === "") {
      errors.hourly_rate = "Hourly rate is required";
    } else if (parseFloat(formData.hourly_rate) < 0) {
      errors.hourly_rate = "Hourly rate cannot be negative";
    } else if (parseFloat(formData.hourly_rate) > 10000) {
      errors.hourly_rate = "Hourly rate seems too high (max 10000)";
    }

    // Employee type validation
    if (!formData.emp_type.trim()) {
      errors.emp_type = "Employee type is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the form errors", "error");
      return;
    }

    try {
      const employeeData = {
        emp_fname: formData.emp_fname.trim(),
        emp_middle: formData.emp_middle.trim() || null,
        emp_lname: formData.emp_lname.trim(),
        emp_age: parseInt(formData.emp_age),
        emp_sex: formData.emp_sex,
        emp_add: formData.emp_add.trim(),
        emp_email: formData.emp_email.trim(),
        emp_contact: formData.emp_contact.trim(),
        emp_hdate: formData.emp_hdate,
        emp_dept: formData.emp_dept.trim(),
        emp_position: parseInt(formData.emp_position),
        hourly_rate: parseFloat(formData.hourly_rate),
        emp_type: formData.emp_type.trim(),
        profile_picture: formData.profile_picture && formData.profile_picture.trim() !== "" ? formData.profile_picture.trim() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingEmployee) {
        // Update employee
        const { error } = await supabase
          .from("employee")
          .update(employeeData)
          .eq("emp_id", editingEmployee.emp_id);

        if (error) throw error;
        showToast("Employee updated successfully", "success");
      } else {
        // Create new employee
        const { error } = await supabase.from("employee").insert([employeeData]);

        if (error) throw error;
        showToast("Employee added successfully", "success");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      if (error.code === "23505") {
        showToast("Email already exists", "error");
      } else {
        showToast(error.message || "Failed to save employee", "error");
      }
    }
  };

  // Handle edit
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    
    // Format hire date for date input (YYYY-MM-DD format)
    let formattedHireDate = "";
    if (employee.emp_hdate) {
      const date = new Date(employee.emp_hdate);
      if (!isNaN(date.getTime())) {
        formattedHireDate = date.toISOString().split('T')[0];
      } else {
        formattedHireDate = employee.emp_hdate;
      }
    }
    
    // Get department from database - ensure it matches one of the DEPARTMENTS options
    let department = employee.emp_dept || "";
    
    // Map common department variations to standard format
    const departmentMapping = {
      "Information IT dept": "Information Technology Department",
      "IT dept": "Information Technology Department",
      "Information Technology": "Information Technology Department",
      "Executive": "Executive Department",
      "Human Resources": "Human Resource Department",
      "HR": "Human Resource Department",
      "Finance": "Finance Department",
      "Front Desk": "Front Desk Department",
      "Front Office": "Front Desk Department",
      "Housekeeping": "Housekeeping Department",
      "Maintenance": "Maintenance Department",
    };
    
    // Apply mapping if exists
    if (departmentMapping[department]) {
      department = departmentMapping[department];
    }
    
    // If department from DB doesn't match exactly, try to find a match
    if (department && !DEPARTMENTS.includes(department)) {
      // Try to find a matching department (case-insensitive or partial match)
      const matchedDept = DEPARTMENTS.find(dept => 
        dept.toLowerCase() === department.toLowerCase() ||
        dept.toLowerCase().includes(department.toLowerCase()) ||
        department.toLowerCase().includes(dept.toLowerCase())
      );
      if (matchedDept) {
        department = matchedDept;
      } else {
        // If no match found, use the value from database as-is
        // This ensures the field is not empty
      }
    }
    
    // Get position ID from database - ensure it's a valid integer
    let positionId = "";
    if (employee.emp_position !== null && employee.emp_position !== undefined) {
      positionId = employee.emp_position.toString();
    }
    
    // Verify position exists in our positions array
    const positionExists = positions.some(p => p.pos_id === parseInt(positionId));
    
    // Use the actual values from database - preserve department and position
    // Set form data in a way that ensures both values are set together
    const formDataToSet = {
      emp_fname: employee.emp_fname || "",
      emp_middle: employee.emp_middle || "",
      emp_lname: employee.emp_lname || "",
      emp_age: employee.emp_age?.toString() || "",
      emp_sex: employee.emp_sex || "",
      emp_add: employee.emp_add || "",
      emp_email: employee.emp_email || "",
      emp_contact: employee.emp_contact || "",
      emp_hdate: formattedHireDate,
      emp_dept: department || employee.emp_dept || "", // Use mapped department or fallback to original
      emp_position: positionId, // Use actual position ID from database
      hourly_rate: employee.hourly_rate?.toString() || "",
      emp_type: employee.emp_type || "",
      profile_picture: employee.profile_picture || "",
    };
    
    setFormData(formDataToSet);
    setProfilePreview(employee.profile_picture || null);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      const { error } = await supabase
        .from("employee")
        .delete()
        .eq("emp_id", employeeToDelete.emp_id);

      if (error) throw error;
      showToast("Employee deleted successfully", "success");
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error) {
      showToast("Failed to delete employee", "error");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      emp_fname: "",
      emp_middle: "",
      emp_lname: "",
      emp_age: "",
      emp_sex: "",
      emp_add: "",
      emp_email: "",
      emp_contact: "",
      emp_hdate: "",
      emp_dept: "",
      emp_position: "",
      hourly_rate: "",
      emp_type: "",
      profile_picture: "",
    });
    setFormErrors({});
    setProfilePreview(null);
    setEditingEmployee(null);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // Show toast
  const showToast = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setIsToastOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <React.Fragment>
      <div className="employee-management">
        <div className="employee-management-container">
          <div className="employee-management-header">
            <h1 className="employee-management-title">
        Employee Management
      </h1>
          </div>

          {/* Search and Add Button */}
          <div className="employee-search-section">
            <div className="employee-search-wrapper">
              <div className="employee-search-input-wrapper">
                <Search className="employee-search-icon" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, department, or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="employee-search-input"
                />
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="employee-add-button"
              >
                <Plus className="employee-add-button-icon" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="employee-table-container">
            {loading ? (
              <div className="employee-table-loading">
                Loading employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="employee-table-empty">
                {searchQuery ? "No employees found matching your search." : "No employees found."}
              </div>
            ) : (
              <div className="employee-table-wrapper">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.emp_id}>
                        <td>
                          <div className="employee-table-cell-employee">
                            <div className="employee-table-avatar">
                              <Avatar.Root className="employee-avatar">
                                <Avatar.Image
                                  src={employee.profile_picture || ""}
                                  alt={`${employee.emp_fname} ${employee.emp_lname}`}
                                  className="employee-avatar-image"
                                />
                                <Avatar.Fallback className="employee-avatar-fallback">
                                  {getInitials(employee.emp_fname, employee.emp_middle, employee.emp_lname)}
                                </Avatar.Fallback>
                              </Avatar.Root>
                            </div>
                            <div className="employee-table-cell-info">
                              <div className="employee-table-cell-name">
                                {employee.emp_fname}{" "}
                                {employee.emp_middle && `${employee.emp_middle} `}
                                {employee.emp_lname}
                              </div>
                              <div className="employee-table-cell-email">
                                {employee.emp_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="employee-table-cell-text">
                            {employee.emp_dept === "Information IT dept" 
                              ? "Information Technology Department" 
                              : (employee.emp_dept || "N/A")}
                          </div>
                        </td>
                        <td>
                          <div className="employee-table-cell-text">
                            {employee.position_table?.emp_position || 
                             (positions.find(p => p.pos_id === employee.emp_position)?.emp_position) || 
                             "N/A"}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                className="employee-action-menu-button"
                                aria-label="More options"
                              >
                                <MoreHorizontal className="employee-action-menu-icon" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                className="employee-action-menu-content"
                                sideOffset={5}
                                align="end"
                              >
                                <DropdownMenu.Item
                                  className="employee-action-menu-item"
                                  onSelect={() => {
                                    setViewingEmployee(employee);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="employee-action-menu-item-icon" />
                                  View Employee
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="employee-action-menu-separator" />
                                <DropdownMenu.Item
                                  className="employee-action-menu-item"
                                  onSelect={() => handleEdit(employee)}
                                >
                                  <Edit className="employee-action-menu-item-icon" />
                                  Edit Employee
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="employee-action-menu-separator" />
                                <DropdownMenu.Item
                                  className="employee-action-menu-item employee-action-menu-item-danger"
                                  onSelect={() => handleDeleteClick(employee)}
                                >
                                  <Trash2 className="employee-action-menu-item-icon" />
                                  Delete Employee
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
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
      </div>

      {/* Add/Edit Employee Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="employee-dialog-overlay" />
          <Dialog.Content className="employee-dialog-content">
            <div className="employee-dialog-header">
              <Dialog.Title className="employee-dialog-title">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={handleDialogClose}
                  className="employee-dialog-close-button"
                >
                  <X className="employee-dialog-close-icon" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="employee-form">
              {/* Profile Picture Upload */}
              <div className="employee-form-field employee-form-field-full">
                <Label
                  htmlFor="profile_picture"
                  className="employee-form-label"
                >
                  Profile Picture
                </Label>
                <div className="employee-profile-upload-wrapper">
                  <div className="employee-profile-preview">
                    <Avatar.Root className="employee-profile-avatar">
                      <Avatar.Image
                        src={profilePreview || ""}
                        alt="Profile preview"
                        className="employee-profile-avatar-image"
                      />
                      <Avatar.Fallback className="employee-profile-avatar-fallback">
                        {getInitials(formData.emp_fname, formData.emp_middle, formData.emp_lname) || "EM"}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </div>
                  <div className="employee-profile-upload-controls">
                    <label htmlFor="profile_picture" className="employee-profile-upload-button">
                      <Upload className="employee-profile-upload-icon" />
                      <span>Upload Photo</span>
                    </label>
                    <input
                      type="file"
                      id="profile_picture"
                      name="profile_picture"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="employee-profile-upload-input"
                    />
                    <p className="employee-profile-upload-hint">
                      JPG, PNG or GIF. Max size 5MB
                    </p>
                    {formErrors.profile_picture && (
                      <p className="employee-form-error">{formErrors.profile_picture}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="employee-form-grid">
                {/* First Name */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_fname"
                    className="employee-form-label"
                  >
                    First Name <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="text"
                    id="emp_fname"
                    name="emp_fname"
                    value={formData.emp_fname}
                    onChange={handleInputChange}
                    disabled={!!editingEmployee}
                    className={`employee-form-input ${
                      formErrors.emp_fname ? "employee-form-input-error" : ""
                    } ${editingEmployee ? "employee-form-input-disabled" : ""}`}
                  />
                  {formErrors.emp_fname && (
                    <p className="employee-form-error">{formErrors.emp_fname}</p>
                  )}
                </div>

                {/* Middle Name */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_middle"
                    className="employee-form-label"
                  >
                    Middle Name
                  </Label>
                  <input
                    type="text"
                    id="emp_middle"
                    name="emp_middle"
                    value={formData.emp_middle}
                    onChange={handleInputChange}
                    disabled={!!editingEmployee}
                    className={`employee-form-input ${
                      formErrors.emp_middle ? "employee-form-input-error" : ""
                    } ${editingEmployee ? "employee-form-input-disabled" : ""}`}
                  />
                  {formErrors.emp_middle && (
                    <p className="employee-form-error">{formErrors.emp_middle}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_lname"
                    className="employee-form-label"
                  >
                    Last Name <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="text"
                    id="emp_lname"
                    name="emp_lname"
                    value={formData.emp_lname}
                    onChange={handleInputChange}
                    disabled={!!editingEmployee}
                    className={`employee-form-input ${
                      formErrors.emp_lname ? "employee-form-input-error" : ""
                    } ${editingEmployee ? "employee-form-input-disabled" : ""}`}
                  />
                  {formErrors.emp_lname && (
                    <p className="employee-form-error">{formErrors.emp_lname}</p>
                  )}
                </div>

                {/* Age */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_age"
                    className="employee-form-label"
                  >
                    Age <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="number"
                    id="emp_age"
                    name="emp_age"
                    value={formData.emp_age}
                    onChange={handleInputChange}
                    min="18"
                    max="100"
                    disabled={!!editingEmployee}
                    className={`employee-form-input ${
                      formErrors.emp_age ? "employee-form-input-error" : ""
                    } ${editingEmployee ? "employee-form-input-disabled" : ""}`}
                  />
                  {formErrors.emp_age && (
                    <p className="employee-form-error">{formErrors.emp_age}</p>
                  )}
                </div>

                {/* Sex */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_sex"
                    className="employee-form-label"
                  >
                    Sex <span className="employee-form-label-required">*</span>
                  </Label>
                  <select
                    id="emp_sex"
                    name="emp_sex"
                    value={formData.emp_sex}
                    onChange={handleInputChange}
                    disabled={!!editingEmployee}
                    className={`employee-form-select ${
                      formErrors.emp_sex ? "employee-form-select-error" : ""
                    } ${editingEmployee ? "employee-form-select-disabled" : ""}`}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.emp_sex && (
                    <p className="employee-form-error">{formErrors.emp_sex}</p>
                  )}
                </div>

                {/* Email */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_email"
                    className="employee-form-label"
                  >
                    Email <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="email"
                    id="emp_email"
                    name="emp_email"
                    value={formData.emp_email}
                    onChange={handleInputChange}
                    className={`employee-form-input ${
                      formErrors.emp_email ? "employee-form-input-error" : ""
                    }`}
                  />
                  {formErrors.emp_email && (
                    <p className="employee-form-error">{formErrors.emp_email}</p>
                  )}
                </div>

                {/* Contact */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_contact"
                    className="employee-form-label"
                  >
                    Contact <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="text"
                    id="emp_contact"
                    name="emp_contact"
                    value={formData.emp_contact}
                    onChange={handleInputChange}
                    className={`employee-form-input ${
                      formErrors.emp_contact ? "employee-form-input-error" : ""
                    }`}
                  />
                  {formErrors.emp_contact && (
                    <p className="employee-form-error">{formErrors.emp_contact}</p>
                  )}
                </div>

                {/* Hire Date */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_hdate"
                    className="employee-form-label"
                  >
                    Hire Date <span className="employee-form-label-required">*</span>
                  </Label>
                  <input
                    type="date"
                    id="emp_hdate"
                    name="emp_hdate"
                    value={formData.emp_hdate}
                    onChange={handleInputChange}
                    disabled={!!editingEmployee}
                    className={`employee-form-input ${
                      formErrors.emp_hdate ? "employee-form-input-error" : ""
                    } ${editingEmployee ? "employee-form-input-disabled" : ""}`}
                  />
                  {formErrors.emp_hdate && (
                    <p className="employee-form-error">{formErrors.emp_hdate}</p>
                  )}
                </div>

                {/* Department */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_dept"
                    className="employee-form-label"
                  >
                    Department <span className="employee-form-label-required">*</span>
                  </Label>
                  <select
                    id="emp_dept"
                    name="emp_dept"
                    value={formData.emp_dept}
                    onChange={handleInputChange}
                    className={`employee-form-select ${
                      formErrors.emp_dept ? "employee-form-select-error" : ""
                    }`}
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    {/* If editing and department from DB is not in DEPARTMENTS, add it as an option */}
                    {editingEmployee && formData.emp_dept && !DEPARTMENTS.includes(formData.emp_dept) && (
                      <option value={formData.emp_dept}>
                        {formData.emp_dept}
                      </option>
                    )}
                  </select>
                  {formErrors.emp_dept && (
                    <p className="employee-form-error">{formErrors.emp_dept}</p>
                  )}
                </div>

                {/* Position */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_position"
                    className="employee-form-label"
                  >
                    Position <span className="employee-form-label-required">*</span>
                  </Label>
                  <select
                    id="emp_position"
                    name="emp_position"
                    value={formData.emp_position}
                    onChange={handleInputChange}
                    disabled={!formData.emp_dept && !editingEmployee}
                    className={`employee-form-select ${
                      formErrors.emp_position ? "employee-form-select-error" : ""
                    } ${!formData.emp_dept && !editingEmployee ? "employee-form-select-disabled" : ""}`}
                  >
                    <option value="">
                      {!formData.emp_dept && !editingEmployee
                        ? "Select department first..." 
                        : getFilteredPositions().length === 0
                        ? "No positions available for this department"
                        : "Select position..."}
                    </option>
                    {getFilteredPositions().map((pos) => (
                      <option key={pos.pos_id} value={pos.pos_id}>
                        {pos.emp_position || pos.pos_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.emp_position && (
                    <p className="employee-form-error">{formErrors.emp_position}</p>
                  )}
                  {formData.emp_dept && getFilteredPositions().length === 0 && !formErrors.emp_position && (
                    <p className="employee-form-error" style={{ color: '#f59e0b' }}>
                      No positions found for {formData.emp_dept}. Please ensure positions are properly assigned to departments.
                    </p>
                  )}
                </div>

                {/* Hourly Rate */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="hourly_rate"
                    className="employee-form-label"
                  >
                    Hourly Rate <span className="employee-form-label-required">*</span>
                  </Label>
                  <div className="employee-form-input-with-prefix">
                    <span className="employee-form-input-prefix">₱</span>
                    <input
                      type="number"
                      id="hourly_rate"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`employee-form-input employee-form-input-with-prefix-input ${
                        formErrors.hourly_rate ? "employee-form-input-error" : ""
                      }`}
                    />
                  </div>
                  {formErrors.hourly_rate && (
                    <p className="employee-form-error">{formErrors.hourly_rate}</p>
                  )}
                </div>

                {/* Employee Type */}
                <div className="employee-form-field">
                  <Label
                    htmlFor="emp_type"
                    className="employee-form-label"
                  >
                    Employee Type <span className="employee-form-label-required">*</span>
                  </Label>
                  <select
                    id="emp_type"
                    name="emp_type"
                    value={formData.emp_type}
                    onChange={handleInputChange}
                    className={`employee-form-select ${
                      formErrors.emp_type ? "employee-form-select-error" : ""
                    }`}
                  >
                    <option value="">Select employee type...</option>
                    <option value="Regular">Regular</option>
                    <option value="Contractual">Contractual</option>
                  </select>
                  {formErrors.emp_type && (
                    <p className="employee-form-error">{formErrors.emp_type}</p>
                  )}
                </div>

                {isContractual && (
                  <div className="employee-contractual-section">
                    <div className="employee-contractual-banner">
                      <p className="employee-contractual-eyebrow">Future Feature</p>
                      <p className="employee-contractual-text">
                        Contract scheduling will be editable soon. For now, review the placeholders below.
                      </p>
                    </div>
                    <div className="employee-contractual-grid">
                      <div className="employee-form-field">
                        <Label className="employee-form-label">
                          Contract Start Date
                        </Label>
                        <input
                          type="date"
                          disabled
                          className="employee-form-input employee-form-input-disabled"
                          placeholder="Start date"
                        />
                      </div>
                      <div className="employee-form-field">
                        <Label className="employee-form-label">
                          Contract End Date
                        </Label>
                        <input
                          type="date"
                          disabled
                          className="employee-form-input employee-form-input-disabled"
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  </div>
                )}
    </div>

              {/* Address - Full Width */}
              <div className="employee-form-field">
                <Label
                  htmlFor="emp_add"
                  className="employee-form-label"
                >
                  Address <span className="employee-form-label-required">*</span>
                </Label>
                <textarea
                  id="emp_add"
                  name="emp_add"
                  value={formData.emp_add}
                  onChange={handleInputChange}
                  rows="3"
                  className={`employee-form-textarea ${
                    formErrors.emp_add ? "employee-form-textarea-error" : ""
                  }`}
                />
                {formErrors.emp_add && (
                  <p className="employee-form-error">{formErrors.emp_add}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="employee-form-actions">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={handleDialogClose}
                    className="employee-form-button employee-form-button-cancel"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="employee-form-button employee-form-button-submit"
                >
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="employee-dialog-overlay" />
          <Dialog.Content className="employee-delete-dialog-content">
            <Dialog.Title className="employee-delete-dialog-title">
              Delete Employee
            </Dialog.Title>
            <Dialog.Description className="employee-delete-dialog-description">
              Are you sure you want to delete{" "}
              <span className="employee-delete-dialog-name">
                {employeeToDelete?.emp_fname} {employeeToDelete?.emp_lname}
              </span>
              ? This action cannot be undone.
            </Dialog.Description>
            <div className="employee-delete-dialog-actions">
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setEmployeeToDelete(null);
                  }}
                  className="employee-delete-button employee-delete-button-cancel"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="employee-delete-button employee-delete-button-confirm"
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* View Employee Dialog */}
      <ViewEmployeeDetails
        employee={viewingEmployee}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingEmployee(null);
        }}
      />

      {/* Toast */}
      <Toast
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        message={toastMessage}
        variant={toastVariant}
      />
    </React.Fragment>
  );
};

export default EmployeeManagement;
