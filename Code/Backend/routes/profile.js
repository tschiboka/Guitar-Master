const express = require("express");                                // RESTful Middleware
const mongoose = require("mongoose");                              // Database Handling
const { Achievement } = require("../models/achievement");
const router = express.Router();                                   // Router Middleware
const { Profile, validate } = require("../models/profile");        // Get User Model and Validation
const { User } = require("../models/user")                         // Get Profile Model
const auth = require("../middleware/auth");                        // Get JWT Authentication Middleware
const admin = require("../middleware/admin");                      // Admin Middleware



router.get("/:id", auth, async(req, res) => {                      // GET: ID (Get Profile with User ID)
    // Validate ID
    const id = req.params.id;                                      // ID Parameter
    const isValidID = mongoose.Types.ObjectId.isValid(id);         // Validate ID Casting
    const messageID = `Couldn't Cast ${ id } to DB _id`;           // ID Cast Error Message
    const jsonCastErr = { success: false, error: messageID };      // JSON Cast Error Object
    if (!isValidID) return res.status(400).json(jsonCastErr);      // Return 400 ID Cast Error
    
    // Find If Profile Exists with IserID
    const profile = await Profile.findById(id);                    // Get Profile by UserID
    const profMsg = `Could Not Find Profile with ID: ${ id }`;     // Profile Exists Message
    const profJson = { success: false, message: profMsg };         // Profile Exists Message
    if (!profile) return res.status(403).json(profJson);           // Return 404 Resource Not Found

    // Find User Profile
    res.status(200).json({ success: true, profile });              // Return 200 Success
});



router.post("/", auth, async (req, res) => {                       // POST
    // Validate User Body
    if (!req.body) return res.status(400).json( { success: false, message: `There is no request body!` } );
    const { error } = validate(req.body);                          // Validate User Body
    const message400 = error?.details[0].message;                  // Invalid Body Message
    const json400 = { success: false, message: message400 };       // Invalid Body Object
    if (error) return res.status(400).send(json400);               // Return 400 Invalid Body   

    // Try Cast User ID
    const userID = req.user._id;                                   // Get ID Parameter
    const isValidID = mongoose.Types.ObjectId.isValid(userID)      // Validate ID Casting
    const messageID = `Couldn't Cast ${ userID } to DB _id`;       // ID Cast Error Message
    const jsonCastErr = { success: false, error: messageID };      // JSON Cast Error Object
    if (!isValidID) return res.status(400).json(jsonCastErr);      // Return 400 ID Cast Error

    // Find If User Does Not Exists with UserID
    const user = await User.findById(userID);                      // Existing User Object
    const noUserMsg =`Couldn't Find User with ID: ${ userID }`;    // No User with userID Message
    const noUserJson = { success: false, message: noUserMsg };     // No User with userID JSON
    if (!user) return res.status(404).json(noUserJson);            // Return 404 Resource Not Found
    
    // Find If Profile Exists with UserID
    const profileExist = await Profile.find({ userID });           // Get Profile by UserID
    const profMsg = `Profile Already Exists with UserID: ${ userID }`; // Profile Exists Message
    const profJson = { success: false, message: profMsg };         // Profile Exists Message
    if (profileExist.length) return res.status(403).json(profJson);    // Return 403 Resource Exists
    
    // Create User Profile
    const profile = new Profile(req.body);                         // New Profile Object
    await profile.save();                                          // Save
    res.status(201).json({ success: true, profile });              // Return 201 Created and Success
});



