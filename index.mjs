import express from 'express';
import moment from 'moment';

import config from './config';
import AlarmSystem from './alarmSystem'

(async () => {
    try {
        const alarmSystem = new AlarmSystem();
        await alarmSystem.init();

        const app = express();
        app.get('/activate', async (req, res) => {
            console.log(`Activated alarm at ${moment(new Date())}`);
            await alarmSystem.activate();
            res.send("ok");
        });

        app.get('/deactivate', async (req, res) => {
            console.log(`Deactivated alarm at ${moment(new Date())}`);
            await alarmSystem.deactivate();
            res.send("ok");
        });

        app.listen(config.port, () => {
            console.log(`Started alarm service on port ${config.port}`)
        });

    } catch (e) {
        console.log(e)
    }
})();