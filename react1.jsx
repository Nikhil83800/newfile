// src/components/TaxCalculator.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TaxCalculator = ({ isAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [regime, setRegime] = useState('new');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    financialYear: '2023-24',
    ageGroup: 'below-60',
    income: '',
    hraExempt: '',
    deductions: {
      section80c: '',
      section80d: '',
      section80e: '',
      section80g: '',
      otherDeductions: ''
    },
    investments: {
      ppf: '',
      elss: '',
      nps: '',
      fd: '',
      homeLoan: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      deductions: {
        ...formData.deductions,
        [name]: value
      }
    });
  };

  const handleInvestmentChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      investments: {
        ...formData.investments,
        [name]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/tax/calculate', {
        ...formData,
        regime
      });

      setResult(res.data);
      toast.success('Tax calculated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error calculating tax. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegimeToggle = (selectedRegime) => {
    setRegime(selectedRegime);
  };

  return (
    <div className="tax-calculator">
      <h1>Income Tax Calculator</h1>
      <p>Calculate your income tax liability for FY 2023-24 (AY 2024-25)</p>

      <div className="regime-toggle">
        <button
          className={`regime-option ${regime === 'new' ? 'active' : ''}`}
          onClick={() => handleRegimeToggle('new')}
        >
          New Tax Regime
        </button>
        <button
          className={`regime-option ${regime === 'old' ? 'active' : ''}`}
          onClick={() => handleRegimeToggle('old')}
        >
          Old Tax Regime
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Details
        </button>
        <button
          className={`tab ${activeTab === 'deductions' ? 'active' : ''}`}
          onClick={() => setActiveTab('deductions')}
        >
          Deductions
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          Investments
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="tab-content active">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-group">
                <label htmlFor="financial-year">Financial Year</label>
                <select
                  id="financial-year"
                  name="financialYear"
                  value={formData.financialYear}
                  onChange={handleChange}
                >
                  <option value="2023-24">2023-24 (Assessment Year 2024-25)</option>
                  <option value="2024-25">2024-25 (Assessment Year 2025-26)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="age-group">Age Group</label>
                <select
                  id="age-group"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleChange}
                >
                  <option value="below-60">Below 60 years</option>
                  <option value="60-80">60 to 80 years (Senior Citizen)</option>
                  <option value="above-80">Above 80 years (Super Senior Citizen)</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Income Details</h3>
              <div className="form-group">
                <label htmlFor="income">Annual Income (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="income"
                    name="income"
                    placeholder="Enter your annual income"
                    value={formData.income}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="hra-exempt">HRA Exemption (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="hra-exempt"
                    name="hraExempt"
                    placeholder="Enter HRA exemption amount"
                    value={formData.hraExempt}
                    onChange={handleChange}
                  />
                </div>
                <p className="info-text">Only applicable if you're receiving HRA from your employer</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deductions' && (
          <div className="tab-content active">
            <div className="form-section">
              <h3>Deductions</h3>
              <div className="form-group">
                <label htmlFor="section80c">Section 80C (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="section80c"
                    name="section80c"
                    placeholder="Max ₹1,50,000"
                    value={formData.deductions.section80c}
                    onChange={handleDeductionChange}
                  />
                </div>
                <p className="info-text">Investments in PPF, ELSS, Life Insurance, etc.</p>
              </div>
              <div className="form-group">
                <label htmlFor="section80d">Section 80D - Medical Insurance (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="section80d"
                    name="section80d"
                    placeholder="Max ₹75,000"
                    value={formData.deductions.section80d}
                    onChange={handleDeductionChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="section80e">Section 80E - Education Loan Interest (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="section80e"
                    name="section80e"
                    placeholder="Enter amount"
                    value={formData.deductions.section80e}
                    onChange={handleDeductionChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="other-deductions">Other Deductions (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="other-deductions"
                    name="otherDeductions"
                    placeholder="Enter other deductions"
                    value={formData.deductions.otherDeductions}
                    onChange={handleDeductionChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="tab-content active">
            <div className="form-section">
              <h3>Investments</h3>
              <div className="form-group">
                <label htmlFor="ppf">Public Provident Fund (PPF) (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="ppf"
                    name="ppf"
                    placeholder="Enter PPF investment"
                    value={formData.investments.ppf}
                    onChange={handleInvestmentChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="elss">ELSS Mutual Funds (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="elss"
                    name="elss"
                    placeholder="Enter ELSS investment"
                    value={formData.investments.elss}
                    onChange={handleInvestmentChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="nps">National Pension System (NPS) (₹)</label>
                <div className="input-with-icon">
                  <span className="icon">₹</span>
                  <input
                    type="number"
                    id="nps"
                    name="nps"
                    placeholder="Enter NPS investment"
                    value={formData.investments.nps}
                    onChange={handleInvestmentChange}
                  />
                </div>
                <p className="info-text">Additional ₹50,000 deduction available under Section 80CCD(1B)</p>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Tax'}
        </button>
      </form>

      {result && (
        <div className="results">
          <h2>Tax Calculation Summary</h2>
          <div className="summary">
            <div className="summary-item">
              <span className="label">Annual Income</span>
              <span className="value">₹{result.income.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Deductions</span>
              <span className="value">₹{result.deductions.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Taxable Income</span>
              <span className="value">₹{result.taxableIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Income Tax ({regime === 'old' ? 'Old' : 'New'} Regime)</span>
              <span className="value">₹{result.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Health & Education Cess (4%)</span>
              <span className="value">₹{result.cess.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="total-tax">
            <div className="summary-item">
              <span className="label">Total Tax Liability</span>
              <span className="value">₹{result.totalTax.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="tax-breakup">
            <h3>Tax Breakup</h3>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Annual Income</td>
                  <td>₹{result.income.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>{regime === 'old' ? 'Total Deductions' : 'Standard Deduction'}</td>
                  <td>₹{regime === 'old' ? result.deductions.toLocaleString('en-IN') : '50,000'}</td>
                </tr>
                <tr>
                  <td>Taxable Income</td>
                  <td>₹{result.taxableIncome.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Income Tax</td>
                  <td>₹{result.tax.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Cess (4%)</td>
                  <td>₹{result.cess.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="highlight">
                  <td>Total Tax Payable</td>
                  <td>₹{result.totalTax.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="suggestions">
            <h3>Tax Saving Suggestions</h3>
            <ul>
              {regime === 'old' && result.deductions < 150000 && result.income > 500000 && (
                <li>You can invest more in tax-saving instruments under Section 80C to maximize deductions (up to ₹1,50,000).</li>
              )}
              {regime === 'old' && result.income > 1000000 && (
                <li>Consider tax-efficient investments like ELSS or NPS which offer additional deductions beyond 80C.</li>
              )}
              {regime === 'new' && result.income < 750000 && (
                <li>With income below ₹7.5 lakhs, you may be eligible for full tax rebate under the new regime.</li>
              )}
              {regime === 'new' && result.income > 1500000 && result.deductions > 200000 && (
                <li>Your deductions are substantial. Compare with old regime as it might be more beneficial.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;