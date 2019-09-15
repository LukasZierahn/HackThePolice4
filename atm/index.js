var fs = require('fs');

inp = fs.readFileSync("atm/lstemaplate.csv", "utf8");
lines = inp.split("\n");

output = ["company,adress,lat,lon"];

for (const line of lines) {
    try {
        const endBit = line.match(/"(.*)"/gi)[0].replace("\"", "").replace("\"", "");
        let adress = (endBit.match(/\((.*)\)/gi))[0];

        while (adress.match(/^\(.*\).*\(.*\)$/gi) !== null) {
            adress = adress.replace(/^\((.*)\)./, "");
            if (adress.match(/\((.*)\)/gi) == null) {
                adress = `(${adress}`;
            }
            adress = adress.match(/\((.*)\)/gi)[0];
        }

        const [lon, lat] = line.split(",", 3);

        output.push(`cardtronics,"${adress.substr(1, adress.length - 2)}",${lat},${lon}`);
    } catch (err) {
        console.log(err);
        console.log(`failed to parse line: ${line}\n`);
    }
}

fs.writeFileSync("atm/atm.csv", output.join("\n"));