const fs = require("fs");
const path = require("path");
const { generateVehicleDecalMockup } = require("../../tools/decal_idea_generator/decal-idea-generator");

async function createAIDecalMockup(req, res, next) {
  try {
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

    const result = await generateVehicleDecalMockup({
      imagePath: req.file.path,
      preferences,
      outputDir,
      mockupCount: req.body.mockupCount,
    });

    const mockups = (result.files || []).map((file) => `/generated-mockups/${file.fileName}`);

    try {
      fs.unlinkSync(req.file.path);
    } catch {
      // Keep request successful even if temp file cleanup fails.
    }

    return res.status(200).json({
      success: true,
      mockups,
      message: "Mockup generation complete.",
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

module.exports = {
  createAIDecalMockup,
};
