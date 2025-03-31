// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Login from './components/Login';
import Register from './components/Register';
import TaxCalculator from './components/TaxCalculator';
import CalculationHistory from './components/CalculationHistory';
import Navbar from './components/Navbar';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      setIsAuthenticated(true);
      // Fetch user data
      getUserData();
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, []);

  const getUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const res = await axios.get(`/auth/user/${decoded.user.id}`);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <Router>
      <div className="App">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          user={user} 
          logout={logout} 
        />
        <ToastContainer />
        <div className="container">
          <Switch>
            <Route exact path="/" render={() => (
              <TaxCalculator isAuthenticated={isAuthenticated} />
            )} />
            <Route exact path="/login" render={() => (
              <Login 
                setIsAuthenticated={setIsAuthenticated} 
                setUser={setUser} 
              />
            )} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/history" render={() => (
              isAuthenticated ? (
                <CalculationHistory />
              ) : (
                <div className="auth-required">
                  <h2>Please login to view your calculation history</h2>
                  <Link to="/login" className="btn btn-primary">Login</Link>
                </div>
              )
            )} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;