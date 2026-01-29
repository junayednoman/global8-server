// import { Router } from "express";
// import { authRoutes } from "../modules/auth/auth.routes";
// import { adminRoutes } from "../modules/admin/admin.routes";
// import { fileRoutes } from "../modules/uploadFile/uploadFile.routes";
// import { otpRoutes } from "../modules/otp/otp.routes";
// import { personRoutes } from "../modules/person/person.routes";
// import { postRoutes } from "../modules/post/post.routes";
// import { reactionRoutes } from "../modules/reaction/reaction.routes";
// import { commentRoutes } from "../modules/comment/comment.routes";
// import { resumeRoutes } from "../modules/resume/resume.routes";
// import { businessRoutes } from "../modules/business/business.routes";
// import { jobRoutes } from "../modules/job/job.routes";
// import { favoriteRoutes } from "../modules/favorite/favorite.routes";
// import { connectionRoutes } from "../modules/connection/connection.routes";
// import { chatRoutes } from "../modules/chat/chat.routes";
// import { recommendationRoutes } from "../modules/recommendation/recommendation.routes";
// import { groupRoutes } from "../modules/group/group.routes";
// import { classRoutes } from "../modules/class/class.routes";
// import { messageRoutes } from "../modules/message/message.routes";
// import { callRoutes } from "../modules/call/call.routes";
// import { complaintRoutes } from "../modules/complaint/complaint.routes";
// import { boostPackageRoutes } from "../modules/boostPackage/boostPackage.routes";
// import { legalRoutes } from "../modules/legal/legal.routes";
// import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
// import { boostRoutes } from "../modules/boost/boost.routes";
// import { notificationRoutes } from "../modules/notification/notification.routes";

// const router = Router();

// const routes = [
//   { path: "/auths", route: authRoutes },
//   { path: "/otps", route: otpRoutes },
//   { path: "/persons", route: personRoutes },
//   { path: "/posts", route: postRoutes },
//   { path: "/reactions", route: reactionRoutes },
//   { path: "/comments", route: commentRoutes },
//   { path: "/resumes", route: resumeRoutes },
//   { path: "/businesses", route: businessRoutes },
//   { path: "/jobs", route: jobRoutes },
//   { path: "/favorites", route: favoriteRoutes },
//   { path: "/connections", route: connectionRoutes },
//   { path: "/recommendations", route: recommendationRoutes },
//   { path: "/groups", route: groupRoutes },
//   { path: "/classes", route: classRoutes },
//   { path: "/chats", route: chatRoutes },
//   { path: "/messages", route: messageRoutes },
//   { path: "/calls", route: callRoutes },
//   { path: "/complaints", route: complaintRoutes },
//   { path: "/boost-packages", route: boostPackageRoutes },
//   { path: "/legal", route: legalRoutes },
//   { path: "/dashboard", route: dashboardRoutes },
//   { path: "/boosts", route: boostRoutes },
//   { path: "/notifications", route: notificationRoutes },

//   { path: "/admins", route: adminRoutes },
//   { path: "/upload-files", route: fileRoutes },
// ];

// routes.forEach(route => {
//   router.use(route.path, route.route);
// });

// export default router;
