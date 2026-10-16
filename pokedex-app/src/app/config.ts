// Clave de Gemini (gratis) para reconocer el Pokémon en la foto.
// Sácala en https://aistudio.google.com/apikey y pégala aquí.
export const config = {
  geminiApiKey: 'TU_GEMINI_API_KEY_AQUI',
  // Se prueban en orden: si uno está saturado se usa el siguiente.
  geminiModelos: ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3-flash-preview'],
};
