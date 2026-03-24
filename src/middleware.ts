export { auth as middleware } from "@/auth";

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
