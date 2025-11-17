import React, { useState, useEffect } from "react";
import { Save, User, Mail, Phone, MapPin, Upload } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import Toast from "../Toast";
import * as Avatar from "@radix-ui/react-avatar";
import { Cn } from "../../utils/cn.js";
import "../../styles/EmployeeAccountSettings.css";

const EmployeeAccountSettings = () => {
  const [empId, setEmpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [formData, setFormData] = useState({
    emp_fname: "",
    emp_middle: "",
    emp_lname: "",
    emp_email: "",
    emp_contact: "",
    emp_add: "",
    profile_picture: "",
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (session) {
      const user = JSON.parse(session);
      setEmpId(user.emp_id);
      if (user.emp_id) {
        fetchEmployeeData(user.emp_id);
      }
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchEmployeeData = async (employeeId) => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee")
        .select("*")
        .eq("emp_id", employeeId)
        .single();

      if (error) throw error;

      setEmployeeData(data);
      setFormData({
        emp_fname: data.emp_fname || "",
        emp_middle: data.emp_middle || "",
        emp_lname: data.emp_lname || "",
        emp_email: data.emp_email || "",
        emp_contact: data.emp_contact || "",
        emp_add: data.emp_add || "",
        profile_picture: data.profile_picture || "",
      });
      setProfilePreview(data.profile_picture || null);
    } catch (error) {
      showToast("Failed to fetch employee data", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "emp_contact":
        if (!value.trim()) {
          newErrors.emp_contact = "Contact number is required";
        } else if (!/^[\d\s\-\+\(\)]+$/.test(value.trim())) {
          newErrors.emp_contact = "Contact can only contain numbers, spaces, hyphens, plus signs, and parentheses";
        } else if (value.replace(/\D/g, '').length < 10) {
          newErrors.emp_contact = "Contact must contain at least 10 digits";
        } else if (value.replace(/\D/g, '').length > 15) {
          newErrors.emp_contact = "Contact number is too long (max 15 digits)";
        } else {
          delete newErrors.emp_contact;
        }
        break;
      case "emp_add":
        if (!value.trim()) {
          newErrors.emp_add = "Address is required";
        } else if (value.trim().length < 5) {
          newErrors.emp_add = "Address must be at least 5 characters";
        } else if (value.trim().length > 200) {
          newErrors.emp_add = "Address is too long (max 200 characters)";
        } else {
          delete newErrors.emp_add;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files && files[0]) {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profile_picture: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Validate on change
      if (name === "emp_contact" || name === "emp_add") {
        validateField(name, value);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Contact validation
    if (!formData.emp_contact.trim()) {
      newErrors.emp_contact = "Contact number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.emp_contact.trim())) {
      newErrors.emp_contact = "Contact can only contain numbers, spaces, hyphens, plus signs, and parentheses";
    } else if (formData.emp_contact.replace(/\D/g, '').length < 10) {
      newErrors.emp_contact = "Contact must contain at least 10 digits";
    } else if (formData.emp_contact.replace(/\D/g, '').length > 15) {
      newErrors.emp_contact = "Contact number is too long (max 15 digits)";
    }
    
    // Address validation
    if (!formData.emp_add.trim()) {
      newErrors.emp_add = "Address is required";
    } else if (formData.emp_add.trim().length < 5) {
      newErrors.emp_add = "Address must be at least 5 characters";
    } else if (formData.emp_add.trim().length > 200) {
      newErrors.emp_add = "Address is too long (max 200 characters)";
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

    setSaving(true);
    try {
      const { error } = await supabase
        .from("employee")
        .update({
          emp_contact: formData.emp_contact.trim(),
          emp_add: formData.emp_add.trim(),
          profile_picture: formData.profile_picture && formData.profile_picture.trim() !== "" ? formData.profile_picture.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("emp_id", empId);

      if (error) throw error;

      showToast("Profile updated successfully!", "success");
      fetchEmployeeData(empId);
      
      // Update header by triggering a storage event
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (fname, middle, lname) => {
    const first = fname?.[0] || "";
    const last = lname?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  if (!empId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#f59e0b", fontSize: "18px" }}>
          Please bind your Employee ID in the Dashboard to access account settings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="employee-account-settings-loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="employee-account-settings-container">
      <div className="employee-account-settings-header">
        <h1 className="employee-account-settings-title">Account Settings</h1>
        <p className="employee-account-settings-subtitle">Manage your profile and personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="employee-account-settings-form">
        {/* Profile Picture Section */}
        <div className="employee-account-settings-section">
          <h2 className="employee-account-settings-section-title">Profile Picture</h2>
          <div className="employee-account-settings-profile-section">
            <div className="employee-account-settings-profile-preview">
              <Avatar.Root className={Cn(
                "inline-flex items-center justify-center align-middle overflow-hidden select-none",
                "w-[120px] h-[120px] rounded-full",
                "border-[3px] border-slate-700 dark:border-slate-600"
              )}>
                <Avatar.Image
                  src={profilePreview || ""}
                  alt={`${formData.emp_fname} ${formData.emp_lname}`}
                  className="w-full h-full object-cover rounded-inherit"
                />
                <Avatar.Fallback className={Cn(
                  "w-full h-full flex items-center justify-center",
                  "bg-slate-700 dark:bg-slate-600",
                  "text-slate-50 text-[2rem] font-semibold"
                )}>
                  {getInitials(formData.emp_fname, formData.emp_middle, formData.emp_lname) || "EM"}
                </Avatar.Fallback>
              </Avatar.Root>
            </div>
            <div className="employee-account-settings-profile-upload">
              <label htmlFor="profile_picture" className="employee-account-settings-upload-label">
                <Upload size={20} />
                Upload Photo
              </label>
              <input
                type="file"
                id="profile_picture"
                name="profile_picture"
                accept="image/*"
                onChange={handleInputChange}
                className="employee-account-settings-upload-input"
              />
              <p className="employee-account-settings-upload-hint">
                JPG, PNG or GIF. Max size 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="employee-account-settings-section">
          <h2 className="employee-account-settings-section-title">Personal Information</h2>
          <div className="employee-account-settings-form-grid">
            <div className="employee-account-settings-form-group">
              <label htmlFor="emp_fname" className="employee-account-settings-label">
                <User size={16} />
                First Name
              </label>
              <input
                type="text"
                id="emp_fname"
                name="emp_fname"
                value={formData.emp_fname}
                onChange={handleInputChange}
                className="employee-account-settings-input"
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            <div className="employee-account-settings-form-group">
              <label htmlFor="emp_middle" className="employee-account-settings-label">
                <User size={16} />
                Middle Name
              </label>
              <input
                type="text"
                id="emp_middle"
                name="emp_middle"
                value={formData.emp_middle}
                onChange={handleInputChange}
                className="employee-account-settings-input"
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            <div className="employee-account-settings-form-group">
              <label htmlFor="emp_lname" className="employee-account-settings-label">
                <User size={16} />
                Last Name
              </label>
              <input
                type="text"
                id="emp_lname"
                name="emp_lname"
                value={formData.emp_lname}
                onChange={handleInputChange}
                className="employee-account-settings-input"
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="employee-account-settings-section">
          <h2 className="employee-account-settings-section-title">Contact Information</h2>
          <div className="employee-account-settings-form-grid">
            <div className="employee-account-settings-form-group">
              <label htmlFor="emp_email" className="employee-account-settings-label">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                id="emp_email"
                name="emp_email"
                value={formData.emp_email}
                onChange={handleInputChange}
                className="employee-account-settings-input"
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            <div className="employee-account-settings-form-group">
              <label htmlFor="emp_contact" className="employee-account-settings-label">
                <Phone size={16} />
                Contact Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="tel"
                id="emp_contact"
                name="emp_contact"
                value={formData.emp_contact}
                onChange={handleInputChange}
                className={Cn(
                  "employee-account-settings-input",
                  errors.emp_contact && "border-red-500 focus:border-red-500"
                )}
                required
              />
              {errors.emp_contact && (
                <p className="text-red-500 text-xs mt-1">{errors.emp_contact}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="employee-account-settings-section">
          <h2 className="employee-account-settings-section-title">Address</h2>
          <div className="employee-account-settings-form-group">
            <label htmlFor="emp_add" className="employee-account-settings-label">
              <MapPin size={16} />
              Address <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              id="emp_add"
              name="emp_add"
              value={formData.emp_add}
              onChange={handleInputChange}
              className={Cn(
                "employee-account-settings-textarea",
                errors.emp_add && "border-red-500 focus:border-red-500"
              )}
              rows={3}
              required
            />
            {errors.emp_add && (
              <p className="text-red-500 text-xs mt-1">{errors.emp_add}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="employee-account-settings-actions">
          <button
            type="submit"
            disabled={saving}
            className="employee-account-settings-save-btn"
          >
            {saving ? (
              <>
                <Save size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <Toast
        isOpen={toast.show}
        message={toast.message}
        variant={toast.type}
        onClose={() => setToast({ show: false, message: "", type: "" })}
      />
    </div>
  );
};

export default EmployeeAccountSettings;

