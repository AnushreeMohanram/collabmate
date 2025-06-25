// server/controllers/userController.js
const User = require('../models/User'); // IMPORTANT: Make sure this path is correct to your User model

// @desc    Get current user's profile details
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // req.user._id is populated by your authMiddleware after successful token verification
        // Select all fields except password, and also exclude AI usage and activity details for a standard profile fetch
        const user = await User.findById(req.user._id).select('-password -aiUsage -activity');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const userId = req.user._id;
    // Destructure top-level fields from your User model
    const { name, email, avatar, skills, interests, preferences, aiPreferences } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update basic user fields directly
        if (name !== undefined) user.name = name; // Direct field
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar; // Direct field

        // Handle 'skills' array (array of objects {name, level, verified}) directly on User
        if (skills !== undefined) {
            if (!Array.isArray(skills) || !skills.every(s => typeof s === 'object' && s.name && typeof s.name === 'string')) {
                return res.status(400).json({ message: 'Skills must be an array of objects with a "name" property.' });
            }
            user.skills = skills.map(s => ({
                name: s.name.trim(),
                level: s.level || 'beginner',
                verified: s.verified || false
            }));
        }

        // Handle 'interests' array (array of strings) directly on User
        if (interests !== undefined) {
            if (!Array.isArray(interests) || !interests.every(i => typeof i === 'string')) {
                return res.status(400).json({ message: 'Interests must be an array of strings.' });
            }
            user.interests = interests.map(i => i.trim());
        }


        // --- Handle Nested 'preferences' Object ---
        if (preferences !== undefined) {
            // Use Object.assign for nested objects to merge properties rather than overwrite the whole subdocument
            if (preferences.notifications !== undefined) {
                // Ensure notifications object exists first if not already initialized by schema default
                if (!user.preferences) user.preferences = {};
                if (!user.preferences.notifications) user.preferences.notifications = {};
                Object.assign(user.preferences.notifications, preferences.notifications);
            }
            if (preferences.theme !== undefined) {
                if (!user.preferences) user.preferences = {};
                user.preferences.theme = preferences.theme;
            }
            if (preferences.language !== undefined) {
                if (!user.preferences) user.preferences = {};
                user.preferences.language = preferences.language;
            }
        }

        // --- Handle Nested 'aiPreferences' Object ---
        if (aiPreferences !== undefined) {
            if (aiPreferences.suggestionFrequency !== undefined) {
                if (!user.aiPreferences) user.aiPreferences = {};
                user.aiPreferences.suggestionFrequency = aiPreferences.suggestionFrequency;
            }
            if (aiPreferences.projectRecommendations !== undefined) {
                if (!user.aiPreferences) user.aiPreferences = {};
                user.aiPreferences.projectRecommendations = aiPreferences.projectRecommendations;
            }
            if (aiPreferences.skillMatching !== undefined) {
                if (!user.aiPreferences) user.aiPreferences = {};
                user.aiPreferences.skillMatching = aiPreferences.skillMatching;
            }
        }

        // Note: aiUsage and activity fields are typically updated via dedicated methods on the User model
        // (like user.updateActivity or user.updateAIUsage), not directly through a profile update API.
        // So, they are not handled here.

        await user.save(); // Save the updated user document
        // Return the updated user object, excluding password and specific sensitive/large fields
        res.json({ message: 'Profile updated successfully', user: user.toObject({ getters: true, virtuals: false, virtuals: false }) });
    } catch (error) {
        console.error('Error updating user profile:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Search for users
// @route   GET /api/users?search=:keyword
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                  $or: [
                      { name: { $regex: req.query.search, $options: 'i' } }, // Search by 'name' field
                      { email: { $regex: req.query.search, $options: 'i' } },
                      // If you want to search by skills, it would be more complex
                      // Example: { 'skills.name': { $regex: req.query.search, $options: 'i' } }
                  ],
              }
            : {}; // If no search term, return an empty object to match nothing (safer default)

        // Find users matching the keyword.
        // Exclude the currently authenticated user (req.user._id) from the search results.
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
                                .select('name email avatar'); // <--- IMPORTANT: Select 'name' and 'avatar' directly

        res.json(users);
    } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ message: 'Server Error occurred during user search' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    searchUsers // Export the searchUsers function
};