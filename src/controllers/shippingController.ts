import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import axios from "axios";
import { config } from "../config/config";
import { AuthRequest } from "../middleware/auth";

export class ShippingController {
	private readonly breweryApiUrl = config.breweryApiUrl;
	private readonly orderServiceUrl = "http://localhost:3002"; // Add to config.ts later

	async createShipment(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		const userId = req.user?.id;
		if (userId !== parseInt(req.body.user_id, 10)) {
			res.status(403).json({ message: "Unauthorized" });
			return;
		}

		try {
			const orderResponse = await axios.get(
				`${this.breweryApiUrl}/api/order/${req.body.order_id}`
			);
			if (orderResponse.data.UserId !== userId) {
				// PascalCase from C# model
				res.status(403).json({
					message: "Order does not belong to user",
				});
				return;
			}

			const shipmentData = {
				UserId: userId,
				OrderId: parseInt(req.body.order_id, 10),
				Address: req.body.address,
				City: req.body.city,
				Country: req.body.country,
				PostalCode: req.body.postal_code,
				Status: "Pending",
			};

			const response = await axios.post(
				`${this.breweryApiUrl}/api/shipping`,
				shipmentData
			);
			res.status(201).json(response.data);
		} catch (error: any) {
			console.error(
				"Error creating shipment:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error creating shipment",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async getShipment(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const response = await axios.get(
				`${this.breweryApiUrl}/api/shipping/${req.params.id}`
			);
			if (req.user?.id !== response.data.UserId) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error fetching shipment:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 404).json({
				message: error.response?.data?.message || "Shipment not found",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async updateShipmentStatus(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		console.log("Request body:", req.body);
		const errors = validationResult(req);
		console.log("Raw validation result:", errors.array());
		if (!errors.isEmpty()) {
			console.log("Validation errors:", errors.array());
			res.status(400).json({ errors: errors.array() });
			return;
		}

		try {
			const shippingResponse = await axios.get(
				`${this.breweryApiUrl}/api/shipping/${req.params.id}`
			);
			if (req.user?.id !== shippingResponse.data.UserId) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}

			const updateData = {
				Status: req.body.status,
				TrackingNumber:
					req.body.tracking_number ||
					shippingResponse.data.TrackingNumber,
			};

			const response = await axios.put(
				`${this.breweryApiUrl}/api/shipping/${req.params.id}`,
				updateData
			);

			// Sync with Order Service, forwarding the token
			if (req.body.status) {
				await axios.put(
					`${this.orderServiceUrl}/order/${shippingResponse.data.OrderId}/status`,
					{ status: req.body.status },
					{
						headers: {
							Authorization: req.headers.authorization,
						},
					}
				);
			}

			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error updating shipment:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error updating shipment",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async getShipmentByOrder(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const orderResponse = await axios.get(
				`${this.breweryApiUrl}/api/order/${req.params.order_id}`
			);
			if (req.user?.id !== orderResponse.data.UserId) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}
			const response = await axios.get(
				`${this.breweryApiUrl}/api/shipping/order/${req.params.order_id}`
			);
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error fetching shipment by order:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error fetching shipment",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async deleteShipment(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const shippingResponse = await axios.get(
				`${this.breweryApiUrl}/api/shipping/${req.params.id}`
			);
			if (req.user?.id !== shippingResponse.data.UserId) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}
			if (shippingResponse.data.Status !== "Pending") {
				res.status(400).json({
					message: "Can only delete pending shipments",
				});
				return;
			}
			await axios.delete(
				`${this.breweryApiUrl}/api/shipping/${req.params.id}`
			);
			res.status(200).json({ message: "Shipment deleted successfully" });
		} catch (error: any) {
			console.error(
				"Error deleting shipment:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error deleting shipment",
				error: error.response?.data?.errors || error.message,
			});
		}
	}
}
