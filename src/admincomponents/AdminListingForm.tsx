import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/adminListingForm.css";

interface Listing {
  id?: string;
  restaurant_name: string;
  description: string;
  opening_hours?: string;
  address?: string;
  amenities?: string;
}

const AdminListingForm = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [form, setForm] = useState<Listing>({
    restaurant_name: "",
    description: "",
    opening_hours: "",
    address: "",
    amenities: "",
  });
  const [message, setMessage] = useState(""); // 🔹 nouveau state pour le message

  const backendUrl = "http://localhost:4000/admin/listings";

  // 🔹 READ: récupérer tous les listings au chargement
  const fetchListings = async () => {
    const res = await axios.get<Listing[]>(backendUrl);
    setListings(res.data);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 CREATE / UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) {
        // 🔹 UPDATE
        await axios.put(`${backendUrl}/${form.id}`, form);
        setMessage("Restaurant updated successfully!");
      } else {
        // 🔹 CREATE
        await axios.post(backendUrl, form);
        setMessage("Restaurant created successfully!");
      }

      setForm({
        restaurant_name: "",
        description: "",
        opening_hours: "",
        address: "",
        amenities: "",
      });
      fetchListings();

      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    }
  };

  // DELETE
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await axios.delete(`${backendUrl}/${id}`);
    fetchListings();
    setMessage("Restaurant deleted successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  // Préparer le formulaire pour l'édition
  const handleEdit = (listing: Listing) => {
    setForm(listing);
  };

  return (
    <div id="admin-listing" className="container mt-5">
      <h2>Admin - Manage Listings</h2>

      {/* 🔹 Affichage du message */}
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          name="restaurant_name"
          placeholder="Restaurant Name"
          className="form-control mb-2"
          value={form.restaurant_name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="form-control mb-2"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="opening_hours"
          placeholder="Opening Hours"
          className="form-control mb-2"
          value={form.opening_hours}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          className="form-control mb-2"
          value={form.address}
          onChange={handleChange}
        />
        <input
          type="text"
          name="amenities"
          placeholder="Amenities"
          className="form-control mb-2"
          value={form.amenities}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-primary">
          {form.id ? "Update" : "Create"}
        </button>
      </form>

      {/* 🔹 READ: afficher la liste existante */}
      <h3>Existing Listings</h3>
      <ul className="list-group">
        {listings.map((listing) => (
          <li
            key={listing.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{listing.restaurant_name}</strong> - {listing.description}
            </div>
            <div>
              <button
                className="btn btn-sm btn-secondary me-2"
                onClick={() => handleEdit(listing)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(listing.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminListingForm;
