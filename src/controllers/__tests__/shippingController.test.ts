import { ShippingController } from "../shippingController";
import { AuthRequest } from "../../middleware/auth";
import { Request, Response } from "express";
import axios from "axios";
import { validationResult } from "express-validator";

// Mock axios and express-validator
jest.mock("axios");
jest.mock("express-validator", () => ({
	validationResult: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedValidationResult = validationResult as jest.MockedFunction<
	typeof validationResult
>;

describe("ShippingController", () => {
	let controller: ShippingController;
	let req: Partial<AuthRequest>;
	let res: Partial<Response>;
	let next: jest.Mock;

	beforeEach(() => {
		controller = new ShippingController();
		req = {
			user: { id: 1, email: "test@example.com" },
			body: {},
			params: {},
			headers: { authorization: "Bearer token" },
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		next = jest.fn();
		jest.clearAllMocks();

		mockedValidationResult.mockReturnValue({
			isEmpty: () => true,
			array: () => [],
		} as any);
	});

	describe("createShipment", () => {
		it("returns 400 if validation fails", async () => {
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [{ msg: "Invalid input" }],
			} as any);

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				errors: [{ msg: "Invalid input" }],
			});
		});

		it("returns 403 if user_id does not match req.user.id", async () => {
			req.body = { user_id: "2", order_id: "1" };

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("returns 403 if order does not belong to user", async () => {
			req.body = {
				user_id: "1",
				order_id: "1",
				address: "123 St",
				city: "City",
				country: "Country",
				postal_code: "12345",
			};
			mockedAxios.get.mockResolvedValue({ data: { UserId: 2 } });

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: "Order does not belong to user",
			});
		});

		it("creates shipment successfully", async () => {
			req.body = {
				user_id: "1",
				order_id: "1",
				address: "123 St",
				city: "City",
				country: "Country",
				postal_code: "12345",
			};
			mockedAxios.get.mockResolvedValue({ data: { UserId: 1 } });
			mockedAxios.post.mockResolvedValue({ data: { id: 1 } });

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("handles axios error with response", async () => {
			req.body = {
				user_id: "1",
				order_id: "1",
				address: "123 St",
				city: "City",
				country: "Country",
				postal_code: "12345",
			};
			mockedAxios.get.mockRejectedValue({
				response: { status: 500, data: { message: "Server error" } },
			});

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: "Server error",
				error: undefined,
			});
		});

		it("handles axios error without response", async () => {
			req.body = {
				user_id: "1",
				order_id: "1",
				address: "123 St",
				city: "City",
				country: "Country",
				postal_code: "12345",
			};
			mockedAxios.get.mockRejectedValue(new Error("Network error"));

			await controller.createShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: "Error creating shipment",
				error: "Network error",
			});
		});
	});

	describe("getShipment", () => {
		it("returns 403 if user does not own shipment", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockResolvedValue({ data: { UserId: 2 } });

			await controller.getShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("returns shipment successfully", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockResolvedValue({ data: { UserId: 1, id: 1 } });

			await controller.getShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ UserId: 1, id: 1 });
		});

		it("handles 404 error with response", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockRejectedValue({
				response: { status: 404, data: { message: "Not found" } },
			});

			await controller.getShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: "Not found",
				error: undefined,
			});
		});

		it("handles error without response", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockRejectedValue(new Error("Network error"));

			await controller.getShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: "Shipment not found",
				error: "Network error",
			});
		});
	});

	describe("updateShipmentStatus", () => {
		it("returns 400 if validation fails", async () => {
			mockedValidationResult.mockReturnValue({
				isEmpty: () => false,
				array: () => [{ msg: "Invalid status" }],
			} as any);
			req.params = { id: "1" };

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				errors: [{ msg: "Invalid status" }],
			});
		});

		it("returns 403 if user does not own shipment", async () => {
			req.params = { id: "1" };
			req.body = { status: "Shipped" };
			mockedAxios.get.mockResolvedValue({ data: { UserId: 2 } });

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("updates shipment status successfully with tracking number", async () => {
			req.params = { id: "1" };
			req.body = { status: "Shipped", tracking_number: "XYZ789" };
			mockedAxios.get.mockResolvedValue({
				data: { UserId: 1, OrderId: 1, TrackingNumber: "ABC123" },
			});
			mockedAxios.put.mockResolvedValueOnce({ data: { id: 1 } }); // Brewery API
			mockedAxios.put.mockResolvedValueOnce({ data: {} }); // Order service

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(mockedAxios.put).toHaveBeenCalledWith(
				`${controller["breweryApiUrl"]}/api/shipping/1`,
				{ Status: "Shipped", TrackingNumber: "XYZ789" }
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("updates shipment status using existing tracking number", async () => {
			req.params = { id: "1" };
			req.body = { status: "Shipped" };
			mockedAxios.get.mockResolvedValue({
				data: { UserId: 1, OrderId: 1, TrackingNumber: "ABC123" },
			});
			mockedAxios.put.mockResolvedValueOnce({ data: { id: 1 } });
			mockedAxios.put.mockResolvedValueOnce({ data: {} });

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(mockedAxios.put).toHaveBeenCalledWith(
				`${controller["breweryApiUrl"]}/api/shipping/1`,
				{ Status: "Shipped", TrackingNumber: "ABC123" }
			);
			expect(res.status).toHaveBeenCalledWith(200);
		});

		it("handles error with response", async () => {
			req.params = { id: "1" };
			req.body = { status: "Shipped" };
			mockedAxios.get.mockRejectedValue({
				response: { status: 400, data: { message: "Bad request" } },
			});

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: "Bad request",
				error: undefined,
			});
		});

		it("handles error without response", async () => {
			req.params = { id: "1" };
			req.body = { status: "Shipped" };
			mockedAxios.get.mockRejectedValue(new Error("Network error"));

			await controller.updateShipmentStatus(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: "Error updating shipment",
				error: "Network error",
			});
		});
	});

	describe("getShipmentByOrder", () => {
		it("returns 403 if user does not own order", async () => {
			req.params = { order_id: "1" };
			mockedAxios.get.mockResolvedValueOnce({ data: { UserId: 2 } });

			await controller.getShipmentByOrder(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("returns shipment by order successfully", async () => {
			req.params = { order_id: "1" };
			mockedAxios.get
				.mockResolvedValueOnce({ data: { UserId: 1 } })
				.mockResolvedValueOnce({ data: { id: 1 } });

			await controller.getShipmentByOrder(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("handles error with response", async () => {
			req.params = { order_id: "1" };
			mockedAxios.get.mockRejectedValue({
				response: { status: 404, data: { message: "Order not found" } },
			});

			await controller.getShipmentByOrder(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: "Order not found",
				error: undefined,
			});
		});

		it("handles error without response", async () => {
			req.params = { order_id: "1" };
			mockedAxios.get.mockRejectedValue(new Error("Network error"));

			await controller.getShipmentByOrder(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: "Error fetching shipment",
				error: "Network error",
			});
		});
	});

	describe("deleteShipment", () => {
		it("returns 403 if user does not own shipment", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockResolvedValue({ data: { UserId: 2 } });

			await controller.deleteShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("returns 400 if shipment is not Pending", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockResolvedValue({
				data: { UserId: 1, Status: "Shipped" },
			});

			await controller.deleteShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: "Can only delete pending shipments",
			});
		});

		it("deletes shipment successfully", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockResolvedValue({
				data: { UserId: 1, Status: "Pending" },
			});
			mockedAxios.delete.mockResolvedValue({});

			await controller.deleteShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: "Shipment deleted successfully",
			});
		});

		it("handles error with response", async () => {
			req.params = { id: "1" };
			mockedAxios.get.mockRejectedValue({
				response: { status: 400, data: { message: "Bad request" } },
			});

			await controller.deleteShipment(
				req as AuthRequest,
				res as Response,
				next
			);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				message: "Bad request",
				error: undefined,
			});
		});
	});

	it("handles undefined req.user gracefully", async () => {
		req.user = undefined;
		await controller.createShipment(
			req as AuthRequest,
			res as Response,
			next
		);
		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
	});
});
