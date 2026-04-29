const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { generateVehicleDecalMockup } = require("../../tools/decal_idea_generator/decal-idea-generator");

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
  } catch {
    // Ignore cleanup errors.
  }
}

async function createAIDecalMockup(req, res) {
  let uploadedPath = req.file?.path;

  try {
    if (!uploadedPath) {
      return res.status(400).json({
        success: false,
        message: "Vehicle image upload is required.",
      });
    }

    ensureGeneratedDir();

    const requestId = crypto.randomUUID();

    const preferences = {
      vehicleNotes: cleanText(req.body.vehicleNotes),
      decalStyle: cleanText(req.body.decalStyle, "custom automotive vinyl decal design"),
      colors: cleanText(req.body.colors, "clean colors that match the vehicle"),
      placement: cleanText(req.body.placement, "best-looking decal placement on the vehicle"),
      intensity: cleanText(req.body.intensity, "medium, clean, realistic"),
      extraInstructions: cleanText(req.body.extraInstructions),
    };

    const mockupCount = cleanMockupCount(req.body.mockupCount);

    const result = await generateVehicleDecalMockup({
      imagePath: uploadedPath,
      preferences,
      outputDir: generatedMockupsDir,
      mockupCount,
      requestId,
    });

    const mockups = Array.isArray(result.files)
      ? result.files.map((file) => `/generated-mockups/${file.fileName}`)
      : [];

    if (!mockups.length) {
      return res.status(500).json({
        success: false,
        message: "The AI finished, but no mockup image was saved.",
      });
    }

    return res.status(200).json({
      success: true,
      requestId,
      mockups,
      message: "Mockup generation complete.",
    });
  } catch (error) {
    console.error("AI decal mockup error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Mockup generation failed.",
    });
  } finally {
    cleanupUploadedFile(uploadedPath);
  }
}

module.exports = {
  createAIDecalMockup,
};