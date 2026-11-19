import React, { useState } from "react";
import "./Register.css";
import user_icon from "../assets/person.png";
import email_icon from "../assets/email.png";
import password_icon from "../assets/password.png";
import close_icon from "../assets/close.png";
import DemoBanner from "../../demo/DemoBanner";
import { pageUrl } from "../../links";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");

  const gohome = () => {
    window.location.href = pageUrl("/");
  };

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
        gohome();
      } else if (json.error === "Already Registered") {
        setMessage("That username is taken. Try another one, or log in.");
      } else {
        setMessage(json.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setMessage("The server can't be reached right now. Please try again later.");
    }
  };

  return (
    <>
    <DemoBanner />
    <div className="register_container" style={{ width: "50%" }}>
      <div className="header" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        <span className="text" style={{ flexGrow: "1" }}>Sign Up</span>
        <div style={{ display: "flex", flexDirection: "row", justifySelf: "end", alignSelf: "start" }}>
          <a href={pageUrl("/")} onClick={(e) => { e.preventDefault(); gohome(); }} style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <img style={{ width: "1cm" }} src={close_icon} alt="Close" />
          </a>
        </div>
        <hr />
      </div>

      <form onSubmit={register}>
        <div className="inputs">
          <div className="input">
            <img src={user_icon} className="img_icon" alt="" />
            <input type="text" name="username" placeholder="Username" aria-label="Username" className="input_field" autoComplete="username" onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="input">
            <img src={user_icon} className="img_icon" alt="" />
            <input type="text" name="first_name" placeholder="First Name" aria-label="First name" className="input_field" autoComplete="given-name" onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="input">
            <img src={user_icon} className="img_icon" alt="" />
            <input type="text" name="last_name" placeholder="Last Name" aria-label="Last name" className="input_field" autoComplete="family-name" onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="input">
            <img src={email_icon} className="img_icon" alt="" />
            <input type="email" name="email" placeholder="Email" aria-label="Email" className="input_field" autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="input">
            <img src={password_icon} className="img_icon" alt="" />
            <input name="psw" type="password" placeholder="Password" aria-label="Password" className="input_field" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        {message && <p role="alert" style={{ textAlign: "center", color: "white", fontWeight: "bold" }}>{message}</p>}
        <div className="submit_panel">
          <input className="submit" type="submit" value="Register" />
        </div>
      </form>
    </div>
    </>
  );
};

export default Register;
