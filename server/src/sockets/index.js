export function configureSockets(io) {
  io.on("connection", socket => {
    socket.on("survey:join", surveyId => {
      if (typeof surveyId === "string" && surveyId.length < 200) {
        socket.join(`survey:${surveyId}`);
      }
    });

    socket.on("survey:leave", surveyId => {
      if (typeof surveyId === "string") socket.leave(`survey:${surveyId}`);
    });
  });
}