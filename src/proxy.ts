export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/roster/:path*",
    "/wishlist/:path*",
    "/calendar/:path*",
    "/logs/:path*",
    "/api/((?!auth).*)",
  ],
};
