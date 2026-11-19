import React, { useState } from "react";
import Header from "../Header/Header";
import { pageUrl } from "../../links";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!userName.trim() || !password) {
      setMessage("Please enter a username and a password.");
      return;
    }

    try {
      const res = await fetch(window.location.origin + "/djangoapp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName.trim(),
          password: password,
          firstName: firstName,
          lastName: lastName,
          email: email,
        }),
      });
      const json = await res.json();

      if (json.status === "Authenticated") {
        sessionStorage.setItem("username", json.userName);
        sessionStorage.setItem("firstname", firstName);
        sessionStorage.setItem("lastname", lastName);
        window.location.href = pageUrl("/");
      } else if (json.error === "Already Registered") {
        setMessage("That username is taken. Try another one, or log in.");
      } else {
        setMessage(json.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setMessage("The server can't be reached right now. Please try again later.");
    }
  };

  const field = (id, label, type, autoComplete, onChange) => (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} className="input" autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  return (
    <div>
      <Header />
      <main className="page narrow">
        <h1 className="page-title">Create an account</h1>
        <p className="page-lead">With an account you can write reviews for any dealer.</p>
        <form className="form-card" onSubmit={register} noValidate>
          {field("username", "Username", "text", "username", setUserName)}
          <div className="field-row">
            {field("first_name", "First name", "text", "given-name", setFirstName)}
            {field("last_name", "Last name", "text", "family-name", setLastName)}
          </div>
          {field("email", "Email", "email", "email", setEmail)}
          {field("psw", "Password", "password", "new-password", setPassword)}
          {message && <p role="alert" className="alert">{message}</p>}
          <button className="button" type="submit">Create account</button>
          <p className="form-note">Already registered? <a href={pageUrl("/login")}>Log in</a></p>
        </form>
      </main>
    </div>
  );
};

export default Register;
