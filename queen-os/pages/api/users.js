import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const users = await db.getUsers();
    const invites = await db.getInvites();
    return res.status(200).json({ users, invites });
  }

  if (req.method === "POST") {
    const { action, ...data } = req.body;

    if (action === "upsert") {
      const user = await db.upsertUser(data);
      return res.status(200).json(user);
    }

    if (action === "event") {
      await db.trackEvent(data.userId, data.event);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
