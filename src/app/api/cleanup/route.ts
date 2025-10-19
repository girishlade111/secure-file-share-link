import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "@/db";
import { files } from "@/db/schema";
import { lt } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date().toISOString();

    // Find all expired files
    const expiredFiles = await db.query.files.findMany({
      where: lt(files.expiresAt, now),
    });

    let deletedCount = 0;
    let errors = 0;

    // Delete each expired file
    for (const file of expiredFiles) {
      try {
        const filePath = join(process.cwd(), "uploads", file.filename);
        await unlink(filePath);
        await db.delete(files).where(lt(files.expiresAt, now));
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${file.filename}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deletedCount,
      errors,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}