const app = require('./app')
const socketApp = require('./socketApp')

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Started test server on port ${PORT}`);
})

const SOCKET_PORT = process.env.SOCKET_PORT || 3030;

socketApp.run(SOCKET_PORT, () => {
  console.log(`Started socket server on port ${SOCKET_PORT}`)
})