router.put("/:id", auth, async (req, res) => {                     // PUT: ID
    // Validate User Body
    if (!req.body) return res.status(400).json( { success: false, message: `There is no request body!` } );
    const { error } = validate(req.body);                          // Validate User Body
    const message400 = error?.details[0].message;                  // Invalid Body Message
    const json400 = { success: false, message: message400 };       // Invalid Body Object
    if (error) return res.status(400).send(json400);               // Return 400 Invalid Body   

    // Try Cast User ID
    const userID = req.user._id;                                   // Get ID Parameter
    const isValidID = mongoose.Types.ObjectId.isValid(userID)      // Validate ID Casting
    const messageID = `Couldn't Cast ${ userID } to DB _id`;       // ID Cast Error Message
    const jsonCastErr = { success: false, error: messageID };      // JSON Cast Error Object
    if (!isValidID) return res.status(400).json(jsonCastErr);      // Return 400 ID Cast Error
    
    // Find If User Does Not Exists with UserID
    const user = await User.findById(userID);                      // Existing User Object
    const noUserMsg =`Couldn't Find User with ID: ${ userID }`;    // No User with userID Message
    const noUserJson = { success: false, message: noUserMsg };     // No User with userID JSON
    if (!user) return res.status(404).json(noUserJson);            // Return 404 Resource Not Found
    
    // Authenticate User
    const jwtUserID = req.user._id;
    if (jwtUserID !== userID) return res.status(401)  // User Has No Permission to Modify Profile
        .json({ success: false, message: `Access Denied: JWT UserID Does Not Match Request User ID` })
    
    // Find If Profile Exists with ID
    const id = req.params.id;                                      // Get Profile ID
    const profile = await Profile.findById(id);                    // Get Profile by UserID
    const profMsg = `Couldn't Find Profile with ID: ${ id }`;      // Profile Exists Message
    const profJson = { success: false, message: profMsg };         // Profile Exists Message
    if (!profile) return res.status(404).json(profJson);           // Return 404 Resource Not Found

    // Check Achievement IDS
    const achievementsBefore = JSON.stringify(req.body.achievements); // Stringify for Comparision
    const achievementsAfter = JSON.stringify(profile.achievements);
    if (achievementsBefore !== achievementsAfter) {                // Achevements Changed
        profile.achievements = [];
        const achievements = [];                                 
        for (let i = 0; i < req.body.achievements.length; i++) {   // Traverse Achievements
            const a_id = req.body.achievements[i];                 // Get ID
            const validID = mongoose.Types.ObjectId.isValid(a_id); // Is Valid ID
            const invalidJSON = {                                  // Error JSON
                success: false,
                message: `Invalid Achievment ID: ${ a_id }`
            };
            if (!validID) return res.status(400).json(invalidJSON);// Return 400 if Invalid ID

            const achievement = await Achievement.findById(a_id);  // Get Achievements
            if (!achievement) {                                    // If No Achievement Record
                const noAchievementIdJson = {
                    success: false,
                    message: `Couldn't Find Achievement with ID: ${ a_id }`
                }
                return res.status(404).json(noAchievementIdJson);  // Return 404 Invalid Achievement ID
            }

            profile.achievements.push(a_id);
            
        }
        profile.achievement = achievements;                        // Modify Achievements
    }

    // Modify Profile Attributes
    profile.userID = req.body.userID || profile.userID;            // Rewrite UserID
    profile.firstName = req.body.firstName || profile.firstName;   // Rewrite First Name
    profile.lastName = req.body.lastName || profile.lastName;      // Rewrite Last Name
    profile.dateOfBirth = req.body.dateOfBirth || profile.dateOfBirth;    // Rewrite DoB
    profile.gender = req.body.gender || profile.gender;            // Rewrite Gender
    profile.country = req.body.country || profile.country;         // Rewrite Country
    profile.province = req.body.province || profile.province;      // Rewrite Province
    profile.city = req.body.city || profile.city;                  // Rewrite City
    profile.postCode = req.body.postCode || profile.postCode;      // Rewrite PostCode
    profile.addressLine1 = req.body.addressLine1 || profile.addressLine1;  // Rewrite Address Line 1
    profile.addressLine2 = req.body.addressLine2 || profile.addressLine2;  // Rewrite Address Line 2
    profile.accountType = req.body.accountType || profile.accountType;     // Rewrite Account Type
    await profile.save();

    const updated = await Profile.findById(id).populate("achievements");   // Populate the Updated Profile with Achievements
    return res.status(201).json({ success:true, profile: updated });// Return 201 and User: Successfully Modified
});



router.delete("/:id", [auth, admin], (req, res) => {               // DELETE Profile with UserID

});

module.exports = router;