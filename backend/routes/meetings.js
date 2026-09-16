import express from "express";
import {
  createMeeting,
  getMeetings,
  getMeetingWithTasks,
  updateTaskStatus,
  updateTask,
  deleteMeeting,
} from "../controllers/meetingController.js";

const router = express.Router();

router.post("/", createMeeting); // create meeting + run extraction
router.get("/", getMeetings); // list all meetings
router.get("/:id", getMeetingWithTasks); // get one meeting + its tasks
router.delete("/:id", deleteMeeting);

router.patch("/tasks/:taskId/status", updateTaskStatus); // confirm/reject/done
router.patch("/tasks/:taskId", updateTask); // edit a task's fields

export default router;
