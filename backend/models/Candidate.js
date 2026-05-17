const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: String,
    email: String,
    skills: [String],
    experience: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', CandidateSchema);