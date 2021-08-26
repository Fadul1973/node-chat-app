 const socket = io()
 // Elements
 const $messageForm = document.querySelector('#message-form')
 const $messageFormInput = $messageForm.querySelector('input')
 const $messageFormButton = $messageForm.querySelector('button')
 const $sendLocationButton = document.querySelector('#send-location')
 const $messages = document.querySelector('#messages')
 //Templates
 const messageTemplate = document.querySelector('#message-template').innerHTML
 const locationMessageTemplate = document.querySelector('#location-Message-template').innerHTML
 const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML
 //Options
 const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})
 // Function for autoscrall
 const autoscroll = () => {
      // New message element
      const $newMessage = $messages.lastElementChild

      // Height of the new message
      const newMessageStyles = getComputedStyle($newMessage)
      const newMessageMargin =parseInt(newMessageStyles.marginBottom)
      const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

      // Visible Height
      const visibleHeight = $messages.offsetHeight

      // Height of messages container
      const containerHeight = $messages.scrollHeight

      //How far have i scralled
      const scrollOffset = $messages.scrollTop + visibleHeight // To give the measurment

      if(containerHeight - newMessageHeight >= scrollOffset) {
          $messages.scrollTop = $messages.scrollHeight
      }
 }

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')// to change the time stamp to something readable
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // add the url to the document
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// to provide room data
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

    $messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = document.querySelector('input').value

    socket.emit('sendMessage',message, (error) => {
        // enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log('message deliverd!')
    })
})

    $sendLocationButton.addEventListener('click', () =>{
   
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    // disable form
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
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
        location.href = '/' //to send the user to the home page
    }
})