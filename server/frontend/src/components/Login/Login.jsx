// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState } from 'react';
import Header from '../Header/Header';
import { pageUrl } from '../../links';

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(window.location.origin + "/djangoapp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userName, password: password }),
      });
      const json = await res.json();
      if (json.status === "Authenticated") {
        sessionStorage.setItem('username', json.userName);
        window.location.href = pageUrl("/");
      } else {
        setMessage("The username or password is not correct.");
      }
    } catch (error) {
      setMessage("The server can't be reached right now. Please try again later.");
    }
  };

  return (
    <div>
      <Header />
      <main className="page narrow">
        <h1 className="page-title">Log in</h1>
        <form className="form-card" onSubmit={login}>
          <div>
            <label className="field-label" htmlFor="username">Username</label>
            <input id="username" name="username" className="input" autoComplete="username" onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" name="psw" type="password" className="input" autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
          </div>
          {message && <p role="alert" className="alert">{message}</p>}
          <button className="button" type="submit">Log in</button>
          <p className="form-note">New here? <a href={pageUrl("/register")}>Create an account</a></p>
        </form>
      </main>
    </div>
  );
};

export default Login;
