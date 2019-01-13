export default class Lights {
    Lights(client) { 
        this.client = client;
        
        this.oldStates = {};
    }

    async init() {
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

    trigger() {
        this.saveCurrentState()
        .then(this.updateAlarm())
        .done();
    }  


    async saveCurrentState() {
        return this.client.lights.getAll(lights => {
            this.oldStates = {};
            for (let light of lights) {
                this.oldStates[light.id] = { on: light.on, brightness: light.brightness, hue: light.hue, saturation: light.saturation, colorTemp: light.colorTemp};
                console.log(`Saving ${light.id} - ${light.name} with parameters ${JSON.stringify(this.oldStates[light.id])} to restore later`);
            }   
        });
    }
    
    updateAlarm() {
        return this.updateColorGroup.then(this.updateNormalGroup).then(() => {
            this.alarmState = this.alarmState == 0 ? 1 : 0;
            this.updateAlarm = setTimeout(() => this.updateAlarm().done(), 5000);
        });
    }

    updateColorGroup() {
        this.colorGroup.on = true;
        this.colorGroup.hue = this.alarmState == 0 ? 65535 : 43690;
        this.colorGroup.saturation = 254;
        this.colorGroup.brightness = 254;
        this.colorGroup.transitionTime = 0.4;
        return this.client.groups.save(this.colorGroup);
    }

    updateNormalGroup() {
        this.normalGroup.on = this.alarmState == 0;
        this.normalGroup.saturation = 254;
        this.normalGroup.brightness = 254;
        this.normalGroup.colorTemp = 153;
        this.normalGroup.transitionTime = 0.0;
        return this.client.groups.save(this.normalGroup);
    }

    stop() {
        this.updateAlarm.cancel();
        this.updateAlarm = null;
        
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