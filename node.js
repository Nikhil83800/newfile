// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/taxcalculator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Models
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
}));

const TaxCalculation = mongoose.model('TaxCalculation', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  financialYear: String,
  ageGroup: String,
  regime: String,
  income: Number,
  hraExempt: Number,
  deductions: Object,
  investments: Object,
  result: Object,
  createdAt: { type: Date, default: Date.now }
}));

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};

// Routes

// User Registration
app.post('/api/auth/register', [
  body('name').not().isEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// User Login
app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Tax Calculation Endpoint
app.post('/api/tax/calculate', auth, async (req, res) => {
  const {
    financialYear,
    ageGroup,
    regime,
    income,
    hraExempt,
    deductions,
    investments
  } = req.body;

  try {
    // Perform tax calculation
    const result = calculateTax({
      financialYear,
      ageGroup,
      regime,
      income,
      hraExempt,
      deductions,
      investments
    });

    // Save calculation if user is authenticated
    if (req.user) {
      const calculation = new TaxCalculation({
        userId: req.user.id,
        financialYear,
        ageGroup,
        regime,
        income,
        hraExempt,
        deductions,
        investments,
        result
      });
      await calculation.save();
    }

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get User's Calculation History
app.get('/api/tax/history', auth, async (req, res) => {
  try {
    const calculations = await TaxCalculation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(calculations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Tax Calculation Logic
function calculateTax(data) {
  const { financialYear, ageGroup, regime, income, hraExempt, deductions, investments } = data;
  
  // Calculate total deductions under old regime
  const total80cDeductions = Math.min(
    (deductions.section80c || 0) + 
    (investments.ppf || 0) + 
    (investments.elss || 0) + 
    (investments.fd || 0) + 
    (investments.homeLoan || 0), 
    150000
  );
  
  const totalDeductions = total80cDeductions + 
    (deductions.section80d || 0) + 
    (deductions.section80e || 0) + 
    (deductions.section80g || 0) + 
    (deductions.otherDeductions || 0);
  
  // Additional NPS deduction (Section 80CCD(1B))
  const npsAdditionalDeduction = Math.min(investments.nps || 0, 50000);
  const totalDeductionsWithNPS = totalDeductions + npsAdditionalDeduction;
  
  // Calculate taxable income based on regime
  let taxableIncome, tax, cess, totalTax;
  
  if (regime === 'old') {
    // Old regime calculation
    taxableIncome = income - (hraExempt || 0) - totalDeductionsWithNPS;
    tax = calculateOldRegimeTax(taxableIncome, ageGroup);
  } else {
    // New regime calculation
    taxableIncome = income - (hraExempt || 0) - 50000; // Standard deduction
    tax = calculateNewRegimeTax(taxableIncome);
  }
  
  // Calculate health and education cess (4%)
  cess = tax * 0.04;
  totalTax = tax + cess;
  
  // Calculate effective tax rate
  const effectiveTaxRate = (totalTax / income) * 100;
  
  return {
    income,
    taxableIncome,
    tax,
    cess,
    totalTax,
    effectiveTaxRate,
    regime,
    deductions: totalDeductionsWithNPS
  };
}

function calculateOldRegimeTax(income, ageGroup) {
  let tax = 0;
  
  // Determine basic exemption limit based on age
  let exemptionLimit;
  if (ageGroup === 'below-60') {
    exemptionLimit = 250000;
  } else if (ageGroup === '60-80') {
    exemptionLimit = 300000;
  } else { // above-80
    exemptionLimit = 500000;
  }
  
  if (income <= exemptionLimit) {
    return 0;
  }
  
  // Calculate tax based on slabs
  const taxableIncome = income - exemptionLimit;
  
  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = 12500 + (taxableIncome - 500000) * 0.2;
  } else {
    tax = 112500 + (taxableIncome - 1000000) * 0.3;
  }
  
  // Rebate under section 87A (if applicable)
  if (taxableIncome <= 500000) {
    tax = Math.max(tax - 12500, 0);
  }
  
  return tax;
}

function calculateNewRegimeTax(income) {
  let tax = 0;
  
  if (income <= 300000) {
    tax = 0;
  } else if (income <= 600000) {
    tax = (income - 300000) * 0.05;
  } else if (income <= 900000) {
    tax = 15000 + (income - 600000) * 0.1;
  } else if (income <= 1200000) {
    tax = 45000 + (income - 900000) * 0.15;
  } else if (income <= 1500000) {
    tax = 90000 + (income - 1200000) * 0.2;
  } else {
    tax = 150000 + (income - 1500000) * 0.3;
  }
  
  // Rebate under section 87A for new regime (if applicable)
  if (income <= 700000) {
    tax = Math.max(tax - 25000, 0);
  }
  
  return tax;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));