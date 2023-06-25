import { createMessage } from "../messageService";

const socketConnection = (io) => {
  try {
    io.on("connection", (socket) => {
      socket.on("join_room", (data) => {
        console.log(socket.id + " Join to room: " + data);
        socket.join(data);
      });
      socket.on("send_message", (data) => {
        console.log("Sent to room: " + data.roomId);
        socket.to(data.roomId).emit(`receive_message`, data);
        createMessage(data);
      });
      socket.on("exit_room", (data) => {
        console.log(socket.id + " Leave room: " + data);
        socket.leave(data);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export default socketConnection;
