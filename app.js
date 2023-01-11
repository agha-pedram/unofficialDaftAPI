const express = require('express');
const request = require('request');
// const fs = require('fs');
// const fs = require('fs');
const HTMLParser = require('node-html-parser');

const app = express();
const port = process.env.PORT || 3333;
counties = ['antrim', 'armagh', 'carlow', 'cavan', 'clare', 'cork', 'derry',
    'donegal', 'down', 'dublin', 'fermanagh', 'galway', 'kerry', 'kildare',
    'kilkenny', 'laois', 'leitrim', 'limerick', 'longford', 'louth', 'mayo',
    'meath', 'monaghan', 'offaly', 'roscommon', 'sligo', 'tipperary',
    'tyrone', 'waterford', 'westmeath', 'wexford', 'wicklow'];
// console.log(`active port: ${port}`)

app.get('/', (req, res) => {
    res.send('This is an unofficial API for Daft.ie<br/>Find the source code <a href="https://github.com/agha-pedram/unofficialDaftAPI">here</a>');
});

app.get('/api/scrape', (reqAPI, resAPI) => {

    if (!reqAPI.query.county) {
        resAPI.status(400).send('Please specify county!');
        return;
    }

    reqCounty = reqAPI.query.county.toLowerCase()
    if (!counties.includes(reqCounty)) {
        resAPI.status(400).send('County is not valid!');
        return;
    }

    let url = `http://www.daft.ie/property-for-sale/${reqCounty}?sort=publishDateDesc`;

    function parseTitles(err, res, body) {
        if (err) { return console.log(err); }
        if (res.statusCode === 200) {
            allRecords = []
            output = ''
            parsedBody = HTMLParser.parse(body);
            titles = parsedBody.querySelectorAll('li[data-testid|=result]');
            titles.forEach(title => {
                record = {}

                record.id = title.getAttribute('data-testid').split('-')[1]
                record.link = 'https://www.daft.ie' + title.getElementsByTagName('a')[0].getAttribute('href')
                cardElement = title.querySelector('div[data-testid=title-block]');

                priceElement = cardElement.querySelector('div[data-testid=price]')
                record.price = parseInt(priceElement.rawText.replace(/[^0-9]/g, ''));
                record.price = priceElement.rawText

                addressElement = cardElement.querySelector('p[data-testid=address]')
                record.address = addressElement.rawText

                bedElement = cardElement.querySelector('p[data-testid=beds]')
                if (bedElement) {
                    record.bed = parseInt(bedElement.rawText.replace(/[^0-9]/g, ''))
                };

                bathElement = cardElement.querySelector('p[data-testid=baths]')
                if (bathElement) {
                    record.bath = parseInt(bathElement.rawText.replace(/[^0-9]/g, ''))
                };

                areaElement = cardElement.querySelector('p[data-testid=floor-area]')
                if (areaElement) {
                    record.area = parseInt(areaElement.rawText.replace(/[^0-9]/g, ''))
                    record.area = areaElement.rawText
                }

                typeElement = cardElement.querySelector('p[data-testid=property-type]')
                if (typeElement) {
                    record.type = typeElement.rawText
                }

                berElement = cardElement.querySelector('img[data-testid=ber-image]');
                if (berElement) {
                    record.ber = berElement.getAttribute('src').split('/').at(-1).split('.svg')[0]
                }

                // console.log(record);
                allRecords.push(record)
                output += JSON.stringify(record);
            });
            // console.log(allRecords);
            // let data = JSON.stringify(allRecords);
            // fs.writeFileSync('output.json', data);
            // fs.writeFileSync('outputmongo.json', output);
            // fs.appendFile('appendmongo.json', output, err => {
            //     if (err) {
            //       throw err;
            //     }
            // });
            resAPI.status(200).send(allRecords);
        }
    };

    request(url, { json: true }, (err, res, body) => parseTitles(err, res, body));

});

app.listen(port, () => console.log(`Server is running on port ${port}... `));