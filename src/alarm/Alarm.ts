import {Client, discover} from "huejay"
import * as moment from "moment"

import config from "../config"
import Effect from "./effects/Effect"
import Lights from "./effects/Lights"
import HueSensor from "./monitors/HueSensors"
import Monitor from "./monitors/Monitor"

export default class Alarm {
    private client: Client
    private monitors: Monitor[]
    private effects: Effect[]

    constructor() {
        (async () => {
            let ip = config.ip
            if (ip === undefined) {
                const bridges = await discover()
                console.log(`Found ${bridges.length} bridges`)
                if (bridges.count === 0) {
                    console.log("No bridge found exiting")
                }
                ip = bridges[0].ip
            }
            console.log(`selected bridge on ${ip}`)

            this.client = new Client({
                host: ip,
                username: config.hueToken
            })

            this.monitors = [
                // new HueSensor(() => this.trigger(), this.client, 500)
            ]

            this.effects = [
                new Lights(this.client)
            ]
        })()
    }

    public monitor() {
        console.log(`Started monitoring at ${moment(new Date())}`)

        this.monitors.forEach((monitor) => {
            monitor.start()
        })
    }

    public stop() {
        console.log(`Stopped alarm at ${moment(new Date())}`)

        this.effects.forEach((effect) => {
            effect.stop()
        })

        this.monitors.forEach((monitor) => {
            monitor.stop()
        })
    }

    public trigger() {
        console.log(`Alarm triggered at ${moment(new Date())}`)
        this.effects.forEach((effect) => {
            effect.start()
        })
    }

}
