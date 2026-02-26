import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // process.cwd() nos da la raíz del proyecto en Vercel
  const distPath = path.resolve(process.cwd(), "dist", "public");

  // Servir archivos estáticos (el JS y CSS de React)
  app.use(express.static(distPath));

  // FALLBACK: Si el usuario pide cualquier ruta (como /dashboard),
  // le entregamos el index.html y dejamos que React decida qué mostrar.
  app.get("*", (req, res, next) => {
    // Si la ruta empieza con /api, no enviamos el HTML
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Si no existe el index, es que el build falló.
      res.status(404).send("Frontend build not found. Run npm run build.");
    }
  });
}