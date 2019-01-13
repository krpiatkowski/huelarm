import express from 'express';

import config from './config';
import Alarm from './alarm/Alarm'

(async () => {
    try {
        const alarm = new Alarm();
        alarm.init();

        const app = express();
        app.get('/monitor', async (req, res) => {
            alarm.monitor();
            res.send("ok");
        });

        app.get('/stop', async (req, res) => {
            alarm.stop();
            res.send("ok");
        });

        app.listen(config.port, () => {
            console.log(`Started alarm service on port ${config.port}`)
        });

    } catch (e) {
        console.log(e)
    }
})();