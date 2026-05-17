const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- NEW CODE: Connect the routes ---
const candidateRoutes = require('./routes/candidateRoutes');
app.use('/api', candidateRoutes); // This prefixes all routes in that file with /api
// ------------------------------------

app.get('/', (req, res) => {
    res.send('Candidate Shortlisting API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});