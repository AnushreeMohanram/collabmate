const User = require('../models/User'); 


const getUserProfile = async (req, res) => {
    try {
        
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


const updateUserProfile = async (req, res) => {
    const userId = req.user._id;
    const { name, email, avatar, skills, interests, preferences, aiPreferences } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        if (name !== undefined) user.name = name; 
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar; 

        
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

        
        if (interests !== undefined) {
            if (!Array.isArray(interests) || !interests.every(i => typeof i === 'string')) {
                return res.status(400).json({ message: 'Interests must be an array of strings.' });
            }
            user.interests = interests.map(i => i.trim());
        }


        
        if (preferences !== undefined) {
           
            if (preferences.notifications !== undefined) {
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

        

        await user.save(); 
        res.json({ message: 'Profile updated successfully', user: user.toObject({ getters: true, virtuals: false, virtuals: false }) });
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating profile' });
    }
};


const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                  $or: [
                      { name: { $regex: req.query.search, $options: 'i' } }, 
                      { email: { $regex: req.query.search, $options: 'i' } },
                      
                  ],
              }
            : {}; 

        
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
                                .select('name email avatar'); 

        res.json(users);
    } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ message: 'Server Error occurred during user search' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    searchUsers 
};