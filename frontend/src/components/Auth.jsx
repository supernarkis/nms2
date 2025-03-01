import React, { useEffect } from 'react';

const Auth = ({ onLogin }) => {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  return null;
};

export default Auth; 