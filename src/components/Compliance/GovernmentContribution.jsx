import React, { useState } from "react";
import "../../styles/Compliance.css";

const agencies = [
  {
    name: "SSS",
    description: "Social Security System monthly contribution guide.",
    employeeLabel: "Employee Share (%)",
    employerLabel: "Employer Share (%)",
  },
  {
    name: "PhilHealth",
    description: "Premium rates for PhilHealth remittances.",
    employeeLabel: "Employee Share (%)",
    employerLabel: "Employer Share (%)",
  },
  {
    name: "Pag-IBIG",
    description: "Home Development Mutual Fund contribution matrix.",
    employeeLabel: "Employee Share (%)",
    employerLabel: "Employer Share (%)",
  },
];

const GovernmentContribution = () => {
  const [contributions, setContributions] = useState(
    agencies.map((agency) => ({
      ...agency,
      employeeShare: "",
      employerShare: "",
      remarks: "",
    }))
  );

  const handleInputChange = (index, field, value) => {
    setContributions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSave = () => {
    // Placeholder hook for future integration
  };

  return (
    <div className="compliance-container">
      <div className="compliance-page-header">
        <div>
          <h1>Government Contributions</h1>
          <p>
            Maintain the contribution presets for SSS, PhilHealth, and Pag-IBIG so the payroll team
            can reference them while processing employee records.
          </p>
        </div>
      </div>

      <div className="compliance-grid">
        {contributions.map((agency, index) => (
          <div key={agency.name} className="compliance-card">
            <div className="compliance-card-header">
              <div>
                <h2>{agency.name}</h2>
                <p>{agency.description}</p>
              </div>
            </div>
            <form className="compliance-form">
              <label>
                {agency.employeeLabel}
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={agency.employeeShare}
                  onChange={(e) => handleInputChange(index, "employeeShare", e.target.value)}
                />
              </label>
              <label>
                {agency.employerLabel}
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={agency.employerShare}
                  onChange={(e) => handleInputChange(index, "employerShare", e.target.value)}
                />
              </label>
              <label>
                Remarks
                <textarea
                  placeholder="Add computation notes..."
                  value={agency.remarks}
                  onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
                />
              </label>
              <button type="button" onClick={handleSave}>
                Save Updates
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GovernmentContribution;

