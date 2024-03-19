/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'flippo.se',
				'1219687171565293638.discordsays.com'
			]
		}
	}
};

export default nextConfig;
