import Campus from '../models/Campus.js'

export const createCampus = async (req, res) => {
    try {
        const { name, code, address, city, location, contact, campusAdmin } = req.body
        const existingCampus = await Campus.findOne({ code })
        if (existingCampus) return res.status(400).json({ error: "Campus with this code already exists" })
        const newCampus = await Campus.create({
            name,
            code,
            address,
            city,
            location,
            contact,
            campusAdmin
        })
        res.status(201).json(newCampus)
    } catch (error) {
        res.status(400).json({error: error})
    }
}

export const getAllCampuses = async(req,res) => {
    const { page = 1, limit = 5 } = req.query
    const skip = parseInt(page - 1) * parseInt(limit)
    const totalCampuses = await Campus.countDocuments()
    const campuses = await Campus.aggregate([
        {
            $lookup: {
                from: 'classes',
                localField: '_id',
                foreignField: 'campus',
                as: 'classes'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'campus',
                as: 'users'
            }
        },
        {
            $addFields: {
                classesCount: { $size: '$classes' },
                teachersCount: { 
                    $size: {
                        $filter: {
                            input: '$users',
                            as: 't',
                            cond: { $eq: ['$$t.role', 'teacher'] }
                        }
                    }
                 },
                 studentsCount: {
                    $size: {
                        $filter: {
                            input: '$users',
                            as: 's',
                            cond: { $eq: [ '$$s.role', 'students' ] }
                        }
                    }
                 }
            }
        },
        {
            $project: {
                classes: 0,
                users: 0
            }
        },
        { $sort: {createdAt: -1} },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ])
    if(!campuses) return res.status(404).json({error: "Campuses not found"})
    res.json({
        totalCampuses: totalCampuses,
        page: parseInt(page),
        limit: parseInt(limit),
        campuses
    })
}


//remaining work = .virtuals() as campus schema doesn't have students, teachers and class field OR implement aggregation pipeline through lookup and pipeline
export const getCampusById = async(req,res) => {
    const { id } = req.params
    const campus = await Campus.findById(id)
    if(!campus) return res.status(404).json({error: "Campus not found"})
    res.json(campus)
}