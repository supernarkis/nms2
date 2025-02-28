import React, { useEffect, useState } from 'react';

const Auth = () => {
  const [user, setUser] = useState(null);

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
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        credentials: 'include'
      });
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="user-info">
      <div className="user-details">
        <span className="username">{user.username}</span>
        <span className="email">{user.email}</span>
      </div>
      <button onClick={handleLogout} className="logout-button" title="Выйти">⇥</button>
    </div>
  );
};

export default Auth; 