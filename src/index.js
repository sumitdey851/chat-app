const path = require('path')    //path is node core module -> no npm installation required
const http = require('http')    //importing core module http to refactor server creation outside of express library
const express = require('express')      //setting up express
const socketio = require('socket.io')   //setup socket.io
const Filter = require('bad-words')     //npm to filter profane words
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)   //creating server outside of the express library
const io = socketio(server)             //creating instance of socket.io passing in the server


const port = process.env.PORT || 3000       //setting up port
const publicDirPath = path.join(__dirname, '../public')     //setting up public directory path

app.use(express.static(publicDirPath))      //configure express to serve up public directory



//listen on the connection event for incoming sockets(new connections) and log it to the console.
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))       //create event and send welcome message to client
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))   //send to all other users except current user

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    //listen for sendMessage event
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))         //send message to all users
        callback()
    })

    //listen for sendLocation event
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))  //sends the location as a clickable link
        callback()
    })

    //listen for disconnection
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))  //send a message to everyone when a user disconnects
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

//start up the app
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})