const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { generateVehicleDecalMockup } = require("../../tools/decal_idea_generator/decal-idea-generator");

const jobs = new Map();

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
  } catch {}
}

function updateJob(jobId, updates) {
  const current = jobs.get(jobId);
  if (!current) return;

  jobs.set(jobId, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
}

async function runAIDecalMockupJob(jobId, options) {
  try {
    updateJob(jobId, {
      status: "generating",
      message: "Generating AI decal mockup.",
    });

    const result = await generateVehicleDecalMockup(options);

    const mockups = Array.isArray(result.files)
      ? result.files.map((file) => `/generated-mockups/${file.fileName}`)
      : [];

    updateJob(jobId, {
      success: true,
      status: "succeeded",
      mockups,
      message: "Mockup generation complete.",
    });
  } catch (error) {
    console.error("AI decal mockup error:", error);

    updateJob(jobId, {
      success: false,
      status: "failed",
      mockups: [],
      error: error?.message || "Mockup generation failed.",
      message: error?.message || "Mockup generation failed.",
    });
  } finally {
    cleanupUploadedFile(options.imagePath);
  }
}

async function createAIDecalMockup(req, res) {
  const uploadedPath = req.file?.path;

  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      message: "Vehicle image upload is required.",
    });
  }

  ensureGeneratedDir();

  const jobId = crypto.randomUUID();
  const requestId = crypto.randomUUID();

  const preferences = {
    vehicleNotes: cleanText(req.body.vehicleNotes),
    decalStyle: cleanText(req.body.decalStyle, "custom automotive vinyl decal design"),
    colors: cleanText(req.body.colors, "clean colors that match the vehicle"),
    placement: cleanText(req.body.placement, "best-looking decal placement on the vehicle"),
    intensity: cleanText(req.body.intensity, "medium, clean, realistic"),
    extraInstructions: cleanText(req.body.extraInstructions),
  };

  jobs.set(jobId, {
    id: jobId,
    requestId,
    success: true,
    status: "queued",
    mockups: [],
    message: "Mockup generation started.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  runAIDecalMockupJob(jobId, {
    imagePath: uploadedPath,
    preferences,
    outputDir: generatedMockupsDir,
    mockupCount: cleanMockupCount(req.body.mockupCount),
    requestId,
  });

  return res.status(202).json({
    success: true,
    jobId,
    requestId,
    status: "queued",
    message: "Mockup generation started.",
  });
}

function getAIDecalMockupJob(req, res) {
  const jobId = req.params.jobId;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      status: "not_found",
      message: "Mockup job not found.",
    });
  }

  return res.status(200).json(job);
}

module.exports = {
  createAIDecalMockup,
  getAIDecalMockupJob,
};