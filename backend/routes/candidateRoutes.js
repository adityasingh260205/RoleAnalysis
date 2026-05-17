const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate'); 

// 1. Add a Candidate [POST /api/candidates]
router.post('/candidates', async (req, res) => {
    try {
        const newCandidate = new Candidate(req.body);
        await newCandidate.save(); 
        
        res.status(201).json({ message: "Candidate added successfully!", candidate: newCandidate });
    } catch (error) {
        res.status(500).json({ error: "Failed to add candidate", details: error.message });
    }
});

// 2. Get All Candidates [GET /api/candidates]
router.get('/candidates', async (req, res) => {
    try {
        const candidates = await Candidate.find(); 
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch candidates", details: error.message });
    }
});

// 3. Shortlist Candidates (Basic Logic) [POST /api/match]
router.post('/match', async (req, res) => {
    try {
        const { requiredSkills, minExperience } = req.body; 
        const candidates = await Candidate.find(); 

        let matchedCandidates = candidates
            .filter(candidate => candidate.experience >= minExperience) 
            .map(candidate => {
                const candData = candidate.toObject(); 
                
                // Convert required skills to lowercase and remove extra spaces
                const lowerReqSkills = requiredSkills.map(s => s.toLowerCase().trim());
                
                // Check if candidate skills match, ignoring case and spaces
                const matchedSkills = candData.skills.filter(skill =>
                    lowerReqSkills.includes(skill.toLowerCase().trim())
                );
                
                // Calculate match percentage
                const score = requiredSkills.length > 0 
                    ? (matchedSkills.length / requiredSkills.length) * 100 
                    : 0;

                return {
                    ...candData,
                    matchScore: Math.round(score) 
                };
            })
            .sort((a, b) => b.matchScore - a.matchScore); 

        res.status(200).json(matchedCandidates);
    } catch (error) {
        res.status(500).json({ error: "Matching logic failed", details: error.message });
    }
});

// 4. AI-Based Candidate Suggestion [POST /api/ai/shortlist]
router.post('/ai/shortlist', async (req, res) => {
    try {
        const { requiredSkills, minExperience, candidates } = req.body;

        const promptContent = `
            Job requires: ${requiredSkills.join(", ")} (${minExperience}+ years experience)
            Candidates:
            ${candidates.map((c, index) => `${index + 1}. ${c.name} - ${c.skills.join(", ")} - ${c.experience} years`).join('\n')}
            
            Rank candidates and explain why.
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", 
                messages: [
                    {
                        role: "user",
                        content: promptContent
                    }
                ]
            })
        });

        const data = await response.json();
        
        res.status(200).json({ 
            recommendation: data.choices[0].message.content 
        });

    } catch (error) {
        res.status(500).json({ error: "AI processing failed", details: error.message });
    }
});

// 5. Generate AI Interview Questions [POST /api/ai/interview]
router.post('/ai/interview', async (req, res) => {
    try {
        const { candidateName, skills, jobRole } = req.body;

        const promptContent = `
            You are a technical interviewer. Generate 3 sharp, technical interview questions for a candidate named ${candidateName}. 
            The candidate has experience in: ${skills.join(", ")}. 
            They are being interviewed for a role requiring: ${jobRole.join(", ")}.
            Keep the questions concise, practical, and directly related to their skills.
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", 
                messages: [
                    {
                        role: "user",
                        content: promptContent
                    }
                ]
            })
        });

        const data = await response.json();
        
        res.status(200).json({ 
            questions: data.choices[0].message.content 
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to generate interview questions", details: error.message });
    }
});
// 6. AI Chatbot Assistant [POST /api/ai/chat]
router.post('/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Fetch all candidates from the database to give the AI context
        const candidates = await Candidate.find(); 

        const promptContent = `
            You are a helpful HR assistant for the 'Jobanalysis' platform.
            Here is the current database of candidates:
            ${candidates.map(c => `- ${c.name}: ${c.experience} years exp, Skills: ${c.skills.join(', ')}`).join('\n')}
            
            Answer the following user query based ONLY on the candidate data provided above. Be concise and professional.
            User Query: "${message}"
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", 
                messages: [
                    { role: "system", content: "You are an HR Assistant." },
                    { role: "user", content: promptContent }
                ]
            })
        });

        const data = await response.json();
        
        res.status(200).json({ 
            reply: data.choices[0].message.content 
        });

    } catch (error) {
        res.status(500).json({ error: "Chatbot failed", details: error.message });
    }
});

module.exports = router;