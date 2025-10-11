import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().required(),
    gender: Joi.string().valid('Male', 'Female').required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    contact: Joi.string().required(),
    address: Joi.string().optional(),
    dob: Joi.date().required(),
    role: Joi.string().valid( 'campus-admin', 'teacher', 'student').optional(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.string().optional() 
})