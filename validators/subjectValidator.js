import Joi from 'joi';

export const subjectValidationSchema = Joi.object({
    name: Joi.string().required(),
    code: Joi.number().required(),
    description: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.string().optional(),
})