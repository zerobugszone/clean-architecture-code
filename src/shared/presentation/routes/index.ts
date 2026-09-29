import { Router } from 'express';
import userRoutes from "../../../modules/auth/presentation/routes/userRoutes"


const router = Router()

router.use(userRoutes)

export default router