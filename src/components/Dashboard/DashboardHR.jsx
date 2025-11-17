import React, { useState, useEffect } from "react";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Users, Calendar, Clock, DollarSign } from "lucide-react";
import { supabase } from "../../services/supabase-client";

export const DashboardHR = () => {
  const [kpiData, setKpiData] = useState({
    totalEmployees: 0,
    activeLeaves: 0,
    pendingRequests: 0,
    totalPayroll: 0,
  });
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    fetchKPIData();
    fetchRecentEmployees();
  }, []);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from("employee")
        .select("*", { count: "exact", head: true });

      // Fetch active leaves (approved leave requests that are currently active)
      const today = new Date().toISOString().split("T")[0];
      const { data: activeLeavesData } = await supabase
        .from("leavereq_table")
        .select("leave_des, leave_status")
        .eq("leave_status", "Approved");
      
      // Parse leave descriptions to check if dates are active
      let activeLeavesCount = 0;
      if (activeLeavesData) {
        activeLeavesCount = activeLeavesData.filter((leave) => {
          const desc = leave.leave_des || "";
          const startMatch = desc.match(/Start Date: ([^,]+)/);
          const endMatch = desc.match(/End Date: ([^.]+)/);
          if (startMatch && endMatch) {
            const startDate = new Date(startMatch[1].trim());
            const endDate = new Date(endMatch[1].trim());
            const todayDate = new Date(today);
            return startDate <= todayDate && endDate >= todayDate;
          }
          return false;
        }).length;
      }

      // Fetch pending requests
      const { count: pendingCount } = await supabase
        .from("leavereq_table")
        .select("*", { count: "exact", head: true })
        .eq("leave_status", "Pending");

      // Fetch total payroll (sum of net_pay from payslip_reports)
      const { data: payrollData } = await supabase
        .from("payslip_reports")
        .select("net_pay");

      const totalPayroll = payrollData?.reduce((sum, report) => {
        return sum + (parseFloat(report.net_pay) || 0);
      }, 0) || 0;

      setKpiData({
        totalEmployees: employeeCount || 0,
        activeLeaves: activeLeavesCount || 0,
        pendingRequests: pendingCount || 0,
        totalPayroll: totalPayroll,
      });
    } catch (error) {
      // Error fetching KPI data
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employee")
        .select("emp_fname, emp_middle, emp_lname, emp_email")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      const formattedTeam = (data || []).map(emp => ({
        name: `${emp.emp_fname || ""} ${emp.emp_middle || ""} ${emp.emp_lname || ""}`.trim(),
        email: emp.emp_email || "No email",
      }));
      
      setTeam(formattedTeam);
    } catch (error) {
      // Error fetching employees
    }
  };


  const containerStyle = {
    position: "relative",
    width: "100%",
    backgroundColor: "#1f1f2b",
    color: "#f5f5f5",
    borderRadius: "12px",
    padding: "clamp(16px, 4vw, 24px)",
    fontFamily: "system-ui, sans-serif",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  };

  const dashboardContainer = {
    width: "100%",
    maxWidth: "1300px",
    margin: "40px auto 24px",
    padding: "0 clamp(16px, 4vw, 24px)",
  };

const cardWrapper = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "clamp(16px, 3vw, 20px)",
  marginBottom: "24px",
};

// 👇 Bigger card style
const cardStyle = {
  backgroundColor: "#2b2b3b",
  borderRadius: "12px",
  padding: "clamp(20px, 4vw, 36px) clamp(16px, 3vw, 30px)",
  minHeight: "160px",
  height: "auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
};


  const inputRow = {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const inputStyle = {
    flex: 1,
    border: "none",
    outline: "none",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "14px",
    color: "#f5f5f5",
    backgroundColor: "#2b2b3b",
  };

  const buttonStyle = {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const memberCard = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2b2b3b",
    borderRadius: "6px",
    padding: "clamp(8px, 2vw, 12px)",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "8px",
  };

  const memberInfo = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const avatarStyle = {
    display: "inline-flex",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#3a3a4d",
  };

  const nameStyle = {
    color: "#60a5fa",
    fontWeight: 500,
    fontSize: "clamp(12px, 1.8vw, 14px)",
    marginBottom: "2px",
    cursor: "pointer",
    wordBreak: "break-word",
  };

  const emailStyle = {
    color: "#aaa",
    fontSize: "clamp(11px, 1.6vw, 13px)",
    wordBreak: "break-word",
  };

  const moreButton = {
    color: "#aaa",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px",
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const kpiCards = [
    {
      title: "Total Employees",
      value: loading ? "..." : kpiData.totalEmployees.toString(),
      icon: Users,
      color: "#3b82f6",
    },
    {
      title: "Active Leaves",
      value: loading ? "..." : kpiData.activeLeaves.toString(),
      icon: Calendar,
      color: "#10b981",
    },
    {
      title: "Pending Requests",
      value: loading ? "..." : kpiData.pendingRequests.toString(),
      icon: Clock,
      color: "#f59e0b",
    },
    {
      title: "Total Payroll",
      value: loading ? "..." : formatCurrency(kpiData.totalPayroll),
      icon: DollarSign,
      color: "#8b5cf6",
    },
  ];

  return (
    <div style={dashboardContainer}>
      {/* KPI Cards Section */}
      <div style={cardWrapper}>
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              style={{
                ...cardStyle,
                borderLeft: `4px solid ${card.color}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div
                  style={{
                    backgroundColor: card.color,
                    borderRadius: "8px",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={24} color="white" />
                </div>
                <h3
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    color: "#aaa",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {card.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: 700,
                  color: "#f5f5f5",
                  margin: 0,
                }}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Employees Section */}
      <div style={containerStyle}>
        <h2 style={{ fontSize: "clamp(16px, 2.5vw, 18px)", fontWeight: 600, marginBottom: "4px" }}>Employees</h2>
        <p style={{ fontSize: "clamp(12px, 1.8vw, 13px)", color: "#aaa", marginBottom: "16px" }}>
          Invite new employees to the company.
        </p>

        <div style={inputRow}>
          <input type="email" placeholder="Email address" style={inputStyle} />
          <button style={buttonStyle}>Invite</button>
        </div>

        {team.map((member) => (
          <div key={member.email} style={memberCard}>
            <div style={memberInfo}>
              <Avatar.Root style={avatarStyle}>
                <Avatar.Image
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
                    member.name
                  )}`}
                  alt={member.name}
                />
                <Avatar.Fallback
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    color: "#ccc",
                    fontSize: "13px",
                  }}
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar.Fallback>
              </Avatar.Root>

              <div>
                <div style={nameStyle}>{member.name}</div>
                <div style={emailStyle}>{member.email}</div>
              </div>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button style={moreButton}>⋮</button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                style={{
                  backgroundColor: "#2b2b3b",
                  borderRadius: "6px",
                  padding: "4px",
                  fontSize: "13px",
                  color: "#f5f5f5",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
                align="end"
              >
                <DropdownMenu.Item
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  View Profile
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "#f87171",
                  }}
                >
                  Remove
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHR;
