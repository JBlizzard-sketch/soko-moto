import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersResponse,
  CreateUserBody,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toUser(u: typeof usersTable.$inferSelect) {
  return {
    ...u,
    isCorporate: u.isCorporate === 1,
    preferredCategories: (u.preferredCategories as string[]) ?? [],
  };
}

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  res.json(ListUsersResponse.parse(users.map(toUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    ...parsed.data,
    isCorporate: parsed.data.isCorporate ? 1 : 0,
  }).returning();

  res.status(201).json(GetUserResponse.parse(toUser(user)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(toUser(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateUserResponse.parse(toUser(user)));
});

export default router;
