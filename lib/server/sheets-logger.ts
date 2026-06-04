import { after } from "next/server";

interface LogAttemptParams {
  userId: string;
  username: string;
  levelId: number;
  questionNumber: number;
  submittedAnswer: string;
  isCorrect: boolean;
}

/**
 * Logs a user attempt asynchronously (using Next.js after) to the configured Google Sheet.
 * Fails silently to user if sheet webhook is not configured or fails.
 */
export function logAttempt(params: LogAttemptParams): void {
  const webhookUrl = process.env.SHEET_WEBHOOK_URL;
  const webhookSecret = process.env.SHEET_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.warn("Google Sheets logging is not configured (SHEET_WEBHOOK_URL or SHEET_WEBHOOK_SECRET is missing).");
    return;
  }

  const runLog = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: webhookSecret,
          timestamp: new Date().toISOString(),
          userId: params.userId,
          username: params.username,
          levelId: params.levelId,
          questionNumber: params.questionNumber,
          submittedAnswer: params.submittedAnswer,
          isCorrect: params.isCorrect,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to log attempt to Google Sheets: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        if (!data.success) {
          console.error(`Google Sheets webhook returned error: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Error logging attempt to Google Sheets webhook:", error);
    }
  };

  try {
    // Next.js 15.1+ after() schedules work to be executed after the response has been sent
    after(runLog);
  } catch {
    // Fallback if after() is not available or supported in this runtime context
    runLog();
  }
}
