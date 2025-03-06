import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import shippingRoutes from "./ports/rest/routes/shipping";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

dotenv.config({
	allowEmptyValues: true,
	path: `.env.${process.env.NODE_ENV || "local"}`,
	example: ".env.example",
});

const port = process.env.PORT || 3010;
app.use("/healthcheck", (req, res) => {
	res.status(200).send("The Cart Service is ALIVE!");
});

app.use("/shipping", shippingRoutes);

app.listen(port, () => {
	console.log(`Shipping is running on port ${port}`);
});
