import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/restaurantsList.css";

interface Listing {
  id: string;
  restaurant_name: string;
  description: string; // anglais (original)
  description_fr?: string; // français
  description_es?: string; // espagnol
  description_de?: string; // allemand
  description_jp?: string; // japonais
  description_th?: string; // thaï
  opening_hours?: string;
  address?: string;
  amenities?: string;
}

// 🌍 Configuration des langues (mapping pour les colonnes BDD)
const LANGUAGE_COLUMNS = {
  english: "description",
  french: "description_fr",
  spanish: "description_es",
  german: "description_de",
  japanese: "description_jp",
  thai: "description_th",
};

const RestaurantsList = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem("selectedLanguage") || "english";
  });

  // 🔄 NOUVEAU: Backend modifié pour récupérer toutes les colonnes de traduction
  const backendUrl = "http://localhost:4000/admin/listings";

  // 🔹 Fetch restaurants (avec toutes les traductions)
  const fetchListings = async () => {
    try {
      const res = await axios.get<Listing[]>(backendUrl);
      setListings(res.data);
      console.log("📝 Restaurants récupérés avec traductions:", res.data[0]); // Debug
    } catch (err) {
      console.error(err);
      setError("Unable to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  // 📝 Fonction pour récupérer la description dans la bonne langue
  const getTranslatedDescription = (
    listing: Listing,
    language: string
  ): string => {
    const columnName =
      LANGUAGE_COLUMNS[language as keyof typeof LANGUAGE_COLUMNS];
    const translatedText = listing[columnName as keyof Listing] as string;

    // 🔄 Fallback: si pas de traduction, utiliser l'anglais
    if (!translatedText || translatedText.trim() === "") {
      console.log(
        `⚠️ Pas de traduction ${language} pour ${listing.restaurant_name}, fallback anglais`
      );
      return listing.description;
    }

    return translatedText;
  };

  // 🎧 Écouter les changements de langue depuis la Navbar
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setSelectedLanguage(event.detail);
      console.log(`🔄 Langue changée dans RestaurantsList: ${event.detail}`);
    };

    window.addEventListener(
      "languageChanged",
      handleLanguageChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "languageChanged",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div id="restaurants" className="container mt-5">
      <h2>Restaurant List</h2>

      {/* 🐛 Debug info (à retirer en prod) */}
      <div className="alert alert-info mb-3">
        <small>
          🌍 Langue actuelle: <strong>{selectedLanguage}</strong> | 📊{" "}
          {listings.length} restaurants | 🔄{" "}
          <button
            className="btn btn-sm btn-outline-primary ms-2"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </small>
      </div>

      <ul className="list-group">
        {listings.map((listing) => {
          const translatedDescription = getTranslatedDescription(
            listing,
            selectedLanguage
          );
          const isTranslated =
            selectedLanguage !== "english" &&
            listing[
              LANGUAGE_COLUMNS[
                selectedLanguage as keyof typeof LANGUAGE_COLUMNS
              ] as keyof Listing
            ];

          return (
            <li key={listing.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <h4>{listing.restaurant_name}</h4>
                {/* 🏷️ Badge pour indiquer si c'est traduit */}
                {selectedLanguage !== "english" && (
                  <span
                    className={`badge ${
                      isTranslated ? "bg-success" : "bg-warning"
                    }`}
                  >
                    {isTranslated
                      ? `Traduit (${selectedLanguage})`
                      : "Anglais (fallback)"}
                  </span>
                )}
              </div>

              <div className="detail">
                <span className="label">Description:</span>
                <span className="value">{translatedDescription}</span>
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
          );
        })}
      </ul>
    </div>
  );
};

export default RestaurantsList;
