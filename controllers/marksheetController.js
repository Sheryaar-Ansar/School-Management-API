import Marksheet from "../models/Marksheet.js"
import Class from "../models/Class.js"
import Campus from "../models/Campus.js"

export const getStudentMarksheet = async (req, res) => {
    try {
        const { studentId, classId, campusId, term, academicSession,page = 1, limit = 10} = req.query
        const { role, _id: userId } = req.user

        let filter = {}

        if(role === 'student'){
            filter.student = userId
        }
        else if(role === 'teacher'){
            const classTeacher = await Class.findOne({ classTeacher: userId, isActive: true })
            if(!classTeacher){
                return res.status(403).json({ message: "You are not assigned as class teacher to any class" })
            }
            if(classId && classId !== classTeacher._id.toString()){
                return res.status(403).json({ message: "You can only access marksheets of your class" })
            }
            filter.class = classTeacher._id
            if(studentId){
                filter.student = studentId
            }
        }else if(role === 'campus-admin'){
            const campus = await Campus.findOne({ campusAdmin: userId, isActive: true })
            if(!campus){
                return res.status(403).json({ message: "You are not assigned as campus admin to any campus" })
            }
            if(campusId && campusId !== campus._id.toString()){
                return res.status(403).json({ message: "You can only access marksheets of your campus" })
            }
            const classes = await Class.find({ campus: campus._id, isActive: true }, '_id')
            const classIds = classes.map(c => c._id)
            filter.class = { $in: classIds }
            if(classId){
                filter.class = classId
            }if(studentId){
                filter.student = studentId
            }
        }else if(role === 'super-admin'){
            if(campusId){
                const classes = await Class.find({ campus: campusId, isActive: true }, '_id')
                const classIds = classes.map(c => c._id)
                filter.class = { $in: classIds }
            }
            if(classId){
                filter.class = classId
            }
            if(studentId){
                filter.student = studentId
            }
        }
        if(term){
            filter.term = term
        }if(academicSession){
            filter.academicSession = academicSession
        }
        const skip = (page - 1) * limit
        const total = await Marksheet.countDocuments(filter)
        const marksheets = await Marksheet.find(filter)
        .populate('student', 'name email')
        .populate('class', 'grade section')
        .populate('subjects', 'name')
        .sort({ overallPercentage: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        res.json({
            totalMarksheets: total,
            page: parseInt(page),
            limit: parseInt(limit),
            marksheets
            
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}