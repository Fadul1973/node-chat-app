const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filtter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicadairectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicadairectoryPath))
// when server has been connected
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // To join user when you click join in the first page
    socket.on('join', (Options, callback) => {
        const {error,user} = addUser({id:socket.id, ...Options}) // adding user
        
        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id) // Access to use user data
        const filtter = new Filtter()

        if(filtter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id) // Access to use user data
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    // when server has been disconnected
    socket.on('disconnect', () => {
        // removing the user and store it in a variable user
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }      
    })
})

server.listen(port, () => {
    console.log(`The server is up and lestining on port ${port}!`)
})


