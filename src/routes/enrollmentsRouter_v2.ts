import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, UserPayload, CustomRequest, Enrollment } from "../libs/types.ts";

// import database
import { users, reset_users, enrollments, students, courses } from "../db/db.ts";
import { success } from "zod";

const router = Router();

// GET /api/v2/users
router.get("/", (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];

  //check auth
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  console.log(authHeader);
  const token = authHeader.split(" ")[1];
  //check token
  if (token === null) {
    return res.status(401).json({
      success: false,
      message: "token is required",
    });
  }
  
  const jwt_secret = process.env.JWT_SECRET || "this_is_my_secret";
  jwt.verify(token, jwt_secret, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    //find payload
    const user_payload = payload as UserPayload;
    const user = users.find((u) => u.username === user_payload.username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }
    //admin see all user
    if(user.role === "ADMIN"){
      try {
      // return all users
        return res.json({
          success: true,
          enrollments: enrollments,
      });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Something is wrong, please try again",
          error: err,
      });
    }
    }
    //student see only youself
    if(user.role === "STUDENT"){
      const findstudent = enrollments.filter((e)=>e.studentId === user.studentId).map((e)=>courses.find((c)=>c.courseId === e.courseId))
      return res.status(200).json({
        success:true,
        data:findstudent
      })
    }
})   
});

// POST /api/v2/student/enroll
router.post("/", (req: Request, res: Response) => {
  // 1. get enroll from body
  const enroll = req.body as Enrollment;
  const authHeader = req.headers["authorization"];

  //check auth
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  console.log(authHeader);
  const token = authHeader.split(" ")[1];
  //check token
  if (token === null) {
    return res.status(401).json({
      success: false,
      message: "token is required",
    });
  }
  
  const jwt_secret = process.env.JWT_SECRET || "this_is_my_secret";
  jwt.verify(token, jwt_secret, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    //find payload
    const user_payload = payload as UserPayload;
    const user = users.find((u) => u.username === user_payload.username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }
    //not allow admin
    if(user.role === "ADMIN"){
      return res.status(403).json({
        success: true,
        message: "Only Student can access this API route"
    })
    }

    //enroll course
    if(user.role === "STUDENT"){
      if(enroll.courseId && enroll.studentId){
      const findIndex = enrollments.findIndex((e)=>e.courseId === enroll.courseId && e.studentId === enroll.studentId);
      const student = students.find((s)=>s.studentId === enroll.studentId);
      
      //check student str
      if(enroll.studentId.length !== 9){
        return res.status(400).json({
          success: false,
          message: "Student Id must contain 9 characters"
        })
      }
      //check course str
      if(enroll.courseId.length !== 6){
        return res.status(400).json({
          success: false,
          message: "Course Id must contain 6 characters"
        })
      }

      //check student user
      if(enroll.studentId !== user.studentId){
        return res.status(400).json({
          success: false,
          message: "you can't enroll other student course"
        })
      }

      //check there not course in student enroll
      if(findIndex === -1 && student){
        const add_Enroll = enrollments.push(enroll);
        const add_Course = student.courses?.push(enroll.courseId);
        return res.status(200).json({
          success: true,
          message: "You has been enrolled from this course."
      })}else{
        return res.status(404).json({
          success: false,
          message: "you already enroll this course"
        })
      }
    }
    }
  })
});

//delete /api/v2/student/enroll
router.delete("/", (req: Request, res: Response) => {
    const enroll = req.body as Enrollment;
    const authHeader = req.headers["authorization"];

  //check auth
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is required",
    });
  }

  console.log(authHeader);
  const token = authHeader.split(" ")[1];
  //check token
  if (token === null) {
    return res.status(401).json({
      success: false,
      message: "token is required",
    });
  }

  const jwt_secret = process.env.JWT_SECRET || "this_is_my_secret";
  jwt.verify(token, jwt_secret, (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    //find payload
    const user_payload = payload as UserPayload;
    const user = users.find((u)=> u.username === user_payload.username)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }
    //not allow admin
    if(user.role === "ADMIN"){
      return res.status(403).json({
        success: true,
        message: "Only Student can access this API route"
      })
    }

    //delete enrollment
    if(enroll.courseId && enroll.studentId){
      const findIndex = enrollments.findIndex((e)=>e.courseId === enroll.courseId && e.studentId === enroll.studentId);
      const student = students.find((s)=>s.studentId === enroll.studentId);
      
      //check student str
      if(enroll.studentId.length !== 9){
        return res.status(400).json({
          success: false,
          message: "Student Id must contain 9 characters"
        })
      }
      //check course str
      if(enroll.courseId.length !== 6){
        return res.status(400).json({
          success: false,
          message: "Course Id must contain 6 characters"
        })
      }

      //check student user
      if(enroll.studentId !== user.studentId){
        return res.status(400).json({
          success: false,
          message: "you can't drop other student course"
        })
      }
      //check there course in student enroll
      if(findIndex !== -1 && student){
        const delete_Enroll = enrollments.splice(findIndex,1);
        const courseidx = student.courses?.findIndex((c)=>c=== enroll.courseId);
        if(courseidx){
          const delete_Course = student.courses?.splice(courseidx,1);
        } 
        return res.status(200).json({
          success: true,
          message: "You has been dropped from this course. See you next semester."
      })}else{
        return res.status(404).json({
          success: false,
          message: "course does not exist"
        })
      }
    }
})
});

export default router;
