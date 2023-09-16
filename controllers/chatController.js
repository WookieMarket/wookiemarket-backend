const iniciarChat = (req, res) => {
  const userId = req.params.userId;
  
  // Lógica para iniciar el chat
  // Conversación en la base de datos, etc.

  // mensaje de registro en la consola del servidor
  console.log(`Conexión de chat iniciada para el usuario con ID: ${userId}`);

  res.json('Chat iniciado exitosamente');
};

module.exports = {
  iniciarChat,
};