import { NavLink, useLocation } from 'react-router-dom';
import React, { forwardRef, useState, useEffect } from 'react';
import { Cn } from "../utils/cn.js";
import SugboWorks from "../assets/Logo.png";
import PropTypes from 'prop-types';
import { employeeNavbarLink } from '../constants/index.jsx';
import * as Avatar from "@radix-ui/react-avatar";
import { supabase } from "../services/supabase-client";



export const SidebarEmployee = forwardRef(({ collapsed }, ref) => {
    const location = useLocation();
    const [empId, setEmpId] = useState(null);
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
      const checkEmpId = async () => {
        const session = localStorage.getItem("userSession");
        if (session) {
          const user = JSON.parse(session);
          setEmpId(user.emp_id);
          
          // Fetch employee data if emp_id exists
          if (user.emp_id) {
            try {
              const { data, error } = await supabase
                .from("employee")
                .select("emp_fname, emp_middle, emp_lname, profile_picture")
                .eq("emp_id", user.emp_id)
                .single();
              
              if (!error && data) {
                setEmployeeData(data);
              }
            } catch (error) {
              // Error fetching employee data
            }
          } else {
            setEmployeeData(null);
          }
        }
      };
      
      checkEmpId();
      
      // Listen for storage changes to update when emp_id is bound
      const handleStorageChange = () => {
        checkEmpId();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for local changes
      const interval = setInterval(() => {
        checkEmpId();
      }, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }, []);

    const isLinkDisabled = (path) => {
      // Dashboard is always accessible, but other links require emp_id
      if (path === "/dashboard-employee") return false;
      return !empId;
    };

    return (  
      <aside ref={ref} 
      className={Cn("fixed top-0 bottom-0 z-[50] flex h-full w-[250px] flex-col overflow-x-hidden border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,0,0.2,1),left_300ms_cubic-bezier(0.4,0,0.2,1),background-color_150ms_cubic-bezier(0.4,0,0.2,1),border_150ms_cubic-bezier(0.4,0,0.2,1)] dark:border-slate-700 dark:bg-slate-800",
      collapsed ? "md:w-[70px] md:items-center" : "md:w-[250px]",
       collapsed ? "max-md:-left-full" :  "max-md:left-0",
      )} 
      style={{ display: "flex", flexDirection: "column" }}
      >
            <div className="flex gap-x-1 align-items" style={{ paddingLeft: collapsed ? "0px" : "0.5rem", paddingTop: "0.5rem", alignItems: "center"}}>
              
              <img src={SugboWorks} alt="Logo" className='w-16 h-16 pt-2 dark:hidden' style={{ verticalAlign: 'middle' }}/>
              <img src={SugboWorks} alt="Logo" className='w-16 h-16 pt-2 hidden dark:block' style={{ verticalAlign: 'middle' }}/>

              
              {!collapsed && (
                    <p style={{paddingBottom: "5px"}} className="text-lg font-medium text-slate-900 transition-colors dark:text-slate-50 mt-2">
                      SugboWorks
                    </p>
              )}
            </div>

          <div style={{marginTop: "2rem"}}  className='flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin]'>
                 {employeeNavbarLink.map((navbarLink) => (
                        <nav 
                          key={navbarLink.title}
                          className={Cn("sidebar-group",
                            collapsed && "md:items-center", collapsed && "md:items-center"

                          )}
                           style={{paddingLeft: collapsed ? "0rem" : "1rem", paddingRight: collapsed ? "0rem" : "1rem"}}                             
                        >

                          <p className={Cn("sidebar-group-title", collapsed && "md:w-[45px] ")}>{navbarLink.title}</p>
                          {navbarLink.links.map((links) => {
                            const disabled = isLinkDisabled(links.path);
                            return (
                              <NavLink
                                key={links.label}
                                to={disabled ? "#" : links.path}
                                end={links.path === "/dashboard-employee"}
                                onClick={(e) => {
                                  if (disabled) {
                                    e.preventDefault();
                                  }
                                }}
                                className={({ isActive }) => Cn(
                                  "sidebar-item", 
                                  collapsed && "md:w-[45px]",
                                  disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                                  isActive && !disabled && "active"
                                )}
                                style={{
                                  paddingLeft: collapsed ? ".7rem" : ".5rem", 
                                  paddingRight: "0rem"
                                }}  
                              >
                                <links.icon
                                  size={22}
                                  className="flex-shrink-0" 
                                />
                                {!collapsed && <p className='whitespace-nowrap'>{links.label}</p>}
                              </NavLink>
                            );
                          })}

                        </nav>
                 ))}
          </div>

          {/* Employee Profile Section */}
          {!collapsed && empId && employeeData && (
            <div className="sidebar-employee-profile" style={{
              marginTop: "auto",
              padding: "1.25rem 1rem",
              borderTop: "1px solid #334155",
              background: "linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <div style={{
                position: "relative",
                display: "inline-block"
              }}>
                <Avatar.Root className={Cn(
                  "inline-flex items-center justify-center align-middle overflow-hidden select-none w-16 h-16 rounded-full",
                  "border-[3px] border-blue-500 shadow-lg shadow-blue-500/30",
                  "bg-gradient-to-br from-blue-500 to-blue-600"
                )}>
                  <Avatar.Image
                    src={employeeData.profile_picture || ""}
                    alt={`${employeeData.emp_fname} ${employeeData.emp_lname}`}
                    className="w-full h-full object-cover rounded-inherit"
                  />
                  <Avatar.Fallback className={Cn(
                    "w-full h-full flex items-center justify-center",
                    "bg-gradient-to-br from-blue-500 to-blue-600",
                    "text-white text-2xl font-bold tracking-wider"
                  )}>
                    {`${employeeData.emp_fname?.[0] || ""}${employeeData.emp_lname?.[0] || ""}`.toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className={Cn(
                  "absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full",
                  "bg-green-500 border-2 border-slate-800",
                  "shadow-md"
                )} />
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                width: "100%"
              }}>
                <p style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  textAlign: "center",
                  margin: 0,
                  lineHeight: "1.3",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {`${employeeData.emp_fname || ""} ${employeeData.emp_middle || ""} ${employeeData.emp_lname || ""}`.trim()}
                </p>
                <p style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: "#94a3b8",
                  textAlign: "center",
                  margin: 0
                }}>
                  Employee
                </p>
              </div>
            </div>
          )}
      </aside>
    );
      

      });
SidebarEmployee.displayName = "SidebarEmployee";

SidebarEmployee.propTypes = {
  collapsed: PropTypes.bool,
};

