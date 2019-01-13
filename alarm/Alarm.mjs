import huejay from 'huejay';
import moment from 'moment';

import config from './../config';
import HueSensor from './monitors/HueSensors'

const ALARM_PREFIX = "_ALARM_";
const ALARM_COLOR_GROUP = ALARM_PREFIX + "_color";
const ALARM_BLINK_GROUP = ALARM_PREFIX + "_blink";


export default class Alarm {
    async init() {
        let ip = config.ip;    
        if(ip == undefined) {
            let bridges = await huejay.discover()
            console.log(`Found ${bridges.length} bridges`)
            if (bridges.count == 0) {
                console.log("No bridge found exiting");
            }
            ip = bridges[0].ip;
        }
        console.log(`selected bridge on ${ip}`);

        this.client = new huejay.Client({
            host: ip,
            username: config.hueToken
        });

        this.monitors = [
            new HueSensor(() => this.trigger, this.client, 5000)
        ];

        this.effects = [

        ];

        this.monitor();
    }

    monitor() {
        console.log(`Started monitoring at ${moment(new Date())}`);

        this.monitors.forEach(monitor => {
            monitor.start();
        });
    }

    stop() {
        console.log(`Stopped alarm at ${moment(new Date())}`);

        this.effects.forEach(effect => {
            effect.stop();
        });

        this.monitors.forEach(monitor => {
            monitor.stop();
        });
    }

    trigger() {
        console.log(`Alarm triggered at ${this.activated}`);
        this.effects.forEach(effect => {
            effect.trigger();
        });
    }
   
}