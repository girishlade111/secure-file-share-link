import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { files } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string;
    const expiration = formData.get("expiration") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique token and filename
    const token = nanoid(10);
    const filename = `${nanoid(20)}_${file.name}`;

    // Calculate expiration time
    const expirationMinutes = parseInt(expiration) || 5;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Save metadata to database
    await db.insert(files).values({
      token,
      filename,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      passwordHash,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      token,
      expiresAt,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}