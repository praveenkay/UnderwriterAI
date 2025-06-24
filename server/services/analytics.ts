import { storage } from "../storage";
import type { InsertAnalyticsEvent, InsertBrokerMetrics } from "@shared/schema";

/**
 * Analytics service for tracking broker activity and performance
 */

export async function trackEvent(eventData: InsertAnalyticsEvent): Promise<void> {
  try {
    await storage.createAnalyticsEvent(eventData);
  } catch (error) {
    console.error("Failed to track analytics event:", error);
  }
}

export async function trackChatMessage(
  brokerId: number,
  brokerName: string,
  sessionId: string,
  messageType: string = "text"
): Promise<void> {
  await trackEvent({
    eventType: "chat_message",
    brokerId,
    brokerName,
    sessionId,
    entityType: "chat",
    metadata: { messageType },
    duration: 0
  });
}

export async function trackDecision(
  brokerId: number,
  brokerName: string,
  sessionId: string,
  policyId: number,
  decision: string,
  confidence: number,
  responseTime: number
): Promise<void> {
  await trackEvent({
    eventType: "decision_made",
    brokerId,
    brokerName,
    sessionId,
    entityType: "policy",
    entityId: policyId,
    metadata: { decision, confidence },
    duration: responseTime
  });
}

export async function trackDocumentUpload(
  brokerId: number,
  brokerName: string,
  documentId: number,
  fileType: string,
  processingTime: number
): Promise<void> {
  await trackEvent({
    eventType: "document_uploaded",
    brokerId,
    brokerName,
    entityType: "document",
    entityId: documentId,
    metadata: { fileType },
    duration: processingTime
  });
}

export async function updateBrokerMetrics(brokerId: number): Promise<void> {
  try {
    const broker = await storage.getUser(brokerId);
    if (!broker) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's analytics events for this broker
    const events = await storage.getAnalyticsEventsByBroker(brokerId, 1000);
    const todayEvents = events.filter(e => 
      new Date(e.timestamp).toDateString() === today.toDateString()
    );

    // Calculate metrics
    const chatEvents = todayEvents.filter(e => e.eventType === "chat_message");
    const decisionEvents = todayEvents.filter(e => e.eventType === "decision_made");
    const documentEvents = todayEvents.filter(e => e.eventType === "document_uploaded");

    const totalChats = chatEvents.length;
    const totalDecisions = decisionEvents.length;
    const avgResponseTime = decisionEvents.length > 0 
      ? decisionEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / decisionEvents.length
      : 0;

    const confidenceValues = decisionEvents
      .map(e => e.metadata ? JSON.parse(e.metadata as string)?.confidence : 0)
      .filter(c => c > 0);
    const avgConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : 0;

    const successfulDecisions = decisionEvents.filter(e => {
      const metadata = e.metadata ? JSON.parse(e.metadata as string) : {};
      return metadata.decision === "approved";
    }).length;

    const escalatedCases = decisionEvents.filter(e => {
      const metadata = e.metadata ? JSON.parse(e.metadata as string) : {};
      return metadata.decision === "escalated";
    }).length;

    const documentsUploaded = documentEvents.length;

    // Get active policies count
    const allPolicies = await storage.getAllPolicies();
    const activePolicies = allPolicies.filter(p => p.isActive).length;

    const metricsData: InsertBrokerMetrics = {
      brokerId,
      brokerName: broker.name,
      metricDate: today,
      totalChats,
      totalDecisions,
      avgResponseTime,
      avgConfidence,
      successfulDecisions,
      escalatedCases,
      documentsUploaded,
      activePolicies
    };

    await storage.createOrUpdateBrokerMetrics(metricsData);
  } catch (error) {
    console.error("Failed to update broker metrics:", error);
  }
}

export async function getBrokerAnalytics(brokerId: number) {
  try {
    const broker = await storage.getUser(brokerId);
    if (!broker) return null;

    const metrics = await storage.getBrokerMetrics(brokerId);
    const recentEvents = await storage.getAnalyticsEventsByBroker(brokerId, 50);

    return {
      broker,
      metrics,
      recentEvents,
      summary: {
        totalActivities: recentEvents.length,
        lastActivity: recentEvents[0]?.timestamp || null,
        performanceScore: metrics ? (metrics.avgConfidence * 100).toFixed(1) : "N/A"
      }
    };
  } catch (error) {
    console.error("Failed to get broker analytics:", error);
    return null;
  }
}