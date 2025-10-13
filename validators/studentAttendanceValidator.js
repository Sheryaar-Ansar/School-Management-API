import Joi from 'joi';

export const studentAssignmentSchema = Joi.object({
    classId: Joi.string().required(),
    records: Joi.array().items(Joi.object({
        rollNumber: Joi.number().required,
        status: Joi.string().valid('present', 'absent', 'leave').required()
    }))
})