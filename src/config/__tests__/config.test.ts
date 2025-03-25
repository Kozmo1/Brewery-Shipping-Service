import { config } from "../config";

// Mock dotenv-safe to control env loading
jest.mock("dotenv-safe", () => ({
	config: jest.fn((options) => {
		// Return empty parsed object if no file or path is weird
		if (!options.path || options.path.includes("nonexistent")) {
			return { parsed: {} };
		}
		return { parsed: process.env };
	}),
}));

describe("config", () => {
	// Reset modules before each test to reload config fresh
	beforeEach(() => {
		jest.resetModules();
	});

	// Test fallback values when env vars are missing
	it("should use fallback values if environment variables are not set", () => {
		const originalEnv = { ...process.env };
		delete process.env.NODE_ENV;
		delete process.env.BREWERY_API_URL;
		delete process.env.PORT;
		delete process.env.JWT_SECRET;

		const { config } = require("../../config/config");

		expect(config.environment).toBe("development");
		expect(config.breweryApiUrl).toBe("http://localhost:5089");
		expect(config.port).toBe(3010); // Updated to match your config.ts
		expect(config.jwtSecret).toBe("");

		process.env = originalEnv;
	});

	// Test env vars overriding defaults
	it("should use environment variables when they are set", () => {
		const originalEnv = { ...process.env };
		process.env.NODE_ENV = "production";
		process.env.BREWERY_API_URL = "https://api.brewery.com";
		process.env.PORT = "5000";
		process.env.JWT_SECRET = "custom-secret";

		const { config } = require("../../config/config");

		expect(config.environment).toBe("production");
		expect(config.breweryApiUrl).toBe("https://api.brewery.com");
		expect(config.port).toBe(5000);
		expect(config.jwtSecret).toBe("custom-secret");

		process.env = originalEnv;
	});

	// Test handling a missing .env file
	it("should handle missing .env file gracefully", () => {
		const originalEnv = { ...process.env };
		process.env.NODE_ENV = "nonexistent";
		delete process.env.BREWERY_API_URL;
		delete process.env.PORT;
		delete process.env.JWT_SECRET;

		const { config } = require("../../config/config");

		expect(config.environment).toBe("nonexistent");
		expect(config.breweryApiUrl).toBe("http://localhost:5089");
		expect(config.port).toBe(3010); // Updated to match your config.ts
		expect(config.jwtSecret).toBe("");

		process.env = originalEnv;
	});

	// Test invalid PORT handling
	it("should handle invalid PORT as NaN", () => {
		const originalEnv = { ...process.env };
		process.env.PORT = "invalid";

		const { config } = require("../../config/config");

		expect(isNaN(config.port)).toBe(true); // parseInt("invalid", 10) returns NaN

		process.env = originalEnv;
	});
});
