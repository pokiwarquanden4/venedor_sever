import { createMessage } from "../messageService";

const socketConnection = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_room", (data) => {
      socket.join(data);
    });
    socket.on("send_message", (data) => {
      socket.to(data.roomId).emit(`receive_message`, data);
      createMessage(data);
    });
  });
};

export default socketConnection;
