import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find file by token
    const fileRecord = await db.query.files.findFirst({
      where: eq(files.token, token),
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if file has expired
    const now = new Date();
    const expiresAt = new Date(fileRecord.expiresAt);
    if (now > expiresAt) {
      // Delete expired file
      try {
        const filePath = join(process.cwd(), "uploads", fileRecord.filename);
        await unlink(filePath);
        await db.delete(files).where(eq(files.id, fileRecord.id));
      } catch (error) {
        console.error("Error cleaning up expired file:", error);
      }
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    // Return file metadata (without the file itself)
    return NextResponse.json({
      originalName: fileRecord.originalName,
      fileSize: fileRecord.fileSize,
      mimeType: fileRecord.mimeType,
      expiresAt: fileRecord.expiresAt,
      hasPassword: !!fileRecord.passwordHash,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { password } = await request.json();

    // Find file by token
    const fileRecord = await db.query.files.findFirst({
      where: eq(files.token, token),
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if file has expired
    const now = new Date();
    const expiresAt = new Date(fileRecord.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    // Verify password if required
    if (fileRecord.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 });
      }

      const isValid = await bcrypt.compare(password, fileRecord.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
    }

    // Read and return the file
    const filePath = join(process.cwd(), "uploads", fileRecord.filename);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileRecord.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`,
        "Content-Length": fileRecord.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}