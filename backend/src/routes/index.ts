import express from "express";
import userRoutes from "../apps/user/userRoute";
import authRoutes from "../apps/auth/authRoute";
import categoryRoutes from "../apps/category/categoryRoute";
import productRoutes from "../apps/product/productRoute";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/category", categoryRoutes);
router.use("/product", productRoutes);

export default router;