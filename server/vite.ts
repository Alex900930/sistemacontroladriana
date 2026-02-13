import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Middleware de Vite para manejar archivos estáticos y HMR
  app.use(vite.middlewares);

  // CORRECCIÓN DEFINITIVA PARA EXPRESS 5 / PATH-TO-REGEXP
  // Usamos una expresión regular explícita que Express 5 entiende perfectamente
  app.get(/^\/(?!api).*/, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      if (!fs.existsSync(clientTemplate)) {
        return res.status(404).send("index.html não encontrado na pasta client");
      }

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Evita cache agresivo en el navegador de Adriana durante el desarrollo
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}