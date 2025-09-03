// import Deepl from "deepl-node";
// import type { TargetLanguageCode } from "deepl-node"; // ✅ import de type seulement

// // Crée le client avec ta clé API DeepL
// export const deepl = new Deepl.Translator(import.meta.env.VITE_DEEPL_KEY);

// export async function translateText(
//   text: string,
//   targetLanguage: TargetLanguageCode // <- type correct ici
// ) {
//   try {
//     const result = await deepl.translateText(text, null, targetLanguage);
//     return result.text;
//   } catch (error) {
//     console.error("Erreur traduction DeepL:", error);
//     return "";
//   }
// }
