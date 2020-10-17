const users = []    //array of user objects

//add user
const addUser = ({ id, username, room }) => {
    //clean the data
    username = username.trim().toLowerCase()    //delete extra spaces from username and change it lowercase
    room = room.trim().toLowerCase()    //delete extra spaces and change to lowercase

    //validate the data
    if(!username || !room) {
        return {
            error: "Username and Room are required!"
        }
    }

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //validate username
    if(existingUser) {
        return {
            error: "Username is in use!"
        }
    }

    //store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

//remove user by id
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)


    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
}

//get user by id
const getUser = (id) => {
    return users.find((user) => user.id === id)
}

//get all users in a room
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}