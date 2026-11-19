// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [carIndex, setCarIndex] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  const [message, setMessage] = useState("");

  const { id } = useParams();

  const postreview = async () => {
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
        window.location.href = window.location.origin + "/dealer/" + id;
      } else if (json.status === 401) {
        setMessage("Please log in to post a review.");
      } else {
        setMessage(json.message || "The review could not be posted.");
      }
    } catch (e) {
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
      <div style={{ margin: "5%" }}>
        <h1 style={{ color: "darkblue" }}>{dealer.full_name}</h1>
        <textarea id='review' aria-label="Your review" cols='50' rows='7' onChange={(e) => setReview(e.target.value)}></textarea>
        <div className='input_field'>
          <label>Purchase Date <input type="date" onChange={(e) => setDate(e.target.value)} /></label>
        </div>
        <div className='input_field'>
          <label>
            Car Make{' '}
            <select name="cars" id="cars" defaultValue="" onChange={(e) => setCarIndex(e.target.value)}>
              <option value="" disabled hidden>Choose Car Make and Model</option>
              {carmodels.map((carmodel, index) => (
                <option key={`${carmodel.CarMake}-${carmodel.CarModel}`} value={index}>{carmodel.CarMake} {carmodel.CarModel}</option>
              ))}
            </select>
          </label>
        </div>
        <div className='input_field'>
          <label>Car Year <input type="number" onChange={(e) => setYear(e.target.value)} max={2023} min={2015} /></label>
        </div>
        {message && <p role="alert" style={{ color: "darkred" }}>{message}</p>}
        <div>
          <button className='postreview' onClick={postreview}>Post Review</button>
        </div>
      </div>
    </div>
  );
};
export default PostReview;
