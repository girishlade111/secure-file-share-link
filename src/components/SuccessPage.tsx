"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Copy, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SuccessPageProps {
  link: string;
  expiresAt: string;
  onReset: () => void;
}

export default function SuccessPage({ link, expiresAt, onReset }: SuccessPageProps) {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold">Upload Successful!</CardTitle>
          <CardDescription>Your file has been uploaded and is ready to share</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shareable Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shareable Link</label>
            <div className="flex gap-2">
              <Input value={link} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Time Remaining</span>
            </div>
            <span className="text-lg font-bold text-primary">{timeRemaining}</span>
          </div>

          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-1 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <p>• Share this link with anyone you want to give access to your file</p>
            <p>• The file will automatically delete after the expiration time</p>
            <p>• If you set a password, recipients will need it to download</p>
          </div>

          {/* Upload Another */}
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={onReset}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Upload Another File
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}