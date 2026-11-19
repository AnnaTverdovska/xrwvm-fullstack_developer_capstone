// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState, useEffect } from 'react';
import "./DealerList.css";
import Header from '../Header/Header';
import { pageUrl } from '../../links';

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("All");
  const [loading, setLoading] = useState(true);
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
    setSelectedState(state);
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
      setLoading(false);
    };
    getDealers();
  }, []);

  const isLoggedIn = sessionStorage.getItem("username") != null;
  const count = dealersList.length;
  const summary = selectedState === "All"
    ? `${count} dealers in ${states.length} states`
    : `${count} ${count === 1 ? "dealer" : "dealers"} in ${selectedState}`;

  return (
    <div>
      <Header />
      <main className="page">
        <div className="list-head">
          <div>
            <h1 className="page-title">Find a dealer</h1>
            <p className="page-lead" aria-live="polite">{loading ? "Loading dealers…" : summary}</p>
          </div>
          <div className="state-filter">
            <label className="field-label" htmlFor="state">State</label>
            <select id="state" name="state" className="select" value={selectedState} onChange={(e) => filterDealers(e.target.value)}>
              <option value="All">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p role="alert" className="alert">{error}</p>}

        <table className="dealer-table">
          <thead>
            <tr>
              <th scope="col">Dealer</th>
              <th scope="col">City</th>
              <th scope="col">Address</th>
              <th scope="col">ZIP</th>
              <th scope="col">State</th>
              {isLoggedIn ? <th scope="col"><span className="visually-hidden">Review</span></th> : null}
            </tr>
          </thead>
          <tbody>
            {dealersList.map((dealer) => (
              <tr key={dealer.id}>
                <td className="cell-name"><a href={pageUrl('/dealer/' + dealer.id)}>{dealer.full_name}</a></td>
                <td className="cell-city">{dealer.city}</td>
                <td className="cell-address">{dealer.address}</td>
                <td className="cell-zip">{dealer.zip}</td>
                <td className="cell-state">{dealer.state}</td>
                {isLoggedIn ? (
                  <td className="cell-action">
                    <a href={pageUrl(`/postreview/${dealer.id}`)} aria-label={`Write a review for ${dealer.full_name}`}>Write a review</a>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Dealers;
