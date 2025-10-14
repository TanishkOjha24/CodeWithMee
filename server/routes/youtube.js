const express = require('express');
const router = express.Router();
const axios = require('axios');
const YouTubeCache = require('../models/YouTubeCache'); // Import the new cache model

// --- API Key Rotation Setup ---
const apiKeys = (process.env.YOUTUBE_API_KEYS || '').split(',').filter(key => key.trim());
let currentKeyIndex = 0;

if (apiKeys.length === 0) {
    console.error("FATAL: No YouTube API keys found in .env file under YOUTUBE_API_KEYS");
}

const getApiKey = () => {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    return key;
};

// --- Main Search Route ---
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        // --- Caching Logic (Option 2) ---
        const cachedResult = await YouTubeCache.findOne({ query: q });

        if (cachedResult) {
            console.log(`✅ CACHE HIT for "${q}". Video ID: ${cachedResult.videoId}`);
            return res.json({ videoId: cachedResult.videoId });
        }

        console.log(`❌ CACHE MISS for "${q}". Fetching from YouTube API...`);
        
        // --- API Key Rotation Logic (Option 1) ---
        if (apiKeys.length === 0) {
            return res.status(500).json({ error: 'Server is not configured with YouTube API keys.' });
        }

        const url = `https://www.googleapis.com/youtube/v3/search`;
        let attempts = 0;

        while (attempts < apiKeys.length) {
            const apiKey = getApiKey();
            const keyNumber = (currentKeyIndex + apiKeys.length - 1) % apiKeys.length + 1;
            console.log(`Using YouTube API Key #${keyNumber}`);

            try {
                const response = await axios.get(url, {
                    params: { part: 'snippet', q, type: 'video', maxResults: 1, key: apiKey },
                });

                if (response.data.items && response.data.items.length > 0) {
                    const videoId = response.data.items[0].id.videoId;
                    console.log(`YouTube for "${q}" found video ID: ${videoId}`);

                    // Save the new result to the cache
                    const newCacheEntry = new YouTubeCache({ query: q, videoId: videoId });
                    await newCacheEntry.save();
                    console.log(`💾 Saved to cache: "${q}" -> ${videoId}`);
                    
                    return res.json({ videoId });
                } else {
                    return res.status(404).json({ error: 'No video found.' });
                }

            } catch (error) {
                const isQuotaError = error.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded';

                console.error('--- YouTube API Error ---');
                if(error.response) console.error('Status:', error.response.status, 'Data:', JSON.stringify(error.response.data, null, 2));
                else console.error('Error:', error.message);
                console.error('--- End YouTube API Error ---');

                if (isQuotaError) {
                    attempts++;
                    console.warn(`⚠️ Quota exceeded for key. Trying next key... (${attempts}/${apiKeys.length})`);
                    if (attempts >= apiKeys.length) {
                         console.error("All YouTube API keys have exceeded their quota.");
                         return res.status(429).json({ error: 'All available API keys have exceeded their daily quota.' });
                    }
                } else {
                    return res.status(500).json({ error: 'Failed to fetch video from YouTube API.' });
                }
            }
        }
    } catch (dbError) {
        console.error("--- Database Error ---", dbError);
        res.status(500).json({ error: 'A database error occurred.' });
    }
});

module.exports = router;