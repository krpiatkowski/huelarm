import Airplayer from 'airplayer'

export default class AirplaySiren {
    constructor() {
        this.airplayer = Airplayer();
        this.airplayer.on('update', (player) => {
            console.log(player)
        });
    }

    trigger() {
        console.log(this.airplayer.players)
        this.airplayer.update();
    }
}