import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign, X } from "lucide-react";
import { supabase } from "../../services/supabase-client";
import * as Avatar from "@radix-ui/react-avatar";
import * as Dialog from "@radix-ui/react-dialog";
import { Cn } from "../../utils/cn.js";
import "../../styles/ViewEmployeeDetails.css";

export const ViewEmployeeDetails = ({ employee, isOpen, onClose }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee?.emp_id) {
      fetchEmployeeData(employee.emp_id);
    }
  }, [isOpen, employee]);

  const fetchEmployeeData = async (employeeId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee")
        .select("*")
        .eq("emp_id", employeeId)
        .single();

      if (error) throw error;
      setEmployeeData(data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getInitials = (fname, mname, lname) => {
    let initials = "";
    if (fname) initials += fname[0];
    if (mname) initials += mname[0];
    if (lname) initials += lname[0];
    return initials.toUpperCase();
  };

  if (!employeeData && !loading) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="view-employee-dialog-overlay" />
        <Dialog.Content className="view-employee-dialog-content">
          {loading ? (
            <div className="view-employee-loading">
              <p>Loading employee details...</p>
            </div>
          ) : employeeData ? (
            <>
              <Dialog.Title className="view-employee-dialog-title">
                <div className="view-employee-header">
                  <div className="view-employee-profile-section">
                    <Avatar.Root className={Cn(
                      "inline-flex items-center justify-center align-middle overflow-hidden select-none",
                      "w-[80px] h-[80px] rounded-full",
                      "border-[3px] border-slate-700 dark:border-slate-600"
                    )}>
                      <Avatar.Image
                        src={employeeData.profile_picture || ""}
                        alt={`${employeeData.emp_fname} ${employeeData.emp_lname}`}
                        className="w-full h-full object-cover rounded-inherit"
                      />
                      <Avatar.Fallback className={Cn(
                        "w-full h-full flex items-center justify-center",
                        "bg-slate-700 dark:bg-slate-600",
                        "text-slate-50 text-xl font-semibold"
                      )}>
                        {getInitials(employeeData.emp_fname, employeeData.emp_middle, employeeData.emp_lname) || "EM"}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="view-employee-name-section">
                      <h2 className="view-employee-name">
                        {`${employeeData.emp_fname || ""} ${employeeData.emp_middle || ""} ${employeeData.emp_lname || ""}`.trim() || "Employee"}
                      </h2>
                      <p className="view-employee-id">Employee ID: {employeeData.emp_id}</p>
                    </div>
                  </div>
                  <Dialog.Close className="view-employee-close-button">
                    <X size={20} />
                  </Dialog.Close>
                </div>
              </Dialog.Title>

              <div className="view-employee-dialog-body">
                {/* Personal Information */}
                <div className="view-employee-section">
                  <h3 className="view-employee-section-title">Personal Information</h3>
                  <div className="view-employee-form-grid">
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <User size={16} />
                        First Name
                      </label>
                      <p className="view-employee-value">{employeeData.emp_fname || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <User size={16} />
                        Middle Name
                      </label>
                      <p className="view-employee-value">{employeeData.emp_middle || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <User size={16} />
                        Last Name
                      </label>
                      <p className="view-employee-value">{employeeData.emp_lname || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        Age
                      </label>
                      <p className="view-employee-value">{employeeData.emp_age || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        Gender
                      </label>
                      <p className="view-employee-value">{employeeData.emp_sex || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="view-employee-section">
                  <h3 className="view-employee-section-title">Contact Information</h3>
                  <div className="view-employee-form-grid">
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <p className="view-employee-value">{employeeData.emp_email || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <Phone size={16} />
                        Contact Number
                      </label>
                      <p className="view-employee-value">{employeeData.emp_contact || "N/A"}</p>
                    </div>
                    <div className="view-employee-field view-employee-field-full">
                      <label className="view-employee-label">
                        <MapPin size={16} />
                        Address
                      </label>
                      <p className="view-employee-value">{employeeData.emp_add || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="view-employee-section">
                  <h3 className="view-employee-section-title">Employment Information</h3>
                  <div className="view-employee-form-grid">
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <Calendar size={16} />
                        Hire Date
                      </label>
                      <p className="view-employee-value">{formatDate(employeeData.emp_hdate)}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <Briefcase size={16} />
                        Department
                      </label>
                      <p className="view-employee-value">{employeeData.emp_dept || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <Briefcase size={16} />
                        Position
                      </label>
                      <p className="view-employee-value">{employeeData.emp_position || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        Employee Type
                      </label>
                      <p className="view-employee-value">{employeeData.emp_type || "N/A"}</p>
                    </div>
                    <div className="view-employee-field">
                      <label className="view-employee-label">
                        <DollarSign size={16} />
                        Hourly Rate
                      </label>
                      <p className="view-employee-value">{formatCurrency(employeeData.hourly_rate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

