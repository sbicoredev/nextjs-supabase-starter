import { createMiddleware, createSafeActionClient } from "next-safe-action";
import z from "zod";

import { ErrorMessaage } from "~/constants/error-message";

import { createUserRateLimit } from "./rate-limit";
import { getSupabaseServerClient } from "./supabase/server";

const loggingMiddleware = createMiddleware().define(
  async ({ next, metadata }) => {
    const start = Date.now();
    const result = await next();
    console.log(`Action took ${Date.now() - start}ms`, metadata);
    return result;
  }
);

// Base client: error handling, logging, metadata
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);
    return e.message;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  // Change the default validation error shape
  defaultValidationErrorsShape: "flattened",
}).use(loggingMiddleware);

// Authenticated client: requires valid session
export const authActionClient = actionClient.use(async ({ next, metadata }) => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error(ErrorMessaage.auth.unauthorized);
  }

  const { success } = await createUserRateLimit(user.id).limit(
    metadata.actionName
  );
  if (!success) {
    throw new Error(ErrorMessaage.rateLimit.tooManyRequest);
  }

  return next({ ctx: { supabase, user } });
});
