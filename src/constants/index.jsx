import { Home, Users, Clock, Calendar, DollarSign, Settings, FileText, ShieldCheck } from 'lucide-react';

export const navbarLink = [
  {
    title: "Overview",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/human-resources/dashboard",
      },
    ],
  },
  {
    title: "Profiling",
    links: [
      {
        label: "Employee Management",
        icon: Users,
        path: "/human-resources/employee-management",
      },
    ],
  },
  {
    title: "Timekeeping",
    links: [
      {
        label: "Daily Time Records",
        icon: Clock,
        path: "/human-resources/time-keeping",
      },
      {
        label: "Leave Requests",
        icon: Calendar,
        path: "/human-resources/leave-requests",
      },
    ],
  },
  {
    title: "Payroll Processing",
    links: [
      {
        label: "Payroll Processing",
        icon: DollarSign,
        path: "/human-resources/payroll-processing",
      },
    ],
  },
  {
    title: "Compliance",
    links: [
      {
        label: "Gov Contributions",
        icon: ShieldCheck,
        path: "/human-resources/government-contributions",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Account Settings",
        icon: Settings,
        path: "/human-resources/account-settings",
      },
    ],
  },
];

export const employeeNavbarLink = [
  {
    title: "Overview",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/dashboard-employee",
      },
    ],
  },
  {
    title: "Records",
    links: [
      {
        label: "Payslip Records",
        icon: FileText,
        path: "/dashboard-employee/payslip-records",
      },
      {
        label: "Daily Time Records",
        icon: Clock,
        path: "/dashboard-employee/daily-time-records",
      },
    ],
  },
  {
    title: "Leave",
    links: [
      {
        label: "Request Leave",
        icon: Calendar,
        path: "/dashboard-employee/request-leave",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Account Settings",
        icon: Settings,
        path: "/dashboard-employee/account-settings",
      },
    ],
  },
];
