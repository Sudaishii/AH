import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, SearchIcon, Sun, Moon, BellIcon, LogOut, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import { Cn } from "../utils/cn.js";
import { useTheme } from "../assets/hooks/use-theme.jsx";
import { useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import { supabase } from "../services/supabase-client";

export const Header = ({ collapsed, setCollapsed }) => {
  
  const {theme, effectiveTheme, setTheme} = useTheme();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        return JSON.parse(userSession);
      }
    } catch (error) {
      // Error parsing user session
    }
    return null;
  };

  const user = getUserInfo();

  // Fetch employee data if user has emp_id
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user && user.emp_id) {
        try {
          const { data, error } = await supabase
            .from("employee")
            .select("emp_fname, emp_middle, emp_lname, profile_picture")
            .eq("emp_id", user.emp_id)
            .single();

          if (error) throw error;
          setEmployeeData(data);
        } catch (error) {
          // Error fetching employee data
        }
      } else {
        setEmployeeData(null);
      }
    };

    fetchEmployeeData();

    // Listen for storage changes to update when emp_id is bound
    const handleStorageChange = () => {
      const updatedUser = getUserInfo();
      if (updatedUser && updatedUser.emp_id) {
        fetchEmployeeData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for local changes (since storage event doesn't fire for same tab)
    const interval = setInterval(() => {
      const updatedUser = getUserInfo();
      if (updatedUser?.emp_id !== user?.emp_id) {
        fetchEmployeeData();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const toggleTheme = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If theme is "system", switch to the opposite of current effective theme
    if (theme === "system") {
      const newTheme = effectiveTheme === "light" ? "dark" : "light";
      setTheme(newTheme);
    } else {
      // Toggle between light and dark
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
    }
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('userSession');
    setLogoutDialogOpen(false);
    navigate('/login');
  };

  return (
    <header
      className={Cn(
        "fixed top-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-md transition-all duration-300 dark:bg-slate-900",
        collapsed ? "md:left-[70px] left-0 md:w-[calc(100%-70px)] w-full" : "md:left-[250px] left-0 md:w-[calc(100%-250px)] w-full"
      )}
    >
      <div className="flex items-center gap-x-3" style={{paddingLeft: "1rem"}}>
           <button className="btn-ghost size=10" onClick={() => setCollapsed(!collapsed)}>
              <ChevronLeftIcon className={collapsed && "rotate-180"}/>
           </button>
           <div className="input">
              <SearchIcon size={20} style={{marginLeft: "0.5rem"}} className="text-slate-300"/>
              <input 
                type="text" 
                placeholder="Search... "
                name="search"
                id="search"
                className="w-full bg-transparent text-slate-900 outline-0 placeholder:text-slate-300 dark:text-slate-50"
                />

           </div>
      </div>
      <div className="flex items-center gap-x-3" style={{paddingRight: "1rem"}}>
            <button
              type="button"
              className="btn-ghost w-10 h-10 flex items-center justify-center cursor-pointer relative z-10 pointer-events-auto"
              onClick={toggleTheme}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Toggle theme"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
          <Sun
            size={20}
            className="dark:hidden pointer-events-none" 
          />

          <Moon 
            size={20}
            className="hidden dark:block pointer-events-none"
          />
        </button>
        <button className="btn-ghost size-10">
          <BellIcon size={20} />
        </button>
        
        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button 
              className="size-10 overflow-hidden rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="User menu"
            >
              <Avatar.Root className="size-full">
                <Avatar.Image
                  src={employeeData?.profile_picture || ""}
                  alt={employeeData ? `${employeeData.emp_fname} ${employeeData.emp_lname}` : "User Avatar"}
                  className="size-full object-cover"
                />
                <Avatar.Fallback className="size-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-sm">
                  {employeeData 
                    ? `${employeeData.emp_fname?.[0] || ""}${employeeData.emp_lname?.[0] || ""}`.toUpperCase()
                    : user?.user_email?.[0]?.toUpperCase() || "U"}
                </Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={Cn(
                "bg-white dark:bg-slate-800 rounded-lg shadow-lg z-50",
                "border border-slate-200 dark:border-slate-700",
                "transition-all duration-200 ease-in-out",
                "will-change-[transform,opacity]"
              )}
              style={{ minWidth: '280px', padding: '12px' }}
              sideOffset={5}
              align="end"
            >
              {/* User Info */}
              {user && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgb(226 232 240)', marginBottom: '8px' }} className="dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {employeeData 
                      ? `${employeeData.emp_fname || ""} ${employeeData.emp_middle || ""} ${employeeData.emp_lname || ""}`.trim() || 'User'
                      : user.user_email || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400" style={{ marginTop: '4px' }}>
                    {user.role_id === 1 ? 'HR Manager' : 'Employee'}
                    {employeeData && (
                      <span className="block mt-1 text-slate-400 dark:text-slate-500">
                        {user.user_email}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Logout Menu Item */}
              <DropdownMenu.Item
                className={Cn(
                  "flex items-center gap-2 text-sm rounded-md cursor-pointer",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-50 dark:hover:bg-red-950/20",
                  "focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/20",
                  "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
                )}
                style={{ padding: '12px 16px' }}
                onSelect={(e) => {
                  e.preventDefault();
                  handleLogoutClick();
                }}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 transition-opacity" />
          <Dialog.Content
            className={Cn(
              "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
              "bg-white dark:bg-slate-800 rounded-lg shadow-lg",
              "border border-slate-200 dark:border-slate-700",
              "transition-all"
            )}
            style={{ padding: '32px' }}
          >
            <div className="flex flex-col" style={{ gap: '24px' }}>
              <div className="flex items-center" style={{ gap: '20px' }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Confirm Logout
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-slate-600 dark:text-slate-400" style={{ marginTop: '8px' }}>
                    Are you sure you want to log out? You will need to sign in again to access your account.
                  </Dialog.Description>
                </div>
              </div>

              <div className="flex justify-end" style={{ gap: '12px', marginTop: '8px' }}>
                <Dialog.Close asChild>
                  <button
                    className={Cn(
                      "text-sm font-medium rounded-md",
                      "text-slate-700 dark:text-slate-300",
                      "bg-slate-100 dark:bg-slate-700",
                      "hover:bg-slate-200 dark:hover:bg-slate-600",
                      "transition-colors"
                    )}
                    style={{ padding: '.5rem' }}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleLogoutConfirm}
                  className={Cn(
                    "text-sm font-medium rounded-md",
                    "text-white bg-red-600 dark:bg-red-500",
                    "hover:bg-red-700 dark:hover:bg-red-600",
                    "transition-colors"
                  )}
                  style={{ padding: '.5rem' }}
                >
                  Log out
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
};

Header.propTypes = {
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
};