var fs = require('fs');

output = ["name,Cycle_Time_in_Days,lat,lon"];

for (let i = 0; i < 100; i++) {
    output.push(`Civilian Camera: ${i + 1},${(Math.random() * 31).toFixed(2)},${51.50743 + (Math.random() - 0.5) * 0.5},${-0.1231133 + (Math.random() - 0.5) * 0.5}`);
}

fs.writeFile('CivilianCameras/civCameras.csv', output.join("\n"), function (err) {
    if (err) throw err;
    console.log('\nSaved to file civCameras.csv');
});
