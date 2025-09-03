import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/restaurantsList.css";

interface Listing {
  id: string;
  restaurant_name: string;
  description: string;
  opening_hours?: string;
  address?: string;
  amenities?: string;
}

const RestaurantsList = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backendUrl = "http://localhost:4000/admin/listings";

  // 🔹 Fetch restaurants
  const fetchListings = async () => {
    try {
      const res = await axios.get<Listing[]>(backendUrl);
      setListings(res.data);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div id="restaurants" className="container mt-5">
      <h2>Restaurant List</h2>
      <ul className="list-group">
        {listings.map((listing) => (
          <li key={listing.id} className="list-group-item">
            <h4>{listing.restaurant_name}</h4>
            <div className="detail">
              <span className="label">Description:</span>
              <span className="value">{listing.description}</span>
            </div>
            {listing.opening_hours && (
              <div className="detail">
                <span className="label">Opening Hours:</span>
                <span className="value">{listing.opening_hours}</span>
              </div>
            )}
            {listing.address && (
              <div className="detail">
                <span className="label">Address:</span>
                <span className="value">{listing.address}</span>
              </div>
            )}
            {listing.amenities && (
              <div className="detail">
                <span className="label">Amenities:</span>
                <span className="value">{listing.amenities}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantsList;
