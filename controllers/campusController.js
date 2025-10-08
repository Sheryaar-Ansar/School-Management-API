import mongoose from 'mongoose'
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
        res.status(400).json({ error: error })
    }
}

export const getAllCampuses = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query
        const skip = parseInt(page - 1) * parseInt(limit)
        const deletedCampus = await Campus.countDocuments({ isActive: false })
        const totalCampuses = await Campus.countDocuments()
        const campuses = await Campus.aggregate([
            { $match: {isActive: true} },
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
                                cond: { $eq: ['$$s.role', 'students'] }
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
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ])
        if (!campuses) return res.status(404).json({ error: "Campuses not found" })
        res.json({
            totalCampuses: totalCampuses,
            inActiveCampuses: deletedCampus,
            page: parseInt(page),
            limit: parseInt(limit),
            campuses
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



//remaining work = .virtuals() as campus schema doesn't have students, teachers and class field OR implement aggregation pipeline through lookup and pipeline
//done (Y)
export const getCampusById = async (req, res) => {
    try {
        const { id } = req.params
        const campus = await Campus.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
                    teacher: {
                        $filter: {
                            input: '$users',
                            as: 't',
                            cond: { $eq: ['$$t.role', 'teacher'] }
                        }
                    },
                    students: {
                        $filter: {
                            input: '$users',
                            as: 's',
                            cond: { $eq: ['$$s.role', 'student'] }
                        }
                    }
                }
            },
            { $project: { users: 0 } }
        ])
        if (!campus.length) return res.status(404).json({ error: "Campus not found" })
        res.json(campus[0])
    } catch (error) {
        res.status(500).json({error: error.message})
    }

}

export const updateCampusDetailsById = async (req,res) => {
    try {
    const { id } = req.params
    const { name, code, address, city, location, contact, campusAdmin } = req.body
    const updates = { name, code, address, city, location, contact, campusAdmin }
    const campus = await Campus.findByIdAndUpdate(
        id,
        updates,
        { new:true, runValidators:true }
    )
    if(!campus) return res.status(404).json({error: 'Campus not found'})
    res.json(campus)        
    } catch (error) {
        res.status(500).json({error: error.message})
    }

}

export const deleteCampusById = async (req,res) => {
    try {
        const { id } = req.params
        const deleteCampus = await Campus.findByIdAndUpdate(
            id,
            { isActive: false },
            {new:true, runValidators: true}
        )
        if(!deleteCampus) return res.status(404).json({error: 'Campus not found'})
        res.json({message: `${deleteCampus.name} deleted succesfully!`})
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


//--------------------------------------------------------------------
// -- Campus Details for Campus Admin -- //
//--------------------------------------------------------------------

// Returns campus details (teachers & students) for the campus the authenticated campus-admin belongs to
export const getCampusDetails = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { role, _id } = user;
    const { campusId: queryCampusId, isActive } = req.query;

    let campusId;

    if (role === "super-admin") {
      campusId = queryCampusId || req.params.id || null;
    }

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: _id }).select("_id");
      if (!campus) {
        return res.status(404).json({ error: "No campus assigned to this admin" });
      }
      campusId = campus._id;
    }

    const matchStage = {};
    if (campusId) matchStage._id = new mongoose.Types.ObjectId(campusId);
    if (isActive === "true") matchStage.isActive = true;
    if (isActive === "false") matchStage.isActive = false;

    const campusDetails = await Campus.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "campus",
          as: "classes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "campus",
          as: "users",
        },
      },
      {
        $addFields: {
          teachers: {
            $filter: {
              input: "$users",
              as: "u",
              cond: { $eq: ["$$u.role", "teacher"] },
            },
          },
          students: {
            $filter: {
              input: "$users",
              as: "u",
              cond: { $eq: ["$$u.role", "student"] },
            },
          },
        },
      },
      { $project: { users: 0 } },
    ]);

    if (!campusDetails.length) {
      return res.status(404).json({ error: "Campus not found" });
    }
    res.json(
      campusDetails.length === 1 ? campusDetails[0] : { count: campusDetails.length, data: campusDetails }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
