const router = require('./routes');
const mongoose = require('mongoose');
const express = require('express'); 

const app = express(); 

app.use('/', router);

mongoose.connect('mongodb://localhost/Blogging', { useNewUrlParser: true })
  .then(() => console.log("Success"))
  .catch(() => console.error("Error")); 


const port = 4000;
app.listen(port, () => console.log(`Server started at port ${port}`));