const Joi = require("joi");                                        // Use Joi for Validation
Joi.objectId = require('joi-objectid')(Joi);                       // Use for Validating MongoDB ObjectIDs
const mongoose = require("mongoose");                              // Database Handling
const schema = new mongoose.Schema({
    email: {                                                       // EMAIL: STRING REQUIRED, UNIQUE, MAX: 255
        type: String, 
        required: true, 
        unique: true,
        maxlenght: 255,
        trim: true,
        lowercase: true,
    },         
    userName: {                                                    // USERNAME: STRING, REQUIRED, UNIQUE, MIN: 5, MAX: 20
        type: String, 
        required: true,
        unique: true,
        minlength: 5,
        maxlenght: 20,
        trim: true,
    },
    password: {                                                    // PASSWORD: STRING, REQUIRED, MAX: 255
        type: String, 
        required: true,
        maxlenght: 255,
        trim: true
    },
    date: { type: Date, default: Date.now() },                     // DATE: DATE DEFAULT NOW
    updated: { type: Date, default: Date.now() },                  // UPDATED: DATE DEFAULT NOW
    lastLogin: Date,                                               // LASTLOGIN: DATE
    active: { type: Boolean, default: false },                     // ACTIVE: BOOL DEFAULT FALSE
    admin: { type: Boolean, default: false },                      // ADMIN: BOOL DEFAULT FALSE
});
const User = mongoose.model("User", schema);




function validate(user) {
    const schema = {
        email: Joi.string().required().email({ tlds: { allow: false } }),
        userName: Joi.string().required().min(5).max(20),
        password: Joi.string().required().max(255),
        date: Joi.date(),
        updated: Joi.date(),
        lastLogin: Joi.date(),
        active: Joi.boolean(),
        admin: Joi.boolean(),
    }

    return Joi.validate(user, schema);
}



exports.User = User;
exports.validate = validate;