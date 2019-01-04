import moment from 'moment';
import huejay from 'huejay';
import waitup from 'waitup';

import config from './config';

const ALARM_PREFIX = "_ALARM_";
const ALARM_COLOR_GROUP = ALARM_PREFIX + "_color";
const ALARM_BLINK_GROUP = ALARM_PREFIX + "_blink";


export default class AlarmSystem {
    async init() {
        this.oldStates = {};
        this.activated = null;

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

        let lights = await this.client.lights.getAll();
        console.log('Lights');
        console.log('=============');
        console.log(lights.map(l => `${l.id} - ${l.name}`).join("\n"));

        let groups = await this.client.groups.getAll();
        let groupsToDelete = groups.filter(g => g.name.startsWith(ALARM_PREFIX)).map(g => this.client.groups.delete(g.id));
        console.log(`Deleting ${groupsToDelete.length} old alarm groups`);

        //delete old alarm groups
        Promise.all(groupsToDelete);

        //create alarm groups
        this.colorGroup = new this.client.groups.Group;
        this.colorGroup.name = ALARM_COLOR_GROUP;
        this.colorGroup.lightIds = [27, 14];
        this.colorGroup = await this.client.groups.create(this.colorGroup);
        console.log(`Created group alarm color group with id ${this.colorGroup.id}`)

        this.normalGroup = new this.client.groups.Group;
        this.normalGroup.name = ALARM_BLINK_GROUP;
        this.normalGroup.lightIds = [28, 22];
        this.normalGroup = await this.client.groups.create(this.normalGroup);
        console.log(`Created group alarm blink group with id ${this.normalGroup.id}`)
    }

    async activate() {
        this.activated = new Date();
        //await this.monitor();
        await this.triggerAlarm();
    }

    async deactivate() {
        this.activated = null;
    }

    async monitor() {
        let sensors = await this.client.sensors.getAll();
        let presence = sensors.filter((s) => s.model.type == 'CLIPPresence');
        let triggered = presence.filter(s => moment.utc(s.state.lastupdated).isAfter(moment(this.activated)));
        if (triggered.length > 0 || true) {
            await this.triggerAlarm();
        } else if (this.activated != null) {
            setTimeout(async () => this.monitor(), 5000)
        }
    }

    async triggerAlarm() {
        this.activated = new Date();
        console.log(`Alarm triggered at ${this.activated}`);
        await this.saveCurrentState();
        await this.updateAlarm();
    }

    async saveCurrentState() {
        let lights = await this.client.lights.getAll();

        this.oldStates = {};
        for (let light of lights) {
            this.oldStates[light.id] = { on: light.on, brightness: light.brightness, hue: light.hue, saturation: light.saturation, colorTemp: light.colorTemp};
            console.log(`Saving ${light.id} - ${light.name} with parameters ${JSON.stringify(this.oldStates[light.id])} to restore later`);
        }
    }

    async updateAlarm() {
        this.colorGroup.on = true;
        this.colorGroup.hue = this.alarmState == 0 ? 65535 : 43690;
        this.colorGroup.saturation = 254;
        this.colorGroup.brightness = 254;
        this.colorGroup.transitionTime = 0.4;
        await this.client.groups.save(this.colorGroup);

        this.normalGroup.on = this.alarmState == 0;
        this.normalGroup.saturation = 254;
        this.normalGroup.brightness = 254;
        this.normalGroup.colorTemp = 153;
        this.normalGroup.transitionTime = 0.0;
        await this.client.groups.save(this.normalGroup);

        if (this.activated != null) {
            this.alarmState = this.alarmState == 0 ? 1 : 0;
            setTimeout(() => this.updateAlarm(), 5000);
        } else {
            setTimeout(() => this.restoreLights(), 1000);
        }
    }

    restoreLights() {
        if (Object.keys(this.oldStates).length > 0) {
            let k = Object.keys(this.oldStates)[0];
            this.client.lights.getById(k).then(light => {
                let state = this.oldStates[k];
                if (state.hue != undefined) {
                    light.hue = state.hue;
                }

                if (state.saturation != undefined) {
                    light.saturation = state.saturation;
                }

                if (state.brightness != undefined) {
                    light.brightness = state.brightness;
                }

                if (state.colorTemp != undefined) {
                    light.colorTemp = state.colorTemp;
                }
                light.on = state.on;
                delete this.oldStates[k];

                return this.client.lights.save(light);
            }).then(() => {
                console.log(`Restored light with id: ${k}`);
            }).catch(e => {
                console.log(`Failed to restore ${k}, ${e}`);
            }).finally(() => {
                setTimeout(() => this.restoreLights(), 200);
            });
        }
    }
}