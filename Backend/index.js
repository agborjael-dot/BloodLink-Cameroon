const app = require("./app");
const dotenv = require("dotenv");
const { dbConnection } = require("./utils/db");

dotenv.config();

const PORT = process.env.PORT || 8001;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await dbConnection();
});
