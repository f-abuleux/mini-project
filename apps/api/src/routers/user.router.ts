import { UserController } from "@/controllers/user.controller";
import { verifyToken } from "@/middlewares/auth.middleware";
import { Router } from "express";

export class UserRouter {
      private router: Router;
      private userController: UserController

      constructor() {
            this.userController = new UserController();
            this.router = Router();
            this.initializeRoutes();
      }

      private initializeRoutes(): void {
            this.router.get("/", verifyToken ,this.userController.getUserData)
            this.router.get("/review", verifyToken, this.userController.reviewEventbyUser)

      }

      getRouter(): Router {
            return this.router;
      }
} 