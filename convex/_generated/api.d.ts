/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentDecisions from "../agentDecisions.js";
import type * as customers from "../customers.js";
import type * as jobs from "../jobs.js";
import type * as outgoingMessages from "../outgoingMessages.js";
import type * as seed from "../seed.js";
import type * as serviceRequests from "../serviceRequests.js";
import type * as simulationEvents from "../simulationEvents.js";
import type * as technicians from "../technicians.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentDecisions: typeof agentDecisions;
  customers: typeof customers;
  jobs: typeof jobs;
  outgoingMessages: typeof outgoingMessages;
  seed: typeof seed;
  serviceRequests: typeof serviceRequests;
  simulationEvents: typeof simulationEvents;
  technicians: typeof technicians;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
