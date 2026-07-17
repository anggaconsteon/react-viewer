/**
  Frontez startup function
  called every frontez app launch

  npm install axios@0.27.2
  node v16 (GCF)

{
  "clt": "DEV2",
  "ssid": "1DDo_ZNY-8D5wyt-bfGSh2FSFIpQ7DwlO-I2ZO5q4drs",
  "tz" : 7.0,
  "lc" : "en",
  "cc" : "us",
  "ver": "0.9.25.05",
  "wd" : 1080,
  "hg" : 2038,
  "dvc": "Android-10-Samsung-A1"
}

  221224 HH : add tz,lc,cc,wd,hg,dvc
  240112 HH : update sample data
 */

const version = '2402.2';
const axios = require('axios').default;
const prefix = 'https://script.google.com/macros/s/';
const postfix = '/exec';
let rwDibArray = [];  //= array of dib server for read operation
let machine = process.platform;
getDibArray(rwDibArray);
if (machine === "win32") {
  main();
}

exports.appStartup2 = async (req, res) => {
  console.log('version: ' + version);
  let p = req.body;
  getDibArray(rwDibArray, p['clt']);
  let result = await runStartup(p);
  //result = JSON.stringify({"dibResult": 300, "dibMessage": "--", "v": "4.2402.01" });
  res.send(result);
}; // end of readSS

function getDibArray(dibArray) {
  if (dibArray.length < 1) {
    dibArray.push('AKfycbzKCmu7bNwVaXmE1vY0pK24C3ZTXW4K9ga5_1mtDJWfrfZzmKfT46OAKnUqbqR9VJpf'); //= 1c
    //dibArray.push('AKfycbyZTUTUSC-WffG2wDE6AcGbwk3sPg66PbOMc40VwwV8MI9v5Ho'); //= vertriz.102w
    //dibArray.push('AKfycbyg6pscyyboR-flgKFgTPeFvaFNSLyjUqIpGx3cZv7QOg6Vkf0'); //= vertriz.105a
    //dibArray.push('AKfycbwmmfZ4p7Qc_DzsmffbrMjHxYPXpXFD7szGFVXktanFIuLzR0Y'); //= vx000.001b2
  }
  return true;
} // end of getDibArray

async function runStartup(param) {
  let readResult = [];
  var readArray = [];
  readArray.push(
    executeStartup(param)
  );

  await Promise.all(readArray.map(p => p.catch(e => e)))
    .then(function (res) {
      readResult = res;
    })
    .catch(function (err) {
      console.log(err);
    }); // end of Promise.all
  //let endResult = stringCleanup(JSON.stringify(readResult));
  endResult = JSON.stringify(readResult);
  return endResult;
} // end of insertSS

async function executeStartup(par) {
  let tail = "?action=STARTUP&ssid=" + par['ssid'] + "&ver=" + par['ver'];
  tail += '&tz=' + par['tz'] + '&lc=' + par['lc'] + '&cc=' + par['cc'];
  tail += '&wd=' + par['wd'] + '&hg=' + par['hg'] + '&dvc=' + par['dvc'];
  console.log(tail);
  return new Promise((resolve, reject) => {
    callRWDib(rwDibArray, tail)
      .then(res =>
        resolve(res.dibResult > 0 ? "OK" : res.dibMessage))
      .catch(err => reject(err));
  });
} // end of writepreadsheetRC

async function callRWDib(rwArray, rwTail) {
  // call dib RW server in rwArray with parameter tail (concat)
  //   when fail will retry with other server in array
  var delayTime = [0];
  let ix;
  let tail = encodeURI(rwTail);

  async function retryCall(ix, tail, delayTime) {
    async function callDib(ix, tail, delayTime) {
      if (delayTime[0] > 0) {
        ix = ix < (rwArray.length - 1) ? ix + 1 : 0;
        console.log("Retry callRWDib(" + prefix + rwArray[ix] + postfix + tail + ")");
      }
      await sleep(delayTime[0]);
      delayTime[0] = 10;                                                                               //= advance 100 ms
      let url = prefix + rwArray[ix] + postfix + tail;
      return new Promise((resolve, reject) => {
        callAxiosG(url)
          .then((res) =>
            resolve(res))
          .catch((err) =>
            reject(err));
      }); // promise
    } // end of getInfo

    let attempt = await callDib.bind(null, ix, tail, delayTime); // *****change await
    return retry(attempt, 5, null)
      .catch((err) => { throw err; });
  } // end of retryGetInfo

  ix = Math.floor((rwArray.length) * Math.random());

  return new Promise((resolve, reject) => {
    retryCall(ix, tail, delayTime)
      .then((res) =>
        resolve(res))
      .catch((err) =>
        reject(err));
  });
} // end of callRWDib

