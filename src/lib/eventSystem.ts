// Event system for real-time synchronization between engines and components in KONEXA
import { SystemLog } from "../types";

export type EventType =
  | "UserCreated"
  | "UserUpdated"
  | "StudentRegistered"
  | "CompanyRegistered"
  | "ProfileCompleted"
  | "VerificationSubmitted"
  | "VerificationApproved"
  | "VerificationRejected"
  | "LoginSuccess"
  | "LoginFailed"
  | "PasswordChanged"
  | "SecurityAlert"
  | "ProfileUpdated"
  | "SettingsUpdated"
  | "StudentCreated"
  | "StudentUpdated"
  | "CompanyCreated"
  | "CompanyUpdated"
  | "ResumeUploaded"
  | "PortfolioUploaded"
  | "GitHubConnected"
  | "CertificateUploaded"
  | "LanguageUpdated"
  | "SkillUpdated"
  | "CareerGoalUpdated"
  | "NotificationCreated"
  | "RecommendationGenerated"
  | "DashboardUpdated"
  | "AIAnalysisCompleted"
  | "ProjectCompleted"
  | "TaskCompleted"
  | "ReviewSubmitted"
  | "ResumeUpdated"
  | "PortfolioUpdated"
  | "CertificateVerified"
  | "WarningCreated"
  | "TrustUpdated"
  | "PerformanceUpdated"
  | "ApplicationSubmitted";

type EventCallback = (data?: any) => void;

class EventSystem {
  private listeners: Map<EventType, EventCallback[]> = new Map();

  public subscribe(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe callback
    return () => {
      const callbacks = this.listeners.get(event) || [];
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback)
      );
    };
  }

  public publish(event: EventType, data?: any): void {
    console.log(`[KONEXA EventSystem] Event emitted: ${event}`, data);
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in subscriber of event ${event}:`, err);
      }
    });
  }
}

export const eventSystem = new EventSystem();
