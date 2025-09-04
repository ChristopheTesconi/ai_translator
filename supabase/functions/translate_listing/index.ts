import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialisation du client Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// 🌍 Configuration des langues supportées
const SUPPORTED_LANGUAGES = {
  french: { code: "fr", column: "description_fr" },
  spanish: { code: "es", column: "description_es" },
  german: { code: "de", column: "description_de" },
  japanese: { code: "ja", column: "description_jp" },
  thai: { code: "th", column: "description_th" },
};

// 🤖 Traduction avec Groq (Llama-3 gratuit)
async function translateWithGroq(
  text: string,
  targetLang: string
): Promise<string> {
  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not found in environment variables");
    }

    console.log(`🤖 Using Groq AI to translate to ${targetLang}...`);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Modèle gratuit très rapide
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text from English to ${targetLang}. Return ONLY the translated text, no explanations or additional content. Make the translation natural and contextually appropriate.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
          top_p: 1,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error("No translation received from Groq");
    }

    return translatedText;
  } catch (error) {
    console.error(`❌ Groq translation failed for ${targetLang}:`, error);
    throw error;
  }
}

// 🆓 Fonction de traduction avec MyMemory (fallback uniquement)
async function translateWithMyMemory(
  text: string,
  targetLangCode: string
): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|${targetLangCode}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    throw new Error(
      `MyMemory failed: ${data.responseDetails || "Unknown error"}`
    );
  } catch (error) {
    console.error(
      `❌ MyMemory translation failed for ${targetLangCode}:`,
      error
    );
    throw error;
  }
}

// 🚀 Fonction principale : traduit avec Groq + fallback MyMemory
async function translateToLanguage(
  text: string,
  langName: string,
  langConfig: any
): Promise<string> {
  console.log(`🔄 Translating to ${langName}...`);

  // 1️⃣ Essayer Groq en premier
  try {
    const translated = await translateWithGroq(text, langName);
    console.log(`✅ ${langName} translation successful (Groq AI)`);
    return translated;
  } catch (error) {
    console.log(
      `⚠️ Groq failed for ${langName}, trying fallback (MyMemory)...`
    );
  }

  // 2️⃣ Fallback sur MyMemory
  try {
    const translated = await translateWithMyMemory(text, langConfig.code);
    console.log(`✅ ${langName} translation successful (MyMemory fallback)`);
    return translated;
  } catch (error) {
    console.error(`❌ All services failed for ${langName}`);
    console.log(`📝 Using original text as fallback for ${langName}`);
    return text; // Fallback final : texte original
  }
}

// 🎯 Fonction principale : traduire toutes les langues avec Groq
async function translateAllLanguages(
  text: string
): Promise<Record<string, string>> {
  console.log(
    `🤖 Starting Groq AI translation for all ${
      Object.keys(SUPPORTED_LANGUAGES).length
    } languages...`
  );

  const translations: Record<string, string> = {};

  // Traduction séquentielle pour éviter les rate limits
  for (const [langName, langConfig] of Object.entries(SUPPORTED_LANGUAGES)) {
    try {
      const translated = await translateToLanguage(text, langName, langConfig);
      translations[langConfig.column] = translated;

      // Petit délai entre les requêtes pour respecter les rate limits de Groq (14,400/jour)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`💥 Critical error for ${langName}:`, error);
      translations[langConfig.column] = text; // Fallback : texte original
    }
  }

  console.log(`🎉 All Groq AI translations completed!`);
  return translations;
}

serve(async (req) => {
  // Gestion des CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { listing_id, lang } = body;

    console.log(`🚀 Processing request:`, { listing_id, lang });

    // 🔄 MODE : Traduire toutes les langues avec Groq AI
    if (!lang || lang === "all") {
      console.log(
        `🤖 Mode: Groq AI translate ALL languages for listing ${listing_id}`
      );

      if (!listing_id) {
        return new Response(
          JSON.stringify({
            error: "listing_id is required for batch translation",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Récupérer la description depuis Supabase
      const { data, error } = await supabase
        .from("listings")
        .select("description")
        .eq("id", listing_id)
        .single();

      if (error || !data) {
        console.error("❌ Listing not found:", error);
        return new Response(JSON.stringify({ error: "Listing not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const textToTranslate = data.description;
      if (!textToTranslate) {
        return new Response(
          JSON.stringify({ error: "No description to translate" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      console.log(
        `📝 Original text: "${textToTranslate.substring(0, 100)}..."`
      );

      // 🤖 Traduire dans toutes les langues avec Groq AI
      const translations = await translateAllLanguages(textToTranslate);

      // 💾 Mettre à jour la base de données avec toutes les traductions
      console.log(`💾 Updating database with all Groq AI translations...`);
      const { error: updateError } = await supabase
        .from("listings")
        .update(translations)
        .eq("id", listing_id);

      if (updateError) {
        console.error("❌ Failed to update translations:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update translations" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      console.log(`🎉 All Groq AI translations saved successfully!`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "All languages translated successfully with Groq AI",
          translations: translations,
          languages_processed: Object.keys(SUPPORTED_LANGUAGES),
          service: "Groq AI (Llama-3)",
          model: "llama3-8b-8192",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 🔄 MODE : Traduire une seule langue avec Groq AI
    else {
      console.log(
        `🤖 Mode: Groq AI translate single language (${lang}) for listing ${listing_id}`
      );

      if (!listing_id || !lang) {
        return new Response(
          JSON.stringify({ error: "Missing listing_id or lang parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      if (!SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]) {
        return new Response(
          JSON.stringify({
            error: `Language '${lang}' not supported. Supported languages: ${Object.keys(
              SUPPORTED_LANGUAGES
            ).join(", ")}`,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Récupérer la description
      const { data, error } = await supabase
        .from("listings")
        .select("description")
        .eq("id", listing_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Listing not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const textToTranslate = data.description;
      if (!textToTranslate) {
        return new Response(JSON.stringify({ error: "No text to translate" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Traduire une seule langue avec Groq AI
      const langConfig =
        SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES];
      const translatedText = await translateToLanguage(
        textToTranslate,
        lang,
        langConfig
      );

      // Mettre à jour la colonne spécifique
      const { error: updateError } = await supabase
        .from("listings")
        .update({ [langConfig.column]: translatedText })
        .eq("id", listing_id);

      if (updateError) {
        console.error("❌ Failed to update:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update translation" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          translatedText,
          language: lang,
          service: "Groq AI (Llama-3)",
          model: "llama3-8b-8192",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
        service: "Groq AI Translation Service",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
