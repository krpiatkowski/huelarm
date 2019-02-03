import { Client } from "huejay"

import Effect from "./Effect"

const ALARM_PREFIX = "_ALARM_"
const ALARM_COLOR_GROUP = ALARM_PREFIX + "_color"
const ALARM_BLINK_GROUP = ALARM_PREFIX + "_blink"

interface LightState {
    on: boolean
    brightness: number
    hue: number
    saturation: number
    colorTemperatur: number
}

export default class Lights implements Effect {
    private client: Client
    private colorGroup: any
    private blinkGroup: any
    private oldStates: Map<string, LightState>

    constructor(client: Client) {
        (async () => {
            this.oldStates = new Map<string, LightState>()
            this.client = client

            const groups = await this.client.groups.getAll()
            // delete old alarm groups
            const groupsToDelete = groups.filter((g: any) => g.name.startsWith(ALARM_PREFIX)).map((g) => this.client.groups.delete(g.id))
            console.log(`Deleting ${groupsToDelete.length} alarm groups`)
            await Promise.all(groupsToDelete)
        })()
    }

    public start() {
        (async () => {
            await this.startAsync()
        })()
    }

    public stop() {
        // TODO: implement
    }

    private async startAsync() {
        let lights = await this.client.lights.getAll()
        lights = lights.filter((l) => l.id === "27" || l.id === "28")

        this.oldStates = await this.getCurrentStates(lights)

        this.colorGroup = this.createColorGroup(lights)
        this.blinkGroup = this.createBlinkGroup(lights)
    }

    private async getCurrentStates(lights: any) {
        const states = new Map<string, LightState>()
        console.log("Found the following Lights")
        console.log("=============")
        console.log(lights.map((l) => `${l.id} - ${l.name} - ${l.type}`).join("\n"))

        lights.forEach((l) => {
            states[l.id] = { on: l.on, brightness: l.brightness, hue: l.hue, saturation: l.saturation, colorTemp: l.colorTemp }
        })
        return states
    }

    private async createColorGroup(lights: any) {
        // create alarm groups
        const group = new this.client.groups.Group()
        group.name = ALARM_COLOR_GROUP
        group.lightIds = lights.filter((l) => l.type === "Extended color light").map((l) => l.id)
        await this.client.groups.create(group)
        console.log(`Created group alarm color group with id ${group.id} with the lights [${group.lightIds}]`)
        return group
    }

    private async createBlinkGroup(lights: any) {
        const group = new this.client.groups.Group()
        group.name = ALARM_BLINK_GROUP
        group.lightIds = lights.filter((l) => l.type !== "Extended color light").map((l) => l.id)
        await this.client.groups.create(group)
        console.log(`Created group alarm blink group with id ${group.id} with the lights [${group.lightIds}]`)
        return group
    }

    // public trigger() {
    //     console.log(`Triggered hue lights`);
    //     (async () => {
    //         await this.monitor()
    //     })()

    //     this.saveCurrentState()
    //         .then(this.updateAlarm())
    //         .done()
    // }

    // public async saveCurrentState() {
    //     return this.client.lights.getAll((lights) => {
    //         this.oldStates = {}
    //         for (const light of lights) {
    //             this.oldStates[light.id] = { on: light.on, brightness: light.brightness, hue: light.hue, saturation: light.saturation, colorTemp: light.colorTemp }
    //             console.log(`Saving ${light.id} - ${light.name} with parameters ${JSON.stringify(this.oldStates[light.id])} to restore later`)
    //         }
    //     })
    // }

    // public updateAlarm() {
    //     return this.updateColorGroup
    //         .then(this.updateNormalGroup)
    //         .then(() => {
    //             this.alarmState = this.alarmState === 0 ? 1 : 0
    //             this.updateAlarm = setTimeout(() => this.updateAlarm().done(), 5000)
    //         })
    // }

    // public updateColorGroup() {
    //     this.colorGroup.on = true
    //     this.colorGroup.hue = this.alarmState === 0 ? 65535 : 43690
    //     this.colorGroup.saturation = 254
    //     this.colorGroup.brightness = 254
    //     this.colorGroup.transitionTime = 0.4
    //     return this.client.groups.save(this.colorGroup)
    // }

    // public updateNormalGroup() {
    //     this.normalGroup.on = this.alarmState === 0
    //     this.normalGroup.saturation = 254
    //     this.normalGroup.brightness = 254
    //     this.normalGroup.colorTemp = 153
    //     this.normalGroup.transitionTime = 0.0
    //     return this.client.groups.save(this.normalGroup)
    // }

    // public stop() {
    //     this.updateAlarm.cancel()
    //     this.updateAlarm = null

    //     if (Object.keys(this.oldStates).length > 0) {
    //         const k = Object.keys(this.oldStates)[0]
    //         this.client.lights.getById(k).then((light) => {
    //             const state = this.oldStates[k]
    //             if (state.hue !== undefined) {
    //                 light.hue = state.hue
    //             }

    //             if (state.saturation !== undefined) {
    //                 light.saturation = state.saturation
    //             }

    //             if (state.brightness !== undefined) {
    //                 light.brightness = state.brightness
    //             }

    //             if (state.colorTemp !== undefined) {
    //                 light.colorTemp = state.colorTemp
    //             }
    //             light.on = state.on
    //             delete this.oldStates[k]

    //             return this.client.lights.save(light)
    //         }).then(() => {
    //             console.log(`Restored light with id: ${k}`)
    //         }).catch((e) => {
    //             console.log(`Failed to restore ${k}, ${e}`)
    //         }).finally(() => {
    //             setTimeout(() => this.restoreLights(), 200)
    //         })
    //     }
    // }
}
