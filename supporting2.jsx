// src/components/CalculationHistory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const CalculationHistory = () => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const res = await axios.get('/tax/history');
        setCalculations(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch calculation history');
      } finally {
        setLoading(false);
      }
    };

    fetchCalculations();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="calculation-history">
      <h2>Your Calculation History</h2>
      {calculations.length === 0 ? (
        <p>No calculations found. Try calculating your tax first.</p>
      ) : (
        <div className="calculations-list">
          {calculations.map((calc) => (
            <div key={calc._id} className="calculation-card">
              <h3>
                {calc.financialYear} - {calc.regime === 'old' ? 'Old' : 'New'} Regime
              </h3>
              <p>Income: ₹{calc.income.toLocaleString('en-IN')}</p>
              <p>Tax Paid: ₹{calc.result.totalTax.toLocaleString('en-IN')}</p>
              <p>{new Date(calc.createdAt).toLocaleDateString()}</p>
              <Link 
                to={`/`} 
                className="btn btn-secondary"
                onClick={() => localStorage.setItem('lastCalculation', JSON.stringify(calc))}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalculationHistory;