// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png";

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);
  const [error, setError] = useState("");

  const loadDealers = async (url) => {
    try {
      const res = await fetch(url, { method: "GET" });
      const retobj = await res.json();
      if (retobj.status === 200) {
        setError("");
        return Array.from(retobj.dealers);
      }
      setError(retobj.message || "The dealers could not be loaded.");
    } catch (e) {
      setError("The dealers could not be loaded.");
    }
    return null;
  };

  // "All" asks Django for every dealer; any other value filters by state
  const filterDealers = async (state) => {
    const dealers = await loadDealers("/djangoapp/get_dealers/" + encodeURIComponent(state));
    if (dealers) setDealersList(dealers);
  };

  useEffect(() => {
    const getDealers = async () => {
      const dealers = await loadDealers("/djangoapp/get_dealers");
      if (dealers) {
        setStates([...new Set(dealers.map((dealer) => dealer.state))].sort());
        setDealersList(dealers);
      }
    };
    getDealers();
  }, []);

  const isLoggedIn = sessionStorage.getItem("username") != null;

  return (
    <div>
      <Header />
      {error && <p role="alert" style={{ margin: "20px", color: "darkred" }}>{error}</p>}
      <table className='table'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <select name="state" id="state" aria-label="Filter by state" defaultValue="" onChange={(e) => filterDealers(e.target.value)}>
                <option value="" disabled hidden>State</option>
                <option value="All">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </th>
            {isLoggedIn ? <th>Review Dealer</th> : null}
          </tr>
        </thead>
        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer.id}</td>
              <td><a href={'/dealer/' + dealer.id}>{dealer.full_name}</a></td>
              <td>{dealer.city}</td>
              <td>{dealer.address}</td>
              <td>{dealer.zip}</td>
              <td>{dealer.state}</td>
              {isLoggedIn ? (
                <td><a href={`/postreview/${dealer.id}`}><img src={review_icon} className="review_icon" alt="Post Review" /></a></td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers;
