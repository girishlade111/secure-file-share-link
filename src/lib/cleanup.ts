// Client-side cleanup scheduler
// This runs in the browser and calls the cleanup API every minute

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler() {
  if (cleanupInterval) return;

  // Run cleanup immediately
  runCleanup();

  // Then run every minute
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, 60000); // 60 seconds
}

export function stopCleanupScheduler() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

async function runCleanup() {
  try {
    await fetch("/api/cron/cleanup");
  } catch (error) {
    console.error("Cleanup scheduler error:", error);
  }
}