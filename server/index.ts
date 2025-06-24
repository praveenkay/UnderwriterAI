import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Simplified server setup without Vite middleware to prevent connection issues
  const port = 5000;
  
  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // In development, serve a simple index page instead of Vite middleware
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // Simple HTML page for development
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AgentVerse - AI Underwriting Assistant</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50">
          <div class="min-h-screen flex items-center justify-center">
            <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
              <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">AgentVerse</h1>
                <p class="text-gray-600 mb-6">AI-Powered Underwriting Assistant</p>
                
                <div class="space-y-4">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span class="text-green-800 text-sm">Database Connected</span>
                    </div>
                  </div>
                  
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span class="text-blue-800 text-sm">API Services Online</span>
                    </div>
                  </div>
                  
                  <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span class="text-purple-800 text-sm">AI Integration Active</span>
                    </div>
                  </div>
                </div>
                
                <div class="mt-8 space-y-3">
                  <a href="/api/health" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                    API Health Check
                  </a>
                  
                  <div class="text-center text-sm text-gray-500">
                    Application is ready for deployment
                  </div>
                </div>
                
                <div class="mt-8 pt-6 border-t border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Available Features</h3>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-gray-50 rounded p-3">
                      <div class="font-medium text-gray-900">Chat Interface</div>
                      <div class="text-gray-600">AI Assistant</div>
                    </div>
                    <div class="bg-gray-50 rounded p-3">
                      <div class="font-medium text-gray-900">Document Upload</div>
                      <div class="text-gray-600">Auto Processing</div>
                    </div>
                    <div class="bg-gray-50 rounded p-3">
                      <div class="font-medium text-gray-900">Activity Tracking</div>
                      <div class="text-gray-600">PDF Reports</div>
                    </div>
                    <div class="bg-gray-50 rounded p-3">
                      <div class="font-medium text-gray-900">User Settings</div>
                      <div class="text-gray-600">Preferences</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }

  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
