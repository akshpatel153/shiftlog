export interface ScannedShiftData {
  date: string;
  clockIn: string;
  clockOut: string;
}

export async function scanReceipt(imageBase64: string, apiKey: string): Promise<ScannedShiftData> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please add it in your Settings.");
  }

  // Strip Data URL prefix if it exists (e.g. data:image/jpeg;base64,...)
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  
  const endPoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Extract the date, exact clock-in time and clock-out time from this receipt or timesheet. Return valid JSON containing EXACTLY three keys: 'date', 'clockIn' and 'clockOut'. Map the times to standard 24-hour HH:mm string format. Map the date to YYYY-MM-DD. If you cannot find a value, leave it as an empty string. Only return the JSON object."
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  };

  const response = await fetch(endPoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to scan receipt via AI");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("AI did not return any parseable text.");
  }

  try {
    const parsed: ScannedShiftData = JSON.parse(rawText);
    return parsed;
  } catch (e) {
    throw new Error("Failed to parse AI output into JSON: " + rawText);
  }
}
