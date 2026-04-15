import { db } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action, token, note, userId } = req.body;

    if (action === "create") {
      const invite = await db.createInvite("admin", note || "");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return res.status(200).json({
        ...invite,
        link: `${appUrl}/?invite=${invite.token}`,
      });
    }

    if (action === "validate") {
      const valid = await db.validateInvite(token);
      return res.status(200).json({ valid });
    }

    if (action === "use") {
      const ok = await db.useInvite(token, userId);
      return res.status(200).json({ ok });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  if (req.method === "GET") {
    const invites = await db.getInvites();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return res.status(200).json(
      invites.map(i => ({ ...i, link: `${appUrl}/?invite=${i.token}` }))
    );
  }

  return res.status(405).json({ error: "Method not allowed" });
}
