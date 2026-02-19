import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    "/spaces/create",
    "/matches/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/premium/:path*",
    "/onboarding/:path*",
    "/api/user/:path*",
    "/api/matches/:path*",
    "/api/stripe/:path*",
    "/api/notifications/:path*",
  ],
};
