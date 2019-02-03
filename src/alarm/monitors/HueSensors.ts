import { Client } from "huejay"
import * as moment from "moment"
import {schedule, ScheduledTask} from "node-cron"

import Monitor from "./Monitor"

export default class HueSensors implements Monitor {
    private trigger: () => void
    private client: Client
    private delay: number
    private activated: Date
    private task: ScheduledTask

    constructor(trigger: () => void, client: Client, delay: number) {
        this.client = client
        this.trigger = trigger
        this.delay = delay
    }

    public start() {
        this.activated = new Date()
        console.log(`Started to monitor hue sensors at ${moment(this.activated)}`)
        this.task = schedule("*/5 * * * * *", async () => this.monitor())
        this.task.start()
    }

    public stop() {
        this.task.stop()
        this.task.destroy()
    }

    public async monitor() {
        const sensors = await this.client.sensors.getAll()
        const presence = sensors.filter((s: any) => s.type === "ZLLPresence")
        const triggered = presence.filter((s: any) => moment.utc(s.state.lastUpdated).isAfter(moment(this.activated)))
        if (triggered.length > 0) {
            console.log(`Trigged hue sensors [${triggered.map((m: any) => m.name)}]`)
            this.trigger()
            this.stop()
        }
    }

}
