const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket service initialized');
    return this.io;
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      socket.userRole = decoded.role;
      socket.userFullName = decoded.fullName;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  async handleConnection(socket) {
    console.log(`User ${socket.userId} connected`);

    // Add to connected users
    this.addConnectedUser(socket.userId, socket.id);

    // Join user room for private messages
    socket.join(`user_${socket.userId}`);

    // Join user's conversation rooms
    await this.joinUserConversations(socket);

    // Handle events
    this.handleSocketEvents(socket);

    // Notify online status
    this.broadcastUserStatus(socket.userId, true);

    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  addConnectedUser(userId, socketId) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId).push(socketId);
  }

  removeConnectedUser(userId, socketId) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      const updatedSockets = userSockets.filter(id => id !== socketId);
      if (updatedSockets.length === 0) {
        this.connectedUsers.delete(userId);
      } else {
        this.connectedUsers.set(userId, updatedSockets);
      }
    }
  }

  async joinUserConversations(socket) {
    try {
      const conversations = await Conversation.find({
        'participants.userId': socket.userId
      });

      conversations.forEach(conversation => {
        socket.join(conversation._id.toString());
        console.log(`User ${socket.userId} joined conversation ${conversation._id}`);
      });
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  handleSocketEvents(socket) {
    // Typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: socket.userId,
        userFullName: socket.userFullName,
        isTyping: true,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: socket.userId,
        userFullName: socket.userFullName,
        isTyping: false,
        conversationId: data.conversationId
      });
    });

    // Join specific conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
  }

  handleDisconnection(socket) {
    console.log(`User ${socket.userId} disconnected`);
    this.removeConnectedUser(socket.userId, socket.id);

    // Notify offline status if no more connections
    if (!this.connectedUsers.has(socket.userId)) {
      this.broadcastUserStatus(socket.userId, false);
    }
  }

  broadcastUserStatus(userId, isOnline) {
    this.io.emit('user_status_change', {
      userId,
      isOnline,
      timestamp: new Date()
    });
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  sendToUser(userId, event, data) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }
}

module.exports = new SocketService();