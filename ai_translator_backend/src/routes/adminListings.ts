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

// 🔹 READ - GET /admin/listings
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// 🔹 CREATE - POST /admin/listings
router.post("/", async (req, res) => {
  const { restaurant_name, description, opening_hours, address, amenities } =
    req.body;

  if (!restaurant_name || !description) {
    return res
      .status(400)
      .json({ error: "restaurant_name and description are required" });
  }

  try {
    const { data, error } = await supabase
      .from("listings")
      .insert([
        { restaurant_name, description, opening_hours, address, amenities },
      ])
      .select(); // récupère la ligne insérée

    if (error) throw error;

    res.status(201).json({ message: "Listing created", listing: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// 🔹 UPDATE - PUT /admin/listings/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { restaurant_name, description, opening_hours, address, amenities } =
    req.body;

  try {
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
      .select(); // récupère la ligne mise à jour

    if (error) throw error;

    res.json({ message: "Listing updated", listing: data[0] });
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
      .select(); // récupère la ligne supprimée

    if (error) throw error;

    res.json({ message: "Listing deleted", listing: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

export default router;
