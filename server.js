require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
  });

  // Graceful crash handling
  process.on("unhandledRejection", (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
});
