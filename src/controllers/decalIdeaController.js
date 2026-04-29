const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { generateVehicleDecalMockup } = require("../../tools/decal_idea_generator/decal-idea-generator");

const jobs = new Map();
const JOB_TTL_MS = 30 * 60 * 1000;
const generatedMockupsDir = path.join(__dirname, "..", "..", "public", "generated-mockups");
const generatedMockupJobsDir = path.join(generatedMockupsDir, "job-results");

function createSafeRequestId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

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

function ensureGeneratedDirs() {
  fs.mkdirSync(generatedMockupsDir, { recursive: true });
  fs.mkdirSync(generatedMockupJobsDir, { recursive: true });
}

function getJobResultPath(id) {
  const safeId = createSafeRequestId(id);
  if (!safeId) return "";
  return path.join(generatedMockupJobsDir, `${safeId}.json`);
}

function writeJobResult(ids, payload) {
  ensureGeneratedDirs();

  [...new Set(ids.filter(Boolean).map(createSafeRequestId).filter(Boolean))].forEach((id) => {
    fs.writeFileSync(getJobResultPath(id), JSON.stringify(payload, null, 2));
  });
}

function readJobResult(id) {
  const filePath = getJobResultPath(id);
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function findGeneratedMockupsByRequestId(requestId) {
  const safeRequestId = createSafeRequestId(requestId);
  if (!safeRequestId || !fs.existsSync(generatedMockupsDir)) return [];

  return fs.readdirSync(generatedMockupsDir)
    .filter((fileName) => fileName.startsWith(`mockup-${safeRequestId}-`) && fileName.endsWith(".png"))
    .sort()
    .map((fileName) => `/generated-mockups/${fileName}`);
}

function findRecentGeneratedMockups(sinceMs) {
  const since = Number(sinceMs || 0);
  if (!fs.existsSync(generatedMockupsDir)) return [];

  return fs.readdirSync(generatedMockupsDir)
    .filter((fileName) => fileName.startsWith("mockup-") && fileName.endsWith(".png"))
    .map((fileName) => {
      const filePath = path.join(generatedMockupsDir, fileName);
      const stat = fs.statSync(filePath);
      return {
        fileName,
        createdAt: stat.mtimeMs,
        url: `/generated-mockups/${fileName}`,
      };
    })
    .filter((file) => !Number.isFinite(since) || since <= 0 || file.createdAt >= since)
    .sort((left, right) => right.createdAt - left.createdAt)
    .map((file) => file.url)
    .slice(0, 3);
}

async function runAIDecalMockupJob(jobId, { imagePath, preferences, outputDir, mockupCount, requestId }) {
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
      requestId,
    });

    const mockups = (result.files || []).map((file) => `/generated-mockups/${file.fileName}`);
    const payload = {
      success: true,
      jobId,
      requestId,
      status: "succeeded",
      mockups,
      message: "Mockup generation complete.",
    };

    setJob(jobId, {
      ...payload,
    });

    writeJobResult([jobId, requestId], payload);
    return payload;
  } catch (error) {
    const payload = {
      jobId,
      requestId,
      status: "failed",
      success: false,
      error: error?.message || "Mockup generation failed.",
      message: error?.message || "Mockup generation failed.",
      mockups: [],
    };

    setJob(jobId, payload);
    writeJobResult([jobId, requestId], payload);
    return payload;
  } finally {
    try {
      fs.unlinkSync(imagePath);
    } catch {
      // Ignore temp file cleanup errors.
    }
  }
}

async function createAIDecalMockup(req, res, next) {
  try {
    cleanupOldJobs();

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "Vehicle image upload is required.",
      });
    }

    ensureGeneratedDirs();
    const outputDir = generatedMockupsDir;
    const requestId = createSafeRequestId(req.body.requestId || crypto.randomUUID());
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
      requestId,
      mockups: [],
      message: "Mockup generation queued.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await runAIDecalMockupJob(jobId, {
      imagePath: req.file.path,
      preferences,
      outputDir,
      mockupCount: req.body.mockupCount,
      requestId,
    });

    return res.status(result.success ? 200 : 500).json(result);
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
  const storedResult = readJobResult(jobId);
  const generatedMockups = findGeneratedMockupsByRequestId(jobId);

  if (storedResult) {
    return res.status(200).json(storedResult);
  }

  if (!job && generatedMockups.length) {
    return res.status(200).json({
      success: true,
      jobId,
      requestId: jobId,
      status: "succeeded",
      mockups: generatedMockups,
      message: "Mockup generation complete.",
    });
  }

  if (!job) {
    return res.status(200).json({
      success: true,
      jobId,
      requestId: jobId,
      status: "pending",
      mockups: [],
      message: "Mockup generation is still pending.",
    });
  }

  return res.status(200).json({
    success: job.status !== "failed",
    jobId: job.id,
    requestId: job.requestId,
    status: job.status,
    mockups: (job.mockups && job.mockups.length) ? job.mockups : generatedMockups,
    message: job.message,
    error: job.error,
  });
}

function listRecentAIDecalMockups(req, res) {
  const mockups = findRecentGeneratedMockups(req.query.since);

  return res.status(200).json({
    success: true,
    status: mockups.length ? "succeeded" : "pending",
    mockups,
    message: mockups.length ? "Recent mockups found." : "No recent mockups found yet.",
  });
}

module.exports = {
  createAIDecalMockup,
  getAIDecalMockupJob,
  listRecentAIDecalMockups,
};
