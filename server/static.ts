import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  // Obtenemos la ruta raíz de forma segura para ESM
  const rootPath = process.cwd();
  // Tu script de build genera los archivos en dist/public
  const distPath = path.resolve(rootPath, "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.warn(`⚠️ Directorio de build no encontrado en: ${distPath}. Asegúrate de que 'npm run build' se ejecute correctamente.`);
    return;
  }

  // Servir archivos estáticos (js, css, imágenes)
  app.use(express.static(distPath, { index: false }));

  // CUALQUIER otra ruta que no sea API, debe devolver el index.html (Single Page App)
  app.get("*", (req, res, next) => {
    // Si la ruta empieza con /api, no enviamos el HTML (dejamos que pase a las rutas de API)
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}