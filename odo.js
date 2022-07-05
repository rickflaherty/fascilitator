let px, py, pa;

exports.setPos = function setPos(pos) {
    px = pos[0];
    py = pos[1];
    pa = Math.atan2(py, px) * 180 / Math.PI;
}

exports.getPos = function getPos() {
    return [px, py];
}

exports.getPosa = function getPosa() {
    return pa;
}

exports.streamOdo = async function streamOdo(sprkp) {
    sprkp.streamOdometer(1);
    sprkp.on('odometer', function(data) {
        let posx = data.xOdometer.value[0];
        let posy = data.yOdometer.value[0];

        px = posx;
        py = posy;
        pa = Math.atan2(posy, posx) * 180 / Math.PI;

        /*console.log('  x: ' + global.posx + data.xOdometer.units);
        console.log('  y: ' + global.posy + data.yOdometer.units);*/
    });
}