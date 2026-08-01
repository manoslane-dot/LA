/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import nextPwa from "next-pwa";

const withPwa = nextPwa({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
});

/** @type {import("next").NextConfig} */
const config = {
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default withPwa(config);
