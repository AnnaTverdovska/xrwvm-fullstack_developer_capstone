// Modified 2026 by AnnaTverdovska. Original: IBM Skills Network capstone template (Apache License 2.0).
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import { pageUrl } from '../../links';

const LABELS = { positive: "Positive", neutral: "Neutral", negative: "Negative" };

// "2 positive, 1 neutral" for the reviews summary
const summarize = (reviews) =>
  ["positive", "neutral", "negative"]
    .map((s) => [s, reviews.filter((r) => r.sentiment === s).length])
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${s}`)
    .join(", ");

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
        // The page then says there are no reviews yet
      }
      setLoading(false);
    };

    getDealer();
    getReviews();
  }, [id]);

  if (error) {
    return (
      <div>
        <Header />
        <main className="page">
          <p role="alert" className="alert">{error} <a href={pageUrl("/dealers")}>Back to all dealers</a></p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="page">
        <p className="breadcrumb"><a href={pageUrl("/dealers")}>All dealers</a></p>
        <div className="dealer-head">
          <div>
            <h1 className="page-title">{dealer.full_name}</h1>
            {dealer.city ? (
              <p className="page-lead">{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p>
            ) : null}
          </div>
          {isLoggedIn ? (
            <a className="button" href={pageUrl(`/postreview/${id}`)}>Write a review</a>
          ) : (
            <a href={pageUrl("/login")}>Log in to write a review</a>
          )}
        </div>

        <h2 className="section-title">Reviews</h2>
        {loading ? (
          <p>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="empty">No reviews yet!</p>
        ) : (
          <>
            <p className="page-lead">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}: {summarize(reviews)}</p>
            <ul className="review-list">
              {reviews.map((review) => (
                <li className="review-card" key={review.id} data-sentiment={review.sentiment}>
                  <span className={`badge badge-${review.sentiment}`}>{LABELS[review.sentiment] || "Neutral"}</span>
                  <p className="review-text">{review.review}</p>
                  <p className="review-meta">
                    {review.name}
                    {review.car_make ? `, ${review.car_make} ${review.car_model} (${review.car_year})` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
};

export default Dealer;
