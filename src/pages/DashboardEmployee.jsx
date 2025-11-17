import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardEmployee = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Employee Dashboard</h1>
      <p>Welcome to your Employee Portal</p>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardEmployee;
