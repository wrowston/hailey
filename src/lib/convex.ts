import { ConvexHttpClient } from "convex/browser";

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default convexClient;
