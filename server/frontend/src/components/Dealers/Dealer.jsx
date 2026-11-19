import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png";
import neutral_icon from "../assets/neutral.png";
import negative_icon from "../assets/negative.png";
import review_icon from "../assets/reviewbutton.png";
import Header from '../Header/Header';

const senti_icon = (sentiment) =>
  sentiment === "positive" ? positive_icon : sentiment === "negative" ? negative_icon : neutral_icon;

const Dealer = () => {
  const [dealer, setDealer] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { id } = useParams();
  const isLoggedIn = sessionStorage.getItem("username") != null;

  useEffect(() => {
    const getDealer = async () => {
      try {
        const res = await fetch(`/djangoapp/dealer/${id}`, { method: "GET" });
        const retobj = await res.json();
        if (retobj.status === 200 && retobj.dealer.length > 0) {
          setDealer(retobj.dealer[0]);
        } else {
          setError(retobj.message || "This dealer could not be found.");
        }
      } catch (e) {
        setError("This dealer could not be loaded.");
      }
    };

    const getReviews = async () => {
      try {
        const res = await fetch(`/djangoapp/reviews/dealer/${id}`, { method: "GET" });
        const retobj = await res.json();
        if (retobj.status === 200) setReviews(retobj.reviews);
      } catch (e) {
        // The reviews panel shows "No reviews yet" in this case
      }
      setLoading(false);
    };

    getDealer();
    getReviews();
  }, [id]);

  if (error) {
    return (
      <div style={{ margin: "20px" }}>
        <Header />
        <p role="alert" style={{ marginTop: "20px" }}>{error} <a href="/dealers">Back to all dealers</a></p>
      </div>
    );
  }

  return (
    <div style={{ margin: "20px" }}>
      <Header />
      <div style={{ marginTop: "10px" }}>
        <h1 style={{ color: "grey" }}>
          {dealer.full_name}
          {isLoggedIn ? (
            <a href={`/postreview/${id}`}>
              <img src={review_icon} style={{ width: '10%', marginLeft: '10px', marginTop: '10px' }} alt='Post Review' />
            </a>
          ) : null}
        </h1>
        {dealer.city ? (
          <h4 style={{ color: "grey" }}>{dealer.city}, {dealer.address}, Zip - {dealer.zip}, {dealer.state}</h4>
        ) : null}
      </div>
      <div className="reviews_panel">
        {loading ? (
          <span>Loading Reviews....</span>
        ) : reviews.length === 0 ? (
          <div>No reviews yet!</div>
        ) : (
          reviews.map((review) => (
            <div className='review_panel' key={review.id}>
              <img src={senti_icon(review.sentiment)} className="emotion_icon" alt={`Sentiment: ${review.sentiment}`} />
              <div className='review'>{review.review}</div>
              <div className="reviewer">{review.name} {review.car_make} {review.car_model} {review.car_year}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dealer;
