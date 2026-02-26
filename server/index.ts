import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js"; // CAMBIO: Usamos .js (o nada)
import { serveStatic } from "./static";      // CAMBIO: Usamos .js (o nada)
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuración de Middlewares
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

// Middleware de Logging para depuración en Vercel
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Función de inicio asíncrona
(async () => {
  // 1. Registro de rutas del Backend
  await registerRoutes(httpServer, app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  // 2. Configuración de Frontend (Vite o Estático)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, httpServer);
  }

  // 3. Ejecución del servidor (Solo en local)
  if (process.env.NODE_ENV !== "production") {
    const port = 5050;
    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Servidor local rodando em http://localhost:${port}`);
    });
  }
})();

// VITAL PARA VERCEL: Exportamos la app como default
export default app;