const axios = require('axios').default;
var fs = require('fs');

output = [];

async function main() {
    const page = (await axios.get('http://archive.tfljamcams.net/#list')).data;

    cameraArray = page.match(/<li><a href='.*'>.*<\/a><\/li>/gi);
    cameraArray = cameraArray.map((item) => {
        cutString = item.replace(/^<li><a href='/gi, "");
        cutString = cutString.replace(/<\/a><\/li>/gi, "");

        return cutString.split(/'>/);
    });

    promiseArray = [];
    i = 0;
    for (const [link, cameraName] of cameraArray) {
        promiseArray.push(new Promise(async (resolve, reject) => {
            try {
                const cameraLocationPage = (await axios.get("http://archive.tfljamcams.net/" + link, {timeout: 15000})).data;
                const location = cameraLocationPage.match(/query=(.*)';/)[1].split(",");
                output.push(`${cameraName.replace(/_/gi, " ")},${26},${"http://archive.tfljamcams.net/" + link},${location[0]},${location[1]}`);

                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Current progress: [${i}/${cameraArray.length}] | ${(100 * i/cameraArray.length).toFixed(2)}%`);
                i++;

                resolve();
            } catch (err) {
                console.log(`Failed to get Camera ${cameraName}/${link}`);
                resolve();
            }
        }));
    }

    await Promise.all(promiseArray);

    fs.writeFile('cameras.csv', output.join("\n"), function (err) {
        if (err) throw err;
        console.log('\nSaved to file cameras.csv');
    });
}

output.push("Name,Cycle Time (days),Link,lat,lon\n");
main()