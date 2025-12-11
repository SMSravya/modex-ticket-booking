const express = require("express");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/admin");
const showRoutes = require("./routes/shows");
const bookRoutes = require("./routes/book");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/admin", adminRoutes);
app.use("/shows", showRoutes);
app.use("/book", bookRoutes);

app.get("/", (req, res) => {
  res.send("Ticket Booking Backend Running 🚀");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
