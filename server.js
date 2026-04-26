require("dotenv").config();
const app = require("./src/app");

const hasExplicitPort = Boolean(process.env.PORT);
const basePort = Number(process.env.PORT || 3000);
const maxPortAttempts = hasExplicitPort ? 1 : 10;

function startServer(port, attemptsRemaining) {
  const server = app.listen(port, () => {
    if (port !== basePort) {
      console.warn(`Port ${basePort} was in use. Switched to ${port}.`);
    }
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsRemaining > 1) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort, attemptsRemaining - 1);
      return;
    }

    if (error.code === "EADDRINUSE") {
      console.error(`Unable to start server. Port ${port} is already in use.`);
    } else {
      console.error("Failed to start server:", error);
    }

    process.exit(1);
  });
}

startServer(basePort, maxPortAttempts);
