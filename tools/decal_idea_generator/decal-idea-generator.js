const OpenAI = require("openai");
const { toFile } = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DEFAULT_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"];

function getImageEditModels() {
  const configuredModels = [
    process.env.OPENAI_IMAGE_MODEL,
    process.env.OPENAI_IMAGE_FALLBACK_MODEL,
    process.env.OPENAI_IMAGE_SECOND_FALLBACK_MODEL,
  ];

  return [...new Set([...configuredModels, ...DEFAULT_IMAGE_MODELS].filter(Boolean))];
}

function shouldTryNextModel(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const type = String(error?.type || "").toLowerCase();

  return (
    status === 404 ||
    code.includes("model") ||
    type.includes("model") ||
    message.includes("model") ||
    message.includes("unsupported") ||
    message.includes("must be verified")
  );
}

async function editImageWithFallback({ client, rgbaBuffer, prompt }) {
  const models = getImageEditModels();

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
        input_fidelity: "high",
      });

      const imageBase64 = result?.data?.[0]?.b64_json;
      if (!imageBase64) {
        throw new Error(`Image generation returned no image data for model ${model}.`);
      }

      return imageBase64;
    } catch (error) {
      lastError = error;
      const isLastModel = model === models[models.length - 1];

      if (!shouldTryNextModel(error) || isLastModel) {
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
  const rgbaBuffer = await sharp(imagePath)
    .rotate()
    .resize({
      width: 1536,
      height: 1536,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const created = [];
  const targetCount = Math.max(1, Math.min(Number(mockupCount) || 1, 3));

  for (let i = 0; i < targetCount; i += 1) {
    const imageBase64 = await editImageWithFallback({
      client,
      rgbaBuffer,
      prompt,
    });

    const fileName = `mockup-${Date.now()}-${i + 1}.png`;
    const outputPath = path.join(outputDir, fileName);
    const imageBuffer = Buffer.from(imageBase64, "base64");
    await sharp(imageBuffer).metadata();
    fs.writeFileSync(outputPath, imageBuffer);
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
