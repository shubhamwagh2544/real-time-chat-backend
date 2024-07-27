import { connection, server as WebSocketServer } from "websocket";
import http from "http";
import { UserManager } from "./UserManager";

import { InMemoryStore } from "./store/InMemoryStore";
import { IncomingMessage, SupportedMessage } from "./messages/IncomingMessages";

const server = http.createServer(function (request: any, response: any) {
  console.log(new Date() + " Received request for " + request.url);
  response.writeHead(404);
  response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function () {
  console.log(new Date() + " Server is listening on port 8080");
});

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

function originIsAllowed(origin: string) {
  return true;
}

wsServer.on("request", function (request) {
  console.log("inside connect");

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(new Date() + " Connection from origin " + request.origin + " rejected.");
    return;
  }

  const connection = request.accept("echo-protocol", request.origin);
  console.log(new Date() + " Connection accepted.");
  connection.on("message", function (message) {
    // Todo: Add rate limiting logic here
    if (message.type === "utf8") {
      try {
        messageHandler(JSON.parse(message.utf8Data), connection);
      } catch (error) {
        console.log(error);
      }
    }
  });
});

function messageHandler(message: IncomingMessage, connection: connection) {
  if (message.type === SupportedMessage.JoinRoom) {
    const payload = message.payload;
    userManager.addUser(payload.name, payload.userId, payload.roomId, connection);
  }
  if (message.type === SupportedMessage.SendMessage) {
    const payload = message.payload;
    const user = userManager.getUser(payload.roomId, payload.userId);
    if (!user) {
      console.log('User not Found!')
      return;
    }
    store.addChat(payload.roomId, payload.userId, user.name, payload.message);
    // Todo: Add broadcasting logic here
  }
  if (message.type === SupportedMessage.UpVoteMessage) {

  }
}
