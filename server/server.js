import http from "node:http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { configureSockets } from "./src/sockets/index.js";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    credentials: true
  }
});

app.set("io", io);
configureSockets(io);

await connectDB();

httpServer.listen(env.port, () => {
  console.log(`MarineGuard backend running on http://localhost:${env.port}`);
  console.log(`API: http://localhost:${env.port}/api/v1`);
});