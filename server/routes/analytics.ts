import type { Express } from "express";
import { storage } from "../storage";

export function registerAnalyticsRoutes(app: Express) {
  // Get broker analytics summary
  app.get("/api/analytics/broker/:id", async (req, res) => {
    try {
      const brokerId = parseInt(req.params.id);
      const metrics = await storage.getBrokerMetrics(brokerId);
      const events = await storage.getAnalyticsEventsByBroker(brokerId, 50);
      
      res.json({
        metrics,
        recentEvents: events,
        summary: {
          totalActivities: events.length,
          lastActivity: events[0]?.timestamp || null,
          performanceScore: metrics ? (metrics.avgConfidence * 100).toFixed(1) : "N/A"
        }
      });
    } catch (error) {
      console.error("Failed to get broker analytics:", error);
      res.status(500).json({ error: "Failed to fetch broker analytics" });
    }
  });

  // Get all broker metrics
  app.get("/api/analytics/brokers", async (req, res) => {
    try {
      const metrics = await storage.getAllBrokerMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Failed to get all broker metrics:", error);
      res.status(500).json({ error: "Failed to fetch broker metrics" });
    }
  });

  // Create analytics event
  app.post("/api/analytics/events", async (req, res) => {
    try {
      const event = await storage.createAnalyticsEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error("Failed to create analytics event:", error);
      res.status(500).json({ error: "Failed to create analytics event" });
    }
  });
}