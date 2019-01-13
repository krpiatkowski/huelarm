import moment from 'moment';

export default class HueSensors {
    constructor(trigger, client, delay) {
        this.client = client;
        this.trigger = trigger;
        this.delay = delay;
        this.activated = null;
        this.monitorTimer = null;
    }

    start() {
        this.activated = new Date();
        console.log(`Started to monitor hue sensors at ${moment(this.activated)}`);
        (async () => {
            await this.monitor();
        })();
    }

    stop() {
        if(this.monitorTimer != null) {
            this.monitorTimer.cancel();
            this.monitorTimer = null
        }
    }

    async monitor() {
        let sensors = await this.client.sensors.getAll();
        let presence = sensors.filter(s => s.type == 'ZLLPresence');
        let triggered = presence.filter(s => moment.utc(s.state.lastupdated).isAfter(moment(this.activated)));
        if (triggered.length > 0) {
            console.log(`Trigged hue sensors [${triggered.map(m => m.name)}] reporting`);
            this.trigger();
        } else if (this.activated != null) {
            this.monitorTimer = setTimeout(async () => this.monitor(), this.delay)
        }
    }

}