
import { Users, Clock, UserPlus, Calendar, DollarSign, BarChart3 } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Users,
      title: "Employee Information Management",
      description: "Streamline onboarding, profiles, and team organization with intuitive tools."
    },
    {
      icon: Clock,
      title: "Attendance & Timekeeping",
      description: "Monitor time-ins, leaves, and shifts with accurate, real-time reporting."
    },
    {
      icon: UserPlus,
      title: "Recruitment Management System",
      description: "Efficiently manage job postings, applications, and hiring processes."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Handle leave requests, approvals, and balances seamlessly."
    },
    {
      icon: DollarSign,
      title: "Payroll Processing",
      description: "Automate salary calculations, deductions, and compliant payments effortlessly."
    },
    {
      icon: BarChart3,
      title: "Reports and Analytics",
      description: "Generate insightful reports and analytics for better decision-making."
    }
  ];

  return (
    <section id="services" className="services-section" aria-labelledby="services-title">
      <div className="container">
        <h2 id="services-title" className="section-title">Our Services</h2>
        <p className="section-subtitle">Comprehensive HR solutions for modern businesses</p>
        <div className="services-grid" role="list">
          {services.map((service, index) => (
            <article key={index} className="service-card" role="listitem">
              <div className="service-icon-wrapper">
                <service.icon size={32} className="service-icon" aria-hidden="true" />
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services;
