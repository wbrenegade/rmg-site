const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// Imports the OpenAI SDK
const OpenAI = require("openai");
// Extracts the helper function to convert a file stream for upload
const { toFile } = require("openai");

const generatedMockupsDir = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "generated-mockups"
);

function ensureGeneratedDir() {
  fs.mkdirSync(generatedMockupsDir, { recursive: true });
}

function getMockupsDir() {
  ensureGeneratedDir()
  return generatedMockupsDir; 
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 500);
}

function cleanMockupCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  return Math.max(1, Math.min(count, 3));
}

function cleanupUploadedFile(filePath) {
  if (!filePath) return;

  try {
    fs.unlinkSync(filePath);
  } catch {}
}



// Creates the OpenAI client.
// The API key should be stored in your .env file as OPENAI_API_KEY.
// Never put the API key directly in frontend JavaScript.
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Main function that takes a user's uploaded vehicle image,
// optional decal preferences, and an output folder.
// It sends the image to OpenAI, generates a decal mockup,
// saves the returned image, and returns the saved file info.
export async function generateVehicleDecalMockup({
  imagePath,
  preferences = {},
  outputDir = getMockupsDir()
}) {
  // Makes sure the uploaded image path exists.
  // If the file is missing or the path is wrong, stop immediately.
  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error("Uploaded image file not found.");
  }

  // Creates the output folder if it does not already exist.
  // recursive: true allows nested folders to be created safely.
  fs.mkdirSync(outputDir, { recursive: true });

  // Pulls user preferences out of the preferences object.
  // If the user did not provide a value, these default values are used.
  const {
    decalStyle = "modern aggressive automotive vinyl decal design",
    colors = "gloss black with subtle copper accents",
    placement = "hood, side skirt, rear quarter panel, and lower body edges",
    intensity = "medium, not too loud",
    vehicleNotes = "",
    extraInstructions = "",
  } = preferences;

  // Builds the prompt that tells the AI exactly how to edit the image.
  // This is where the decal style, color, placement, and other user choices
  // get converted into instructions for the image model.
  const prompt = `
Edit the uploaded vehicle photo into a realistic automotive vinyl decal mockup.

Important:
- Keep the same exact vehicle.
- Keep the vehicle paint color, wheels, lighting, and background mostly unchanged.
- Do not turn it into a different car.
- Add decals only, like realistic installed vinyl.
- Make the decal edges clean and believable.
- Do not add fake text unless requested.

User preferences:
- Decal style: ${decalStyle}
- Colors: ${colors}
- Placement: ${placement}
- Intensity: ${intensity}
- Vehicle notes: ${vehicleNotes}
- Extra instructions: ${extraInstructions}

Make it look like a real customer preview for a custom decal/wrap shop.
`;

  // Opens the uploaded image from your server and converts it into
  // a file object that OpenAI's image edit API can receive.
  const imageFile = await toFile(fs.createReadStream(imagePath), null, {
    type: "image/png",
  });

  // Sends the uploaded image and prompt to OpenAI.
  // The AI edits the image and returns a new generated mockup image.
  const result = await client.images.edit({
    model: "gpt-image-2",
    image: imageFile,
    prompt,
    size: "1536x1024",
    quality: "medium",
  });

  // Gets the generated image data from the API response.
  // OpenAI returns the image as a base64 string.
  const imageBase64 = result.data[0].b64_json;

  // Creates a unique filename using the current timestamp.
  const fileName = `mockup-${Date.now()}.png`;

  // Builds the full save path for the generated mockup image.
  const outputPath = path.join(outputDir, fileName);

  // Converts the base64 image string into an actual PNG file
  // and saves it to your output folder.
  fs.writeFileSync(outputPath, Buffer.from(imageBase64, "base64"));

  // Returns info your backend can send back to the frontend.
  // fileName can be turned into a public URL like:
  // /generated-mockups/mockup-123456789.png
  return {
    success: true,
    outputPath,
    fileName,
    promptUsed: prompt,
  };
}
