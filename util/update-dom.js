/* global document, Image */

module.exports = (data) => new Promise((resolve) => {
    const segments = data.segments;
    const overview = segments.find((s) => s.type === 'overview');

    const promises = [];

    promises.push(new Promise((resolve) => {
        const image = document.getElementById('avatar');
        image.src = data.platformInfo.avatarUrl;
        image.onload = resolve;
        image.onerror = resolve;
    }));

    document.getElementById('gamertag').innerText = data.platformInfo.platformUserHandle;
    document.getElementById('rank').innerText = overview.stats.rank.metadata.label;
    document.getElementById('level').innerText = overview.stats.rank.displayValue;
    document.getElementById('level-next').innerText = (overview.stats.rank.value + 1).toString();
    document.getElementById('rank-progression').style.width = overview.stats.rankProgression.displayValue;

    document.getElementById('kd').innerText = overview.stats.kdRatio.displayValue;
    document.getElementById('spm').innerText = overview.stats.scorePerMinute.displayValue;
    document.getElementById('kills').innerText = overview.stats.kills.displayValue;
    document.getElementById('score').innerText = overview.stats.scoreGeneral.displayValue;
    document.getElementById('time').innerText = overview.stats.timePlayed.displayValue;

    // top class
    // const topClass = c.sort((c1, c2) => c2.score.value - c1.score.value)[0];
    //
    // // top class image
    // promises.push(new Promise((resolve) => {
    //     const image = new Image();
    //     image.onload = resolve;
    //     image.onerror = resolve;
    //     image.src = `img/${topClass.class}.png`;
    //
    //     document.getElementById('top-class-img').setAttribute('src', image.src);
    // }));


    return Promise.all(promises)
        .then(() => resolve(undefined));
});