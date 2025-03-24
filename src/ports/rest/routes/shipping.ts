import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { ShippingController } from "../../../controllers/shippingController";
import { verifyToken, AuthRequest } from "../../../middleware/auth";

const router = express.Router();
const shippingController = new ShippingController();

router.post(
	"/create",
	verifyToken,
	body("user_id")
		.isInt({ min: 1 })
		.withMessage("User ID must be a positive integer"),
	body("order_id")
		.isInt({ min: 1 })
		.withMessage("Order ID must be a positive integer"),
	body("address").isString().notEmpty().withMessage("Address is required"),
	body("city").isString().notEmpty().withMessage("City is required"),
	body("country").isString().notEmpty().withMessage("Country is required"),
	body("postal_code")
		.isString()
		.notEmpty()
		.withMessage("Postal Code is required"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		shippingController.createShipment(req, res, next)
);

router.get(
	"/:id",
	verifyToken,
	(req: AuthRequest, res: Response, next: NextFunction) =>
		shippingController.getShipment(req, res, next)
);

router.put(
	"/update/:id",
	verifyToken,
	body("status").custom((value) => {
		const allowed = ["Pending", "Shipped", "Delivered"];
		console.log("Validating status:", value);
		console.log("Allowed values:", allowed);
		console.log("Type of value:", typeof value);
		console.log("Includes check result:", allowed.includes(value));
		const isValid = allowed.includes(value);
		if (!isValid) throw new Error("Invalid status");
		return true;
	}),
	body("tracking_number")
		.optional()
		.isString()
		.withMessage("Tracking number must be a string"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		shippingController.updateShipmentStatus(req, res, next)
);

router.get(
	"/order/:order_id",
	verifyToken,
	(req: AuthRequest, res: Response, next: NextFunction) =>
		shippingController.getShipmentByOrder(req, res, next)
);

router.delete(
	"/:id",
	verifyToken,
	(req: AuthRequest, res: Response, next: NextFunction) =>
		shippingController.deleteShipment(req, res, next)
);

export = router;