function retry(fn, retries = 20, err = null) {
  // generic retry with default 20 retries
  if (retries <= 0) {
    return Promise.reject(err);
  }
  return fn().catch(err => {
    return retry(fn, (retries - 1), err);
  });
}

function sleep(ms) {
  // sleep for ms milisecond.
  //   use: await sleep(20);
  //console.log("sleep for " + ms + "ms.");
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAxiosG(url) {
  // wrapper of caller to collanium's dib using axio with error detected from script
  // error detected if dibResult is undefined or < 0
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then(response => {
        let dt = response.data;
        let dibres = dt.dibResult;
        if (typeof response.data.dibResult === 'undefined' || response.data.dibResult < 0) {
          let er;
          if (typeof response.data.dibResult === 'undefined')
            er = -999;                                                                                 //= when dibResult in undefined return -999 [general error]
          else
            er = response.data.dibResult;                                                              //= return dibResult. Negative number of trace in dib to debug the error
          reject(er);                                                                                  //= reject as error
        } else {
          resolve(response.data);                                                                      //= Success, return all data.
        }
      })
      .catch(err => {
        reject(err);                                                                                   //= general error occured, return the error
      }); // end of axios.get
  }); // end of return new Promise
} // end of callAxioG

function stringCleanup(str) {
  // change special character to format _uxxxx_ . These character will be decoded back to origial by dib
  // special characters : ◆◇◈⬤⭘◼◻◀◁▶▷○●★☆
  let res = str;
  if (typeof str === "string") {
    res = res.replace(/&/g, "%26");
    let ch = "◆";
    let i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25C6_");
      i = res.search(ch);
    }
    ch = "◇";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25C7_");
      i = res.search(ch);
    }
    ch = "◈";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25C8_");
      i = res.search(ch);
    }
    ch = "⬤";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u2B24_");
      i = res.search(ch);
    }
    ch = "⭘";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u2B58_");
      i = res.search(ch);
    }
    ch = "◼";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_25FC_");
      i = res.search(ch);
    }
    ch = "◻";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25FB_");
      i = res.search(ch);
    }
    ch = "◀";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25C0_");
      i = res.search(ch);
    }
    ch = "◁";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25C1_");
      i = res.search(ch);
    }
    ch = "▶";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25B6_");
      i = res.search(ch);
    }
    ch = "▷";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25B7_");
      i = res.search(ch);
    }
    ch = "○";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25CB_");
      i = res.search(ch);
    }
    ch = "●";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u25CF_");
      i = res.search(ch);
    }
    ch = "★";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u2605_");
      i = res.search(ch);
    }
    ch = "☆";
    i = res.search(ch);
    while (i >= 0) {
      res = res.replace(ch, "_u2606_");
      i = res.search(ch);
    }
  }
  return res;
} // end of stringCleanup

async function main() {
  let p = {
    "clt": "dev2",
    "ssid": "1DDo_ZNY-8D5wyt-bfGSh2FSFIpQ7DwlO-I2ZO5q4drs",
    "tz": 7,
    "lc": "id",
    "cc": "id",
    "ver": "091942",
    "wd": 720,
    "hg": 1280,
    "dvc": "Test-device-main1"
  };
  
  let url = 'https://script.google.com/macros/s/AKfycbzKCmu7bNwVaXmE1vY0pK24C3ZTXW4K9ga5_1mtDJWfrfZzmKfT46OAKnUqbqR9VJpf/exec';
  url += '?action=STARTUP&ssid=1DDo_ZNY-8D5wyt-bfGSh2FSFIpQ7DwlO-I2ZO5q4drs&ver=091942&tz=7&lc=id&cc=id&wd=720&hg=1280&dvc=Test-device-main1';
  /*
  let res = await axios({
    method: 'get'
    , url: url
    , responseType: 'text'
  }).then(response => {
    if (typeof response.data.dibResult === 'undefined' || response.data.dibResult < 0) {
      let er;
      if (typeof response.data.dibResult === 'undefined')
        er = -999;                                                                                 //= when dibResult in undefined return -999 [general error]
      else
        er = response.data.dibResult;                                                              //= return dibResult. Negative number of trace in dib to debug the error
      reject(er);                                                                                  //= reject as error
    } else {
      resolve(response.data);                                                                      //= Success, return all data.
    }
  })
    .catch(err => {
      //reject(err);                                                                                   //= general error occured, return the error
    }); // end of axios.get
  */
  let result = await runStartup(p);
  process.exit;
} // end of main