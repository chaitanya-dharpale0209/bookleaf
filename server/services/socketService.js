/**
 * Socket.IO Real-Time Service
 * Provides bidirectional live updates between Authors and BookLeaf Ops Admins.
 */

let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`Client connected: ${socket.id}`);

    // Join Author or Admin room upon authentication
    socket.on('join_room', (data) => {
      if (!data) return;
      const { role, authorId } = data;

      if (role === 'admin') {
        socket.join('admin');
        // console.log(`Admin joined admin room: ${socket.id}`);
      } else if (role === 'author' && authorId) {
        socket.join(`author:${authorId}`);
        // console.log(`Author ${authorId} joined author room: ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

function emitTicketCreated(ticket) {
  if (!ioInstance) return;
  // Notify all admins of new incoming ticket
  ioInstance.to('admin').emit('ticket:created', ticket);
}

function emitTicketUpdated(ticket) {
  if (!ioInstance) return;
  // Notify admin queue
  ioInstance.to('admin').emit('ticket:updated', ticket);
  // Notify specific author
  if (ticket.author_id) {
    ioInstance.to(`author:${ticket.author_id}`).emit('ticket:updated', ticket);
  }
}

function emitMessageCreated(ticketId, message, authorId) {
  if (!ioInstance) return;
  // Notify admins
  ioInstance.to('admin').emit('message:created', { ticketId, message });
  // Notify author
  if (authorId) {
    ioInstance.to(`author:${authorId}`).emit('message:created', { ticketId, message });
  }
}

function emitNoteCreated(ticketId, note) {
  if (!ioInstance) return;
  // Internal notes: STRICTLY ADMIN ONLY
  ioInstance.to('admin').emit('note:created', { ticketId, note });
}

module.exports = {
  initSocket,
  getIO,
  emitTicketCreated,
  emitTicketUpdated,
  emitMessageCreated,
  emitNoteCreated
};
