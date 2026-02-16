import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { fileRoutes } from "../modules/uploadFile/uploadFile.routes";
import { otpRoutes } from "../modules/otp/otp.routes";
import { profileRoutes } from "../modules/profile/profile.routes";
import { eventRoutes } from "../modules/event/event.routes";
import { purchasedEventRoutes } from "../modules/purchasedEvent/purchasedEvent.routes";
import { productRoutes } from "../modules/product/product.routes";

const router = Router();

const routes = [
  { path: "/auths", route: authRoutes },
  { path: "/admins", route: adminRoutes },
  { path: "/otps", route: otpRoutes },
  { path: "/profile", route: profileRoutes },
  { path: "/events", route: eventRoutes },
  { path: "/purchased-event", route: purchasedEventRoutes },
  { path: "/products", route: productRoutes },
  { path: "/upload-files", route: fileRoutes },
];

routes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
