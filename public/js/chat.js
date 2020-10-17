const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')       //grabbing the div where message-template will be rendered


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML   //grabbing the html inside template
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-templete').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

//function to sutoscroll
const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild  //get the most recent message element as a node object

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)    //get margin value
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin    //height of new message + margin value
    
    //visible height of messages container
    const visibleHeight = $messages.offsetHeight

    //actual height of messages container
    const containerHeight = $messages.scrollHeight  //scrollHeight gives us the total height we can scroll through

    //how far have I scrolled i.e. the distance left from the bootm
    const scrollOffset = $messages.scrollTop + visibleHeight   //scrollTop gives us, as a number, the amount of distance we have scrolled from the top

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight  //scroll to bottom
    }

}

//listen to welcome message event
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Listen to locationMessage event
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        mapsUrl: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//listen for submit event
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()      //tell browser not to refresh page

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value      //get textbox value from form using name attribute of input-tag
    
    //send event to server along with message data
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })                 
})

$sendLocationButton.addEventListener('click', () => {
    
    if (!navigator.geolocation) {       //when browser does not support geolocation
        return alert('Geolocation is not supported by your browser!')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    //share location with server
    navigator.geolocation.getCurrentPosition((position) => {    //using browser's geolocation API
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'     //redirect to join page
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})