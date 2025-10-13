import mongoose from "mongoose";
import Campus from "../models/Campus.js";
import Class from "../models/Class.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import logger from "../utils/logger.js";

export const createCampus = async (req, res) => {
  try {
    const { name, code, address, city, location, contact, campusAdmin } =
      req.body;
    const existingCampus = await Campus.findOne({ code });
    if (existingCampus)
      return res
        .status(400)
        .json({ error: "Campus with this code already exists" });
    const newCampus = await Campus.create({
      name,
      code,
      address,
      city,
      location,
      contact,
      campusAdmin,
    });
    logger.info(`Campus created: ${name} (${code})`);
    res.status(201).json(newCampus);
  } catch (error) {
    logger.error(`Error creating campus: ${error.message}`);
    res.status(400).json({ error: error });
  }
};

export const getAllCampuses = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalCampuses = await Campus.countDocuments({ isActive: true });
    const inActiveCampuses = await Campus.countDocuments({ isActive: false });

    const campuses = await Campus.aggregate([
      { $match: { isActive: true } },

      // Campus Admin
      {
        $lookup: {
          from: "users",
          localField: "campusAdmin",
          foreignField: "_id",
          as: "campusAdmin",
        },
      },
      { $unwind: { path: "$campusAdmin", preserveNullAndEmptyArrays: true } },

      // Classes
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "campus",
          as: "classes",
        },
      },

      // Teacher Count (via TeacherAssignment → Assignment → campus)
      {
        $lookup: {
          from: "teacherassignments",
          let: { campusId: "$_id" },
          pipeline: [
            { $unwind: "$assignments" },
            {
              $lookup: {
                from: "assignments",
                localField: "assignments",
                foreignField: "_id",
                as: "assignData",
              },
            },
            { $unwind: "$assignData" },
            {
              $match: {
                $expr: { $eq: ["$assignData.campus", "$$campusId"] },
              },
            },
            { $group: { _id: "$teacher" } },
          ],
          as: "teacherAssignments",
        },
      },

      // Students (via StudentEnrollment)
      {
        $lookup: {
          from: "studentenrollments",
          localField: "_id",
          foreignField: "campus",
          as: "studentEnrollments",
        },
      },

      // Counts
      {
        $addFields: {
          classCount: { $size: "$classes" },
          classTeacherCount: {
            $size: {
              $filter: {
                input: "$classes",
                as: "cls",
                cond: { $ne: ["$$cls.classTeacher", null] },
              },
            },
          },
          teacherCount: { $size: "$teacherAssignments" },
          studentCount: { $size: "$studentEnrollments" },
        },
      },

      // Final Projection
      {
        $project: {
          _id: 1,
          name: 1,
          city: 1,
          classCount: 1,
          classTeacherCount: 1,
          teacherCount: 1,
          studentCount: 1,
          campusAdmin: {
            _id: "$campusAdmin._id",
            name: "$campusAdmin.name",
            email: "$campusAdmin.email",
          },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    logger.info(`Fetched campuses page ${page} (limit ${limit})`);
    res.json({
      totalCampuses,
      inActiveCampuses,
      page: parseInt(page),
      limit: parseInt(limit),
      campuses,
    });
  } catch (error) {
    logger.error(`Error fetching campuses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getCampusById = async (req, res) => {
  try {
    const { id } = req.params;

    const campus = await Campus.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Campus Admin
      {
        $lookup: {
          from: "users",
          localField: "campusAdmin",
          foreignField: "_id",
          as: "campusAdmin",
        },
      },
      { $unwind: { path: "$campusAdmin", preserveNullAndEmptyArrays: true } },

      // Class Count
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "campus",
          as: "classes",
        },
      },

      // Teacher Count (via TeacherAssignment → Assignment → campus)
      {
        $lookup: {
          from: "teacherassignments",
          let: { campusId: "$_id" },
          pipeline: [
            { $unwind: "$assignments" },
            {
              $lookup: {
                from: "assignments",
                localField: "assignments",
                foreignField: "_id",
                as: "assignData",
              },
            },
            { $unwind: "$assignData" },
            {
              $match: {
                $expr: { $eq: ["$assignData.campus", "$$campusId"] },
              },
            },
            { $group: { _id: "$teacher" } },
          ],
          as: "teacherAssignments",
        },
      },

      // Student Count
      {
        $lookup: {
          from: "studentenrollments",
          localField: "_id",
          foreignField: "campus",
          as: "studentEnrollments",
        },
      },

      {
        $addFields: {
          classCount: { $size: "$classes" },
          teacherCount: { $size: "$teacherAssignments" },
          studentCount: { $size: "$studentEnrollments" },
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          city: 1,
          classCount: 1,
          teacherCount: 1,
          studentCount: 1,
          campusAdmin: {
            _id: "$campusAdmin._id",
            name: "$campusAdmin.name",
            email: "$campusAdmin.email",
          },
        },
      },
    ]);

    if (!campus.length) {
      logger.warn(`Campus not found with ID: ${id}`);
      return res.status(404).json({ error: "Campus not found" });
    }

    logger.info(`Fetched campus details for ID: ${id}`);
    res.json(campus[0]);
  } catch (error) {
    logger.error(
      `Error fetching campus by ID (${req.params.id}): ${error.message}`
    );
    console.error("Error getCampusById:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateCampusDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, city, location, contact, campusAdmin } =
      req.body;
    const updates = {
      name,
      code,
      address,
      city,
      location,
      contact,
      campusAdmin,
    };
    const campus = await Campus.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!campus) {
      logger.warn(`Campus update failed: Not found (${id})`);
      return res.status(404).json({ error: "Campus not found" });
    }

    logger.info(`Campus updated: ${campus.name} (${id})`);
    res.json(campus);
  } catch (error) {
    logger.error(`Error updating campus (${req.params.id}): ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const deleteCampusById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCampus = await Campus.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!deletedCampus) {
      logger.warn(`Campus delete failed: Not found (${id})`);
      return res.status(404).json({ error: "Campus not found" });
    }

    logger.info(`Campus deactivated: ${deletedCampus.name} (${id})`);
    res.json({ message: `${deletedCampus.name} deleted successfully!` });
  } catch (error) {
    logger.error(`Error deleting campus (${req.params.id}): ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Returns campus details (teachers & students) for the campus the authenticated campus-admin belongs to
export const getCampusDetails = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { classId: qClassId } = req.query;

    const campusIds = new Set();
    const classIds = new Set();

    // Campus Admin Logic
    if (role === "campus-admin") {
      const campus = await Campus.findOne({
        campusAdmin: userId,
        isActive: true,
      }).select("_id");

      if (!campus)
        return res
          .status(404)
          .json({ error: "Campus not found for this admin" });

      campusIds.add(campus._id.toString());

      if (qClassId) {
        const cls = await Class.findOne({
          _id: qClassId,
          campus: campus._id,
        }).select("_id");

        if (!cls)
          return res
            .status(404)
            .json({ error: "Class not found in your campus" });

        classIds.add(qClassId);
      }
    }

    // Teacher Logic (Subject / Class Teacher)
    else if (role === "teacher") {
      const ta = await TeacherAssignment.findOne({
        teacher: userId,
        isActive: true,
      }).populate({
        path: "assignments",
        match: { isActive: true },
        populate: { path: "class", select: "_id campus" },
      });

      if (ta && ta.assignments?.length) {
        ta.assignments.forEach((a) => {
          if (a.class) {
            classIds.add(a.class._id.toString());
            campusIds.add(a.class.campus.toString());
          }
        });
      }

      if (classIds.size === 0) {
        const cls = await Class.findOne({
          classTeacher: userId,
          isActive: true,
        }).select("_id campus");

        if (!cls)
          return res
            .status(404)
            .json({ error: "No class assigned to you yet" });

        classIds.add(cls._id.toString());
        campusIds.add(cls.campus.toString());
      }

      if (qClassId && !classIds.has(qClassId)) {
        return res
          .status(403)
          .json({ error: "You don't have access to that class" });
      }
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    const campusIdArray = Array.from(campusIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const classIdArray = Array.from(classIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const pipeline = [{ $match: { _id: { $in: campusIdArray } } }];

    if (role === "campus-admin") {
      // Admin sees total across campus
      pipeline.push(
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
            from: "studentenrollments",
            localField: "_id",
            foreignField: "campus",
            as: "enrollments",
          },
        },
        {
          $lookup: {
            from: "teacherassignments",
            let: { campusId: "$_id" },
            pipeline: [
              { $unwind: "$assignments" },
              {
                $lookup: {
                  from: "assignments",
                  localField: "assignments",
                  foreignField: "_id",
                  as: "assignData",
                },
              },
              { $unwind: "$assignData" },
              {
                $match: {
                  $expr: { $eq: ["$assignData.campus", "$$campusId"] },
                },
              },
              { $group: { _id: "$teacher" } },
            ],
            as: "teacherAssignments",
          },
        },
        {
          $addFields: {
            classCount: { $size: "$classes" },
            studentCount: { $size: "$enrollments" },
            teacherCount: { $size: "$teacherAssignments" },
            classTeacherCount: {
              $size: {
                $filter: {
                  input: "$classes",
                  as: "cls",
                  cond: { $ne: ["$$cls.classTeacher", null] },
                },
              },
            },
          },
        }
      );
    }

    if (role === "teacher") {
      // Restrict to only their assigned/enrolled classes
      pipeline.push(
        {
          $lookup: {
            from: "classes",
            let: { campusId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$campus", "$$campusId"] },
                      { $in: ["$_id", classIdArray] },
                    ],
                  },
                },
              },
            ],
            as: "classes",
          },
        },
        {
          $lookup: {
            from: "studentenrollments",
            let: { campusId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$campus", "$$campusId"] },
                      { $in: ["$class", classIdArray] },
                    ],
                  },
                },
              },
            ],
            as: "enrollments",
          },
        },
        {
          $addFields: {
            classCount: { $size: "$classes" },
            studentCount: { $size: "$enrollments" },
            classTeacherCount: {
              $size: {
                $filter: {
                  input: "$classes",
                  as: "cls",
                  cond: { $eq: ["$$cls.classTeacher", userId] },
                },
              },
            },
          },
        }
      );
    }

    const baseProject = {
      name: 1,
      city: 1,
      classCount: 1,
      studentCount: 1,
    };

    if (role === "campus-admin") {
      baseProject.teacherCount = 1;
      baseProject.classTeacherCount = 1;
    } else if (role === "teacher") {
      baseProject.classTeacherCount = 1;
    }

    pipeline.push({ $project: baseProject });

    const campusDetails = await Campus.aggregate(pipeline);

    if (!campusDetails.length)
      return res
        .status(404)
        .json({ error: "No campus details found or you don't have access" });

    res.json({
      totalDetails: campusDetails.length,
      campusDetails,
    });
  } catch (error) {
    logger.error(`Error fetching campus details (${req.user._id}): ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
