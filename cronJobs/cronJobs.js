import cron from "node-cron";
import {
  checkLowAttendanceAndNotify,
  generateMonthlyAttendanceReports,
} from "../services/reportService.js";

cron.schedule(
  "0 9 1 * *",
  async () => {
    // cron.schedule("* * * * *", async () => {
    console.log("Running monthly attendance report cron job...");
    try {
      await generateMonthlyAttendanceReports();
      console.log("✅ Monthly attendance reports generated and emailed.");
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  },
  {
    timezone: "Asia/Karachi",
  }
);

cron.schedule("0 12 * * 6", async () => {
  console.log("Running weekly low attendance check...");
  try {
    await checkLowAttendanceAndNotify();
    console.log("✅ Low attendance alerts sent.");
  } catch (err) {
    console.error("Error in low attendance cron:", err);
  }
});
