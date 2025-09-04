import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../style/navbar.css";

// 🌍 Configuration des langues
const LANGUAGES = {
  english: { name: "English", flag: "🇬🇧", code: "en" },
  french: { name: "Français", flag: "🇫🇷", code: "fr" },
  spanish: { name: "Español", flag: "🇪🇸", code: "es" },
  german: { name: "Deutsch", flag: "🇩🇪", code: "de" },
  japanese: { name: "日本語", flag: "🇯🇵", code: "ja" },
  thai: { name: "ไทย", flag: "🇹🇭", code: "th" },
};

function Navbar() {
  // 🎯 État pour la langue sélectionnée (avec localStorage)
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'english';
  });

  // 📝 Fonction pour changer de langue
  const handleLanguageChange = (langKey: string) => {
    setSelectedLanguage(langKey);
    localStorage.setItem('selectedLanguage', langKey);
    console.log(`🌍 Langue sélectionnée: ${LANGUAGES[langKey as keyof typeof LANGUAGES].name}`);
    
    // 🔄 Déclencher un event pour que les autres composants se mettent à jour
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: langKey }));
  };

  const currentLang = LANGUAGES[selectedLanguage as keyof typeof LANGUAGES];

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            AI Translator
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarColor01"
            aria-controls="navbarColor01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarColor01">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  RestaurantsList
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/admin/listings">
                  BackAdmin
                </Link>
              </li>
            </ul>
            
            {/* 🌍 Menu déroulant des langues */}
            <div className="d-flex align-items-center">
              <div className="dropdown me-2">
                <button
                  className="btn btn-outline-light dropdown-toggle d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ minWidth: "120px" }}
                >
                  <span className="me-2">{currentLang.flag}</span>
                  <span>{currentLang.name}</span>
                </button>
                <ul className="dropdown-menu">
                  {Object.entries(LANGUAGES).map(([langKey, lang]) => (
                    <li key={langKey}>
                      <button
                        className={`dropdown-item d-flex align-items-center ${
                          selectedLanguage === langKey ? 'active' : ''
                        }`}
                        onClick={() => handleLanguageChange(langKey)}
                      >
                        <span className="me-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {selectedLanguage === langKey && (
                          <span className="ms-auto">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 🔍 Bouton Search (gardé comme demandé) */}
              <button className="btn btn-secondary" type="button">
                Search
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="navbar-purple-line"></div>
    </>
  );
}

export default Navbar;