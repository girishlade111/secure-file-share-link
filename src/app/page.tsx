"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Lock, Clock, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SuccessPage from "@/components/SuccessPage";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expiration, setExpiration] = useState("5");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Cleanup scheduler
  useEffect(() => {
    // Run cleanup on mount
    fetch("/api/cron/cleanup").catch(console.error);
    
    // Run cleanup every minute
    const interval = setInterval(() => {
      fetch("/api/cron/cleanup").catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);
      formData.append("expiration", expiration);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const data = await response.json();
      const link = `${window.location.origin}/f/${data.token}`;
      setShareLink(link);
      setExpiresAt(data.expiresAt);
      setUploadSuccess(true);
      setUploading(false);
    } catch (err) {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword("");
    setExpiration("5");
    setUploadProgress(0);
    setError("");
    setUploadSuccess(false);
    setShareLink("");
    setExpiresAt("");
  };

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  if (uploadSuccess) {
    return <SuccessPage link={shareLink} expiresAt={expiresAt} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Secure File Share</CardTitle>
          <CardDescription>Upload and share files securely with password protection and auto-expiration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="space-y-4">
              {file ? (
                <>
                  <FileIcon className="w-16 h-16 mx-auto text-primary" />
                  <div>
                    <p className="font-medium text-lg">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    disabled={uploading}
                  >
                    Change File
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">Drag & drop your file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Set a password to protect your file"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Expiration Selector */}
          <div className="space-y-2">
            <Label htmlFor="expiration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Expiration Time
            </Label>
            <Select value={expiration} onValueChange={setExpiration} disabled={uploading}>
              <SelectTrigger id="expiration">
                <SelectValue placeholder="Select expiration time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload & Get Link"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}