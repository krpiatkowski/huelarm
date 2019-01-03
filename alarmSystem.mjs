import moment from 'moment';
import hue from "node-hue-api"

import config from './config';

const ALARM_PREFIX = "_ALARM_";
const ALARM_COLOR_GROUP = ALARM_PREFIX + "_color";

export default class AlarmSystem {
    async init() {
        this.oldStates = {};
        this.activate = null

        let bridges = await hue.nupnpSearch();
        console.log(`Found ${bridges.length} bridges`)

        if (bridges.count == 0) {
            console.log("No bridge found exiting");
        }

        let bridgeHost = bridges[0].ipaddress;
        console.log(`selected bridge on ${bridgeHost}`);

        this.api = new hue.HueApi(bridgeHost, config.hueToken)

        let groups = await this.api.groups();
        let groupsToDelete = groups.filter(g => g.name.startsWith(ALARM_PREFIX)).map(g => this.api.deleteGroup(g.id));
        console.log(`Deleting ${groupsToDelete.length} old alarm groups`);

        //delete old alarm groups
        Promise.all(groupsToDelete);

        //create alarm groups
        let colorAlarmGroup = await this.api.createGroup(ALARM_COLOR_GROUP, [27]);
        this.colorAlarmGroupId = colorAlarmGroup.id;
        console.log(`Created group alarm color group with id ${this.colorAlarmGroupId}`)

    }

    async activate() {
        this.activated = new Date();
        await this.monitor();
    }

    async deactivate() {
        this.activated = null;
    }

    async monitor() {
        let result = await this.api.sensors();
        let presence = result.sensors.filter((s) => s.type == 'ZLLPresence');
        let triggered = presence.filter(s => moment.utc(s.state.lastupdated).isAfter(moment(this.activated)));
        if (triggered.length > 0 || true) {
            await this.triggerAlarm();
        } else if (this.activated != null) {
            setTimeout(async () => this.monitor(), 5000)
        }
    }

    async triggerAlarm() {
        this.activated = new Date();
        await this.saveCurrentState();
        await this.updateAlarm();
    }

    async saveCurrentState() {
        let result = await this.api.lights();
        let lights = result.lights;

        this.oldStates = {};
        lights.forEach(l => {
            if (l.state.on) {
                this.oldStates[l.id] = l.state;
            }
        });
    }

    async updateAlarm() {
        let state = hue.lightState.create().on().transitionInstant().hsb(this.alarmState == 0 ? 359 : 240, 100, 100);
        await this.api.setGroupLightState(this.colorAlarmGroupId, state);

        this.alarmState = this.alarmState == 0 ? 1 : 0;
        if (this.activated != null) {
            this.alarmJob = setTimeout(async () => this.updateAlarm(), 1000);
        } else {
            Object.keys(this.oldStates).forEach(async k => {
                await this.api.setLightState(k, this.oldStates[k]).then(() => {
                    console.log(`Restored light with id: ${k}`);
                }).done();
            });
        }
    }
}