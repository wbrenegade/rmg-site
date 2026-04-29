const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { generateVehicleDecalMockup } = require("../../tools/decal_idea_generator/decal-idea-generator");

const jobs = new Map();
const JOB_TTL_MS = 30 * 60 * 1000;

function cleanupOldJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}

function setJob(jobId, updates) {
  const current = jobs.get(jobId);
  if (!current) return;
  jobs.set(jobId, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
}

async function runAIDecalMockupJob(jobId, { imagePath, preferences, outputDir, mockupCount }) {
  try {
    setJob(jobId, {
      status: "generating",
      message: "Generating AI decal mockup.",
    });

    const result = await generateVehicleDecalMockup({
      imagePath,
      preferences,
      outputDir,
      mockupCount,
    });

    const mockups = (result.files || []).map((file) => `/generated-mockups/${file.fileName}`);

    setJob(jobId, {
      status: "succeeded",
      success: true,
      mockups,
      message: "Mockup generation complete.",
    });
  } catch (error) {
    setJob(jobId, {
      status: "failed",
      success: false,
      error: error?.message || "Mockup generation failed.",
      message: error?.message || "Mockup generation failed.",
    });
  } finally {
    try {
      fs.unlinkSync(imagePath);
    } catch {
      // Ignore temp file cleanup errors.
    }
  }
}

function createAIDecalMockup(req, res, next) {
  try {
    cleanupOldJobs();

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "Vehicle image upload is required.",
      });
    }

    const outputDir = path.join(__dirname, "..", "..", "public", "generated-mockups");
    const preferences = {
      vehicleNotes: req.body.vehicleNotes,
      decalStyle: req.body.decalStyle,
      colors: req.body.colors,
      placement: req.body.placement,
      intensity: req.body.intensity,
      extraInstructions: req.body.extraInstructions,
    };

    const jobId = crypto.randomUUID();
    jobs.set(jobId, {
      id: jobId,
      status: "queued",
      success: true,
      mockups: [],
      message: "Mockup generation queued.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    runAIDecalMockupJob(jobId, {
      imagePath: req.file.path,
      preferences,
      outputDir,
      mockupCount: req.body.mockupCount,
    });

    return res.status(202).json({
      success: true,
      jobId,
      status: "queued",
      message: "Mockup generation started.",
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore temp file cleanup errors.
      }
    }

    return res.status(500).json({
      success: false,
      message: error?.message || "Mockup generation failed.",
    });
  }
}

function getAIDecalMockupJob(req, res) {
  cleanupOldJobs();

  const jobId = String(req.params.jobId || "");
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      status: "not_found",
      message: "Mockup job was not found or has expired.",
    });
  }

  return res.status(200).json({
    success: job.status !== "failed",
    jobId: job.id,
    status: job.status,
    mockups: job.mockups || [],
    message: job.message,
    error: job.error,
  });
}

module.exports = {
  createAIDecalMockup,
  getAIDecalMockupJob,
};
