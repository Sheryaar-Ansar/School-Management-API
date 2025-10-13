import Joi from 'joi'

export const scoreValidation = Joi.object({
    studentId: Joi.string().required(),
    campusId: Joi.string().required(),
    classId: Joi.string().required(),
    subjectId: Joi.string().required(),
    examId: Joi.string().required(),
    marksObtained: Joi.number().required(),
    remarks: Joi.string().optional(),
    enteredBy: Joi.string().optional()
})