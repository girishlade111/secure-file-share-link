"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Lock, FileIcon, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface FileInfo {
  originalName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string;
  hasPassword: boolean;
}

export default function DownloadPage() {
  const params = useParams();
  const token = params.token as string;

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  // Cleanup scheduler
  useEffect(() => {
    // Run cleanup on mount
    fetch("/api/cron/cleanup").catch(console.error);
  }, []);

  useEffect(() => {
    fetchFileInfo();
  }, [token]);

  useEffect(() => {
    if (!fileInfo) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(fileInfo.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setError("This file has expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [fileInfo]);

  const fetchFileInfo = async () => {
    try {
      const response = await fetch(`/api/download/${token}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load file information");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFileInfo(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to connect to server");
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setPasswordError("");

    try {
      const response = await fetch(`/api/download/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setPasswordError(data.error || "Download failed");
        setDownloading(false);
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo?.originalName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloading(false);
    } catch (err) {
      setPasswordError("Download failed. Please try again.");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold">File Not Available</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <FileIcon className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Download File</CardTitle>
          <CardDescription>File is ready for download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Filename</p>
              <p className="font-medium break-all">{fileInfo?.originalName}</p>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">
                  {fileInfo ? (fileInfo.fileSize / 1024 / 1024).toFixed(2) : 0} MB
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expires in</p>
                <p className="font-medium text-primary">{timeRemaining}</p>
              </div>
            </div>
          </div>

          {/* Password Input */}
          {fileInfo?.hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password Required
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password to download"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDownload();
                  }
                }}
              />
            </div>
          )}

          {/* Error Alert */}
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          {/* Download Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleDownload}
            disabled={downloading || (fileInfo?.hasPassword && !password)}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Downloading..." : "Download File"}
          </Button>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            This file will automatically delete after the expiration time
          </div>
        </CardContent>
      </Card>
    </div>
  );
}