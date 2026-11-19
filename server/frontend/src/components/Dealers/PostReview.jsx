// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import { pageUrl } from '../../links';

const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [carIndex, setCarIndex] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  const [message, setMessage] = useState("");

  const { id } = useParams();
  const isLoggedIn = sessionStorage.getItem("username") != null;

  const postreview = async (e) => {
    e.preventDefault();
    let name = sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("lastname");
    // If the first and last name are not stored, use the username
    if (name.includes("null") || !name.trim()) {
      name = sessionStorage.getItem("username");
    }
    if (carIndex === "" || review.trim() === "" || date === "" || year === "") {
      setMessage("All details are mandatory.");
      return;
    }

    const car = carmodels[Number(carIndex)];
    try {
      const res = await fetch("/djangoapp/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          dealership: id,
          review: review,
          purchase: true,
          purchase_date: date,
          car_make: car.CarMake,
          car_model: car.CarModel,
          car_year: year,
        }),
      });
      const json = await res.json();
      if (json.status === 200) {
        window.location.href = pageUrl("/dealer/" + id);
      } else if (json.status === 401) {
        setMessage("Please log in to post a review.");
      } else {
        setMessage(json.message || "The review could not be posted.");
      }
    } catch (error) {
      setMessage("The review could not be posted. Please try again later.");
    }
  };

  useEffect(() => {
    const getDealer = async () => {
      const res = await fetch(`/djangoapp/dealer/${id}`, { method: "GET" });
      const retobj = await res.json();
      if (retobj.status === 200 && retobj.dealer.length > 0) setDealer(retobj.dealer[0]);
    };
    const getCars = async () => {
      const res = await fetch("/djangoapp/get_cars", { method: "GET" });
      const retobj = await res.json();
      setCarmodels(Array.from(retobj.CarModels));
    };
    getDealer().catch(() => setMessage("This dealer could not be loaded."));
    getCars().catch(() => setMessage("The car list could not be loaded."));
  }, [id]);

  return (
    <div>
      <Header />
      <main className="page narrow">
        <p className="breadcrumb"><a href={pageUrl(`/dealer/${id}`)}>Back to {dealer.full_name || "the dealer"}</a></p>
        <h1 className="page-title">Review {dealer.full_name || "this dealer"}</h1>

        {!isLoggedIn ? (
          <p className="empty">Please <a href={pageUrl("/login")}>log in</a> to write a review.</p>
        ) : (
          <form className="form-card" onSubmit={postreview} onChange={() => setMessage("")} noValidate>
            <div>
              <label className="field-label" htmlFor="review">Your review</label>
              <textarea id="review" className="textarea" onChange={(e) => setReview(e.target.value)}></textarea>
            </div>
            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="cars">Car</label>
                <select id="cars" name="cars" className="select" defaultValue="" onChange={(e) => setCarIndex(e.target.value)}>
                  <option value="" disabled>Choose a make and model</option>
                  {carmodels.map((carmodel, index) => (
                    <option key={`${carmodel.CarMake}-${carmodel.CarModel}`} value={index}>{carmodel.CarMake} {carmodel.CarModel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="car-year">Car year</label>
                <input id="car-year" className="input" type="number" min={2015} max={2023} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="purchase-date">Purchase date</label>
                <input id="purchase-date" className="input" type="date" onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            {message && <p role="alert" className="alert">{message}</p>}
            <button className="button" type="submit">Post review</button>
          </form>
        )}
      </main>
    </div>
  );
};
export default PostReview;
