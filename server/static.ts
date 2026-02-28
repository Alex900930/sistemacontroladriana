import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // En Vercel, process.cwd() es la raíz del proyecto
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.error("❌ Carpeta de build no encontrada en:", distPath);
  }
}