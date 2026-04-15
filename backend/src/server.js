const app = require("./app");
const env = require("./config/env");

const startServer = async () => {
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();
