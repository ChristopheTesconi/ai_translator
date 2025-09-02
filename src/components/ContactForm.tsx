import React, { useState } from "react";
import "../style/contactForm.css";
import { supabase } from "../lib/supabaseClient";
import { translateText } from "../lib/deeplClient";
import type { TargetLanguageCode } from "deepl-node"; // import de type uniquement

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1️⃣ Insérer le message original en anglais
      const { data, error } = await supabase
        .from("contacts")
        .insert([
          {
            name,
            email,
            message_eng: message,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erreur Supabase:", error);
        alert("Erreur lors de l'envoi du message.");
        return;
      }

      // 2️⃣ Définir les codes de langue valides pour Deepl
      const LANG_EN: TargetLanguageCode = "en-GB";
      const LANG_FR: TargetLanguageCode = "fr";
      const LANG_ES: TargetLanguageCode = "es";
      const LANG_JA: TargetLanguageCode = "ja";

      // 3️⃣ Traduire le message
      const translations = {
        en: await translateText(message, LANG_EN),
        fr: await translateText(message, LANG_FR),
        es: await translateText(message, LANG_ES),
        ja: await translateText(message, LANG_JA),
      };

      // 4️⃣ Mettre à jour la même ligne dans Supabase avec les traductions
      await supabase
        .from("contacts")
        .update({
          message_en: translations.en,
          message_fr: translations.fr,
          message_es: translations.es,
          message_ja: translations.ja,
        })
        .eq("id", data.id);

      alert("Message envoyé et traduit avec succès !");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Erreur globale:", err);
      alert("Une erreur est survenue.");
    }
  };

  return (
    <div className="container mt-5" id="contact">
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            Message
          </label>
          <textarea
            className="form-control"
            id="message"
            rows={5}
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary">
          Send Message
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
