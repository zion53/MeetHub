const express=require('express')
const app=express()
const server=require('http').Server(app)
const io=require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');


app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
const {requireLogin,ensureGuest}=require('./helpers/authHelper');
require('./passport/google_strategy');

app.use((req,res,next)=>{
    res.locals.user=req.user||null;
    next();
});

app.set('view engine','ejs')
app.use(express.static('public'))


app.get('/',ensureGuest,(req,res)=>{
    res.render('login')
})
//authentication using google oauth2.0
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    console.log("Successful authentication, redirect home")
    res.redirect('/home');
  });

app.get('/home',requireLogin,(req,res)=>{
    res.render('home')
})  

app.get('/logout',(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

// create a new room
app.get('/createRoom', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})
// join an existing room
app.post('/joinRoom',(req,res)=>{
    res.redirect(`/${req.body.ROOM_ID}`)
})
  
app.get('/:roomId', (req, res) => {
    console.log(req.user.id)
    res.render('pvroom',{ROOM_ID : req.params.roomId,userId:req.user.id,userName:req.user.displayName})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)
      //user connected
      socket.broadcast.to(roomId).emit('user-connected',userId)
      //send message in room
      socket.on('send-chat-message',(roomId,message)=>{
        console.log('message brodcated')
        socket.broadcast.to(roomId).emit('new-chat',message)
      })
      //user disconnected
      socket.on('disconnect', () => {
        socket.broadcast.to(roomId).emit('user-disconnected',userId)
      })
      //white board mouse movements
      socket.on('mouse-down',(roomId,x,y)=>{
        socket.broadcast.to(roomId).emit('mousedown',x,y)
      })
      socket.on('mouse-up',roomId=>{
        socket.broadcast.to(roomId).emit('mouseup')
      })
      socket.on('drawing',(roomId,x,y)=>{
        socket.broadcast.to(roomId).emit('draw',x,y)
      })
      socket.on('clear-canvas',()=>{
        socket.broadcast.to(roomId).emit('clearCanvas')
      })
    })
  })


server.listen(3000,()=>{
    console.log("server is listening")
})