const OpenAI = require("openai");
const { toFile } = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function editImageWithFallback({ client, rgbaBuffer, prompt }) {
  const configuredPrimary = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const configuredFallback = process.env.OPENAI_IMAGE_FALLBACK_MODEL || "gpt-image-1";
  const models = [...new Set([configuredPrimary, configuredFallback])];

  let lastError;

  for (const model of models) {
    try {
      const imageFile = await toFile(rgbaBuffer, "vehicle.png", {
        type: "image/png",
      });

      const result = await client.images.edit({
        model,
        image: imageFile,
        prompt,
        size: "1536x1024",
        quality: "medium",
      });

      const imageBase64 = result?.data?.[0]?.b64_json;
      if (!imageBase64) {
        throw new Error(`Image generation returned no image data for model ${model}.`);
      }

      return imageBase64;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || "");
      const isOrgVerificationError = Number(error?.status) === 403 && message.includes("must be verified");
      const isLastModel = model === models[models.length - 1];

      if (!isOrgVerificationError || isLastModel) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Image generation failed.");
}

function buildPrompt(preferences = {}) {
  const {
    decalStyle = "modern aggressive automotive vinyl decal design",
    colors = "gloss black with subtle copper accents",
    placement = "hood, side skirt, rear quarter panel, and lower body edges",
    intensity = "medium, not too loud",
    vehicleNotes = "",
    extraInstructions = "",
  } = preferences;

  return `
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
}

async function generateVehicleDecalMockup({
  imagePath,
  preferences = {},
  outputDir = "./generated-mockups",
  mockupCount = 1,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error("Uploaded image file not found.");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const prompt = buildPrompt(preferences);

  const created = [];
  const targetCount = Math.max(1, Math.min(Number(mockupCount) || 1, 3));

  for (let i = 0; i < targetCount; i += 1) {
    // gpt-image-2 requires RGBA PNG; convert upload in-memory
    const rgbaBuffer = await sharp(imagePath).ensureAlpha().png().toBuffer();
    const imageBase64 = await editImageWithFallback({
      client,
      rgbaBuffer,
      prompt,
    });

    const fileName = `mockup-${Date.now()}-${i + 1}.png`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, Buffer.from(imageBase64, "base64"));
    created.push({ fileName, outputPath });
  }

  return {
    success: true,
    files: created,
    promptUsed: prompt,
  };
}

module.exports = {
  generateVehicleDecalMockup,
};