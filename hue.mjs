

export default class Hue {   
    setHost(host) {
        this.api = new hue.HueApi(host, config.hueToken)
    }

    async findBridges() {
        return await hue.nupnpSearch()
    }

    async findSensors() {
        return await this.api.sensors();
    }

    async findLights() {
        return await this.api.lights();
    }

    async findGroups() {
        return await this.api.groups();
    }
}