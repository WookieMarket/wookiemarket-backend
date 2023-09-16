const express = require('express');
const router = express.Router();
const chatController = require('../../../controllers/chatController');

// Ruta para iniciar chat
/*router.post('/chat/:userId', chatController.startChat);

module.exports = router;*/

router.post('/:userId', (req, res) => {
  const userId = req.params.userId;

  // Tu lógica para iniciar el chat
  console.log(`Se ha establecido una conexión para el usuario con ID ${userId}`);

  res.json({ message: `Chat iniciado exitosamente desde usuario ${userId}`});
});

module.exports = router;
