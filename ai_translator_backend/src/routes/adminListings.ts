import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// 🔹 Créer le client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// 🌍 Fonction pour appeler l'Edge Function de traduction
const triggerTranslation = async (listingId: string) => {
  try {
    console.log(`🔄 Triggering translation for listing: ${listingId}`);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/translate_listing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ listing_id: listingId }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(
        `✅ Translation successful for ${listingId}:`,
        result.message
      );
      return result;
    } else {
      const error = await response.text();
      console.error(`❌ Translation failed for ${listingId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`💥 Translation error for ${listingId}:`, error);
    return null;
  }
};

// 🔹 READ - GET /admin/listings (avec toutes les traductions)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id, restaurant_name, description, 
        description_fr, description_es, description_de, description_jp, description_th,
        opening_hours, address, amenities, created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// 🔹 CREATE - POST /admin/listings (avec traduction automatique)
router.post("/", async (req, res) => {
  const { restaurant_name, description, opening_hours, address, amenities } =
    req.body;

  if (!restaurant_name || !description) {
    return res
      .status(400)
      .json({ error: "restaurant_name and description are required" });
  }

  try {
    // 1️⃣ Créer le listing en BDD
    const { data, error } = await supabase
      .from("listings")
      .insert([
        { restaurant_name, description, opening_hours, address, amenities },
      ])
      .select();

    if (error) throw error;

    const newListing = data[0];
    console.log(`📝 New listing created: ${newListing.id}`);

    // 2️⃣ Déclencher les traductions automatiquement (async)
    // On n'attend pas la réponse pour ne pas ralentir l'API
    if (description && description.trim() !== "") {
      triggerTranslation(newListing.id).catch((err) => {
        console.error("Translation error (non-blocking):", err);
      });
    }

    // 3️⃣ Répondre immédiatement sans attendre les traductions
    res.status(201).json({
      message: "Listing created, translations in progress...",
      listing: newListing,
      translation_status: "in_progress",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// 🔹 UPDATE - PUT /admin/listings/:id (avec traduction automatique)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { restaurant_name, description, opening_hours, address, amenities } =
    req.body;

  try {
    // 1️⃣ Récupérer l'ancienne description pour comparaison
    const { data: oldData } = await supabase
      .from("listings")
      .select("description")
      .eq("id", id)
      .single();

    // 2️⃣ Mettre à jour le listing
    const { data, error } = await supabase
      .from("listings")
      .update({
        restaurant_name,
        description,
        opening_hours,
        address,
        amenities,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    const updatedListing = data[0];

    // 3️⃣ Si la description a changé, déclencher les traductions
    const descriptionChanged = oldData?.description !== description;
    if (descriptionChanged && description && description.trim() !== "") {
      console.log(`🔄 Description changed for ${id}, triggering retranslation`);
      triggerTranslation(id).catch((err) => {
        console.error("Translation error (non-blocking):", err);
      });
    }

    res.json({
      message:
        "Listing updated" +
        (descriptionChanged ? ", translations in progress..." : ""),
      listing: updatedListing,
      translation_status: descriptionChanged ? "in_progress" : "unchanged",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// 🔹 DELETE - DELETE /admin/listings/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({ message: "Listing deleted", listing: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// 🔹 NOUVEAU - Route pour déclencher manuellement les traductions
router.post("/:id/translate", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🌍 Manual translation requested for listing: ${id}`);

    const result = await triggerTranslation(id);

    if (result) {
      res.json({
        message: "Translation completed successfully",
        translation: result,
      });
    } else {
      res.status(500).json({
        error: "Translation failed - check server logs",
      });
    }
  } catch (err) {
    console.error("Manual translation error:", err);
    res.status(500).json({ error: "Failed to trigger translation" });
  }
});

export default router;
