const express = require('express')
require('./db/mongoose.js')

const userrouter = require('./routers/user.js')

const taskRouter = require('./routers/tasks.js')

const User = require('./models/user.js')

const Tasks = require('./models/tasks.js')

const app = express();

const port = process.env.PORT 


// app.use((req,res,next) => {
//     res.status(503).send('site under maintanence')
// })


app.use(express.json())

app.use(userrouter)

app.use(taskRouter)



app.listen(port, () => {
    console.log('server is up on ' + port);
})