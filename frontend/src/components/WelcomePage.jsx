import React from 'react';

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <div className="text-content">
          <h1>Заметки</h1>
          <p>
            Простое и удобное приложение для создания и хранения заметок.
            Авторизуйтесь через Google, чтобы начать работу.
          </p>
        </div>
        <a href="/api/auth/login" className="google-login-button">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="Google"
            className="google-icon"
          />
          Войти через Google
        </a>
      </div>
    </div>
  );
};

export default WelcomePage; 