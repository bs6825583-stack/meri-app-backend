const Groq = require("groq-sdk");

let groq = null;
function getClient() {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error(
      "GROQ_API_KEY is missing. Add it to your .env file."
    );
    err.statusCode = 503;
    throw err;
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

function buildPrompt({ destination, days, budget, preference, travelers, extraNotes }) {
  return `You are an expert travel planner. Create a precise, realistic, day-by-day travel itinerary.

TRIP DETAILS:
- Destination: ${destination}
- Number of days: ${days}
- Budget level: ${budget}
- Travel preference / style: ${preference}
- Number of travelers: ${travelers || "not specified"}
- Additional notes: ${extraNotes || "none"}

STRICT REQUIREMENTS:
1. Produce EXACTLY ${days} day(s) in the itinerary array, with day numbers 1..${days}.
2. Each day must have 3 to 6 realistic activities ordered by time (morning to night).
3. Use REAL, well-known places, landmarks, restaurants, and areas for "${destination}".
4. Keep costs consistent with a "${budget}" budget. If destination is in Pakistan, use PKR currency and realistic local rates based on total trip duration of ${days} days:
   - Budget: PKR 5,000 - 8,000 per day (total for all travelers)
   - Mid-range: PKR 10,000 - 20,000 per day (total for all travelers)
   - Luxury: PKR 30,000 - 80,000 per day (total for all travelers)
   Multiply by number of days to get estimatedTotalCost. Show as a range like "PKR 50,000 - 100,000" not a single number.
5. Keep descriptions concise (1-2 sentences) and practical.
6. travelTips must contain 4-6 short, genuinely useful tips.
7. Return ONLY valid JSON — no markdown, no commentary.

Return this exact JSON structure:
{
  "destination": "string",
  "overview": "string",
  "bestTimeToVisit": "string",
  "estimatedTotalCost": "string",
  "travelTips": ["string"],
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "activities": [
        {
          "time": "string",
          "title": "string",
          "description": "string",
          "location": "string",
          "estimatedCost": "string"
        }
      ]
    }
  ]
}`;
}

function clamp(text, max = 4000) {
  if (typeof text !== "string") return "";
  return text.length > max ? text.slice(0, max) : text;
}

function normalizeTrip(raw, input) {
  const data = raw && typeof raw === "object" ? raw : {};
  const itinerary = Array.isArray(data.itinerary) ? data.itinerary : [];

  const cleanItinerary = itinerary
    .map((d, idx) => ({
      day: Number.isInteger(d.day) ? d.day : idx + 1,
      title: clamp(d.title || `Day ${idx + 1}`, 200),
      activities: Array.isArray(d.activities)
        ? d.activities.map((a) => ({
            time: clamp(a.time || "", 50),
            title: clamp(a.title || "", 200),
            description: clamp(a.description || "", 600),
            location: clamp(a.location || "", 200),
            estimatedCost: clamp(a.estimatedCost || "", 100),
          }))
        : [],
    }))
    .filter((d) => d.activities.length > 0);

  if (cleanItinerary.length === 0) {
    const err = new Error(
      "AI returned an empty itinerary. Please try again."
    );
    err.statusCode = 502;
    throw err;
  }

  return {
    destination: clamp(data.destination || input.destination, 200),
    overview: clamp(data.overview || "", 2000),
    bestTimeToVisit: clamp(data.bestTimeToVisit || "", 300),
    estimatedTotalCost: clamp(data.estimatedTotalCost || "", 200),
    travelTips: Array.isArray(data.travelTips)
      ? data.travelTips.slice(0, 10).map((t) => clamp(String(t), 300))
      : [],
    itinerary: cleanItinerary,
  };
}

async function generateTrip(input) {
  const client = getClient();

  let text;
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      temperature: 0.7,
    });
    text = completion.choices[0].message.content;
  } catch (error) {
    console.error("GROQ EXACT ERROR:", error);
    const err = new Error(`Groq request failed: ${error.message}`);
    err.statusCode = 502;
    throw err;
  }

  let parsed;
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const err = new Error("AI returned malformed JSON. Please try again.");
    err.statusCode = 502;
    throw err;
  }

  const trip = normalizeTrip(parsed, input);
  trip.meta = { model: "llama3-8b-8192", generatedAt: new Date() };
  return trip;
}

module.exports = { generateTrip };