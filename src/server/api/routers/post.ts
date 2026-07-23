import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure.query(() => {
    return "Hello from tRPC";
  }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.post.create({
        data: {
          name: input.name,
        },
      });
    }),
});
