import * as express from "express"

import Alarm from "./alarm/Alarm"
import config from "./config"

const alarm = new Alarm()
alarm.trigger()

const app = express()
app.get("/monitor", async (req, res) => {
    await alarm.monitor()
    res.send("ok")
})

app.get("/stop", async (req, res) => {
    await alarm.stop()
    res.send("ok")
})

app.listen(config.port, () => {
    console.log(`Started alarm service on port ${config.port}`)
})
