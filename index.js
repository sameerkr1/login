const express=require('express');
const app=express();
const routes=require('./routes');
const path=require('path');
const { route } = require('./routes');

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.get('/', routes);
app.post('/register', routes);
app.get('/login', routes);
app.post('/login', routes);
app.get('/success', routes);
app.get('/logout', routes);
app.post('/addmsg', routes);
app.get('/addmsg',routes);


console.log('server started');
const PORT=process.env.PORT || 8000;
app.listen(PORT);