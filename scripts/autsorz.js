// HH 230609 
// CiFirestore = https://script.google.com/home/projects/1CbViL4xew2U3V6RqdzY5bmsCyXM48k6rSTGeIVJk-kY2P1V3Cz9_XYbU
// Script Id for lib : 1CbViL4xew2U3V6RqdzY5bmsCyXM48k6rSTGeIVJk-kY2P1V3Cz9_XYbU = Collanium Firestore V8 Lib
// need to give user read access to above script
// HH 230721 add updateAUMCP1
// HH 230828 next need to implement request #9 [ResetDevice] phone invitation to firebase
//           then put in autsorzResetDevicePhoneUpdate()

const thisIsTest = false;
const currentCountryCode = '62';
const collection = "users_a1";                // users collection
const aumCP1C = '1QIh1diD289HVgGh-Bzqb5AwfPvoqYXUkC9AbljH2mbE'; // copy of authenium control panel 1
const auzCP1C = '1UiQhy3fq2ZOXHtZyjtuTHMO1l98ESe7Sbu_7SL8GLng'; // copy of auz621 | Control Panel 1

const aumCP1 = '147mXsH01LDSC042M8RnMxAJfVYsy992sBq4EUVTf9Yc'; // authenium control panel 1
const auzCP1 = '1x94Q1qXb4ouoxZNwLPoKjEKifnEq6-8aEMPMhzz4Mps'; // auz621 | Control Panel 1

const sheetName = 'AddUser';
const atiCP1SheetName = 'Active';
const auz621CP1SheetName = 'Client';
const adminListSsid = auzCP1;                                         // auz621 | Control Panel 1 for now
const adminSheetName = auz621CP1SheetName;
const finalAdminSheetName = 'Pegawai';
const indukAdminSheetName = finalAdminSheetName;
const indukListSsid = '1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg'; // autsorz | Support 2 for now
const indukSheetName = 'ClientInduk';
const clientRange = 'F3:F';
const indukRange = 'E3:I';
const sourceColumnOffset = 2;
const sourceRowOffset = 5;
const numberOfColumnInUpdateUser = 28;
const numberOfColumnInAddUser = 32;
const updateClientVidColumn = 11;     // Column K in update source
const addClientVidColumn = 11;        // Column K in update source
const cpVersion = 1;                  // version 1, ****change to version 2
let resultMode = 1; // 1=single; 2 = multiple will use short result

function onOpen() {
    var s1 = SpreadsheetApp.getActive();
    var menus = [
        { name: "[Autsorz] Reset device - Phone update", functionName: "autsorzResetDevicePhoneUpdate" }
        , { name: "[Autsorz] Add User", functionName: "autsorzAddUser" }
        , { name: "[Autsorz] Mutasi", functionName: "autsorzMutasi" }
        , { name: "[Autsorz] Reactivate", functionName: "autsorzReactivate" }
        , { name: "[Autsorz] Update Position", functionName: "autsorzUpdatePosition" }
    ];
    s1.addMenu("Autsorz", menus);
    menus = [
        { name: "[AddUser] To Authenium CP1", functionName: "addUserAumCP1" }
        , { name: "[AddUser] To Admin", functionName: "addAdmin" }
        , { name: "[AddUser] To Induk", functionName: "addInduk" }
        , { name: "[AddUser] Konfig apps to Admin", functionName: "updateAdminConfig2" }
        , { name: "[AddUser] Org Vids to Proxy", functionName: "updateProxyOrgVid" }
        , { name: "[AddUser] Listeners to Proxy", functionName: "updateProxyListeners" }
        , { name: "[AddUser] Konfig apps to proxy", functionName: "updateProxyConfigApp2" } // new
    ];
    s1.addMenu("Add user", menus);
    menus = [
        { name: "[Mutasi] Update Authenium CP1", functionName: "updateAUMCP1" }
        , { name: "[Mutasi] Update Induk", functionName: "updateInduk" }
        , { name: "[Mutasi] Add To Admin", functionName: "addAdmin2" }
        , { name: "[Mutasi] OrgVids to proxy", functionName: "updateProxyOrgVid2" }
        , { name: "[Mutasi] Listeners to proxy", functionName: "updateProxyListeners2" }
        , { name: "[ResetDevice] Phone invitation to Induk", functionName: "updateIndukInvitation" }
        , { name: "[ResetDevice] Phone invitation to Authenium CP1", functionName: "updateAUMCP1Invitation" }
        , { name: "[ResetDevice] Phone invitation to Admin", functionName: "updateAdminInvitation" }
        , { name: "[ResetDevice] Phone invitation to Proxy", functionName: "updateProxyInvitation" }
        , { name: "[UpdatePosition] Posisi To Induk", functionName: "updateIndukPosition" }
        , { name: "[UpdatePosition] Posisi to Admin", functionName: "updateAdminPosition" }
        , { name: "[UpdatePosition] Konfig apps to Admin", functionName: "updateAdminConfig" }
        , { name: "[UpdatePosition] Konfig apps to proxy", functionName: "updateProxyConfigApp" }
    ];
    s1.addMenu("Update user", menus);
}; // end of onOpen

function doNothing() {

} // end of doNothing

function autsorzUpdatePosition() { // #25 Menu [Autsorz] Reactivate
    resultMode = 2; // set to multiple operation result
    const targetRangeA1 = 'B5:B';
    const targetSheetName = 'UpdateUser';
    let displayArray = [];
    let targetSheet = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
    let targetRange = targetSheet.getRange(targetRangeA1);
    targetRange.setValue('');
    updateIndukPosition(); // #15 [UpdatePosition] Posisi to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAdminPosition(); // #16 [UpdatePosition] Posisi To Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAdminConfig(); // #17 [UpdatePosition] Konfig app to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyConfigApp();  // #18 [UpdatePosition] Konfig Apps to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    // not yet implemented    // #9 [ResetDevice] phone invitation to firebase
    addString(targetSheet, targetRangeA1, displayArray, '[ResetDevice] phone invitation to firebase: not implemented. ');
    targetSheet.getRange(targetRange.getRow(), targetRange.getColumn(), displayArray.length, 1).setValues(displayArray);
    resultMode = 1; // set back to single operation result
} // end of autsorzUpdatePosition

function autsorzReactivate() { // #25 Menu [Autsorz] Reactivate
    resultMode = 2; // set to multiple operation result
    const targetRangeA1 = 'B5:B';
    const targetSheetName = 'UpdateUser';
    let displayArray = [];
    let targetSheet = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
    let targetRange = targetSheet.getRange(targetRangeA1);
    targetRange.setValue('');
    updateIndukInvitation();  // #6 [ResetDevice] Phone invitation to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyInvitation();  // #8 [ResetDevice] Phone invitation to proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAUMCP1Invitation(); // #5 [ResetDevice] Phone invitation to Authenium CP1
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAUMCP1();  // #1 [Mutasi] Update to authenium cp1
    addResult(targetSheet, targetRangeA1, displayArray);
    updateInduk();  // #2 [Mutasi] to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    addAdmin2();  // #3 [Mutasi] Add to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateIndukPosition(); // #15 [UpdatePosition] Posisi to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAdminConfig(); // #17 [UpdatePosition] Konfig app to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyConfigApp();  // #18 [UpdatePosition] Konfig Apps to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyOrgVid2(); // #14 [Mutasi] Org vid to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyListeners2();  // #12 [Mutasi] Listeners to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    // not yet implemented    // #9 [ResetDevice] phone invitation to firebase
    addString(targetSheet, targetRangeA1, displayArray, '[ResetDevice] phone invitation to firebase: not implemented. ');
    targetSheet.getRange(targetRange.getRow(), targetRange.getColumn(), displayArray.length, 1).setValues(displayArray);
    resultMode = 1; // set back to single operation result
} // end of autsorzReactivate

function autsorzMutasi() { // #24 Menu [Autsorz] Mutasi
    resultMode = 2; // set to multiple operation result
    const targetRangeA1 = 'B5:B';
    const targetSheetName = 'UpdateUser';
    let displayArray = [];
    let targetSheet = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
    let targetRange = targetSheet.getRange(targetRangeA1);
    targetRange.setValue('');
    updateAUMCP1();  // #1 [Mutasi] Update to authenium cp1
    addResult(targetSheet, targetRangeA1, displayArray);
    updateInduk();  // #2 [Mutasi] to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    addAdmin2();  // #3 [Mutasi] Add to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAdminConfig(); // #17 [UpdatePosition] Konfig app to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyOrgVid2(); // #14 [Mutasi] Org vid to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyListeners2();  // #12 [Mutasi] Listeners to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyConfigApp();  // #18 [UpdatePosition] Konfig Apps to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    // not yet implemented    // #9 [ResetDevice] phone invitation to firebase
    addString(targetSheet, targetRangeA1, displayArray, '[ResetDevice] phone invitation to firebase: not implemented. ');
    targetSheet.getRange(targetRange.getRow(), targetRange.getColumn(), displayArray.length, 1).setValues(displayArray);
    resultMode = 1; // set back to single operation result
} // end of autsorzMutasi

function autsorzResetDevicePhoneUpdate() { // #18 Menu [Autsorz] Reset device - Phone update
    resultMode = 2; // set to multiple operation result
    const targetRangeA1 = 'B5:B';
    const targetSheetName = 'UpdateUser';
    let displayArray = [];
    let targetSheet = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
    let targetRange = targetSheet.getRange(targetRangeA1);
    targetRange.setValue('');
    updateAdminInvitation();  // #7 [ResetDevice] Phone invitation to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateIndukInvitation();  // #6 [ResetDevice] Phone invitation to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyInvitation();  // #8 [ResetDevice] Phone invitation to proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAUMCP1Invitation(); // #5 [ResetDevice] Phone invitation to Authenium CP1
    addResult(targetSheet, targetRangeA1, displayArray);
    // not yet implemented    // #9 [ResetDevice] phone invitation to firebase
    addString(targetSheet, targetRangeA1, displayArray, '[ResetDevice] phone invitation to firebase: not implemented. ');
    targetSheet.getRange(targetRange.getRow(), targetRange.getColumn(), displayArray.length, 1).setValues(displayArray);
    resultMode = 1; // set back to single operation result
} // end of autsorzResetDevicePhoneUpdate

function autsorzAddUser() { // #19 Menu [Autsorz] Add User
    resultMode = 2; // set to multiple operation result
    const targetRangeA1 = 'B5:B';
    const targetSheetName = 'AddUser';
    let displayArray = [];
    let targetSheet = SpreadsheetApp.getActive().getSheetByName(targetSheetName);
    let targetRange = targetSheet.getRange(targetRangeA1);
    targetRange.setValue('');
    // addUserAumCP1();          // ##1 [AddUser] to Authenium CP1
    // addResult(targetSheet, targetRangeA1, displayArray);
    addAdmin();               // ##2 [AddUser] to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    updateAdminConfig2();     // #4 [AddUser] Konfig Apps to Admin
    addResult(targetSheet, targetRangeA1, displayArray);
    addInduk();               // ##3 [AddUser] to Induk
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyConfigApp2();  // #20 [AddUser] Konfig Apps to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyListeners();   // #11 [AddUser] Listeners to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    updateProxyOrgVid();      // #13 [AddUser] Org Vid to Proxy
    addResult(targetSheet, targetRangeA1, displayArray);
    // not yet implemented    // #10 [AddUser] To Firebase
    addString(targetSheet, targetRangeA1, displayArray, '[AddUser] To Firebase: not implemented. ');
    targetSheet.getRange(targetRange.getRow(), targetRange.getColumn(), displayArray.length, 1).setValues(displayArray);
    resultMode = 1; // set back to single operation result
} // end of autsorzAddUser

function addResultTest() {
    const targetRange = 'B5:B';
    const targetSheet = 'AddUserTest';
    let displayArray = [];
    addResult(targetSheet, targetRange, displayArray);
    addResult(targetSheet, targetRange, displayArray);
} // end of addResultTest

function addString(targetSheet, rangeA1, resultArray, addedString) {
    // add current B5:B to resultArray then put B5:B to blank
    let recNum = targetSheet.getRange('A3').getValue();
    let targetRange = targetSheet.getRange(rangeA1);
    let rowIndex = targetRange.getRow();
    let colIndex = targetRange.getColumn();
    for (let i = 0; i < recNum; i++) {
        let newContent = ''
        if (resultArray.length > i) {
            newContent = resultArray[i][0];
        } // end if (resultArray.length <= i)
        if (addedString.toString().trim() !== '') {
            if (i != 0) {
                newContent += ' ' + addedString;
            } else {
                newContent += addedString;
            }
        } // end if (addedString.toString().trim() !== '')
        resultArray[i] = [newContent];
    }// end for newData
    targetSheet.getRange(rowIndex, colIndex, recNum, 1).setValue('');
    SpreadsheetApp.flush();
} // end of addString

function addResult(targetSheet, rangeA1, resultArray) {
    // add current B5:B to resultArray then put B5:B to blank
    let recNum = targetSheet.getRange('A3').getValue();
    let targetRange = targetSheet.getRange(rangeA1);
    let rowIndex = targetRange.getRow();
    let colIndex = targetRange.getColumn();
    // SpreadsheetApp.flush();
    let newData = targetSheet.getRange(rowIndex, colIndex, recNum, 1).getValues();
    for (let i = 0; i < newData.length; i++) {
        let newContent = ''
        if (resultArray.length > i) {
            newContent = resultArray[i][0];
        } // end if (resultArray.length <= i)
        if (newData[i][0].toString().trim() !== '') {
            if (i != 0) {
                newContent += ' ' + newData[i][0];
            } else {
                newContent += newData[i][0];
            }
        } // end if (newData[i][0].toString().trim() !== '')
        resultArray[i] = [newContent];
    }// end for newData
    let d = 1;
    targetSheet.getRange(rowIndex, colIndex, recNum, 1).setValue('');
    SpreadsheetApp.flush();
} // end of addResult

function updateProxyConfigApp2() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'AddUser';
    const actionName = '[' + sourceSheetName + '] Konfig apps to proxy';
    const numberOfColumnInSource = numberOfColumnInAddUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 5;                 // row to update in proxy
    const iArray = [[12, 2]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyConfigApp2

function updateProxyListeners2() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Listeners to proxy';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 4;                 // row to update in proxy
    const iArray = [[6, 3], [13, 4], [15, 5], [21, 9], [22, 10], [23, 11], [24, 12], [25, 13]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyListeners2

function updateProxyListeners() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'AddUser';
    const actionName = '[' + sourceSheetName + '] Listeners to Proxy';
    const numberOfColumnInSource = numberOfColumnInAddUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 4;                 // row to update in proxy
    const iArray = [[18, 9], [19, 10], [20, 11], [21, 12], [22, 13]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyListeners

function updateProxyConfigApp() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Konfig apps to proxy';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 5;                 // row to update in proxy
    const iArray = [[9, 2]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyConfigApp

function updateProxyOrgVid2() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] org Vids to Proxy';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 5;                 // row to update in proxy
    const iArray = [[26, 9], [27, 10], [28, 11]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyOrgVid2

function updateProxyOrgVid() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'AddUser';
    const actionName = '[' + sourceSheetName + '] Org Vids to Proxy';
    const numberOfColumnInSource = numberOfColumnInAddUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'op1';       // sheet name in proxy
    const finalRow = 5;                 // row to update in proxy
    const iArray = [[30, 9], [31, 10], [32, 11]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateProxyOrgVid

function updateProxyInvitation() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const proxyList = aumCP1;
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Phone invitation to proxy';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3;        // @ column C, user vid key to search
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 6;              // column F, column to get final ssid (proxy)
    const finalSheetName = 'System';    // sheet name in proxy
    const finalRow = 5;                 // row to update in proxy
    const iArray = [[5, 9], [7, 10]];

    generalSearchOnceAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, proxyList, atiCP1SheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRow, iArray, updateFlag);
} // end of updateIndukPosition

function directUpdate(sourceArray, targetSheet, targetRow, iArray, updateFlag) {
    // open targetSsid with sheet name
    // update target column in iArray, row = targetRow
    let result = '';
    for (let i = 0; i < iArray.length; i++) {
        let source = sourceArray[iArray[i][0] - sourceColumnOffset];
        let formerValue = targetSheet.getRange(targetRow, iArray[i][1]).getValue();
        if (updateFlag) {
            targetSheet.getRange(targetRow, iArray[i][1]).setValue(source);
        } // end if (updateFlag)
        if (i > 0) {
            result += ', ';
        } // end if (i > 0)
        if (formerValue.toString().trim() === '') {
            formerValue = '[BLANK]';
        }
        if (source.toString().trim() === '') {
            source = '[BLANK]';
        }
        result += formerValue.toString() + '=>' + source;
    } // end for iArray
    return result;
} // end of directUpdate

function generalSearchOnceAndUpdate(actionName, sourceSheetName, sourceNumberOfColumn, sourceKeyColumn, targetSsid, targetSheetName, targetRange, targetKeyColumn, finalColumn, finalSheetName, finalRow, instructionArray, updateFlag) {
    // search in targetSsid to get the final ssid
    // search content in sourceKeyColumn in final ssid
    // then execute instructionArray [[source,target column]]
    // if source = string, it will be written in target as it is. Integer = column number in spreadsheet
    // target column = column number in the target ssid (C=3)
    let clientIndukS = SpreadsheetApp.openById(targetSsid);
    let clientIndukSheet = clientIndukS.getSheetByName(targetSheetName);
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sourceSheetName);
    let numberOfRow = mySheet.getRange('A3').getValue();
    let sourceArray = mySheet.getRange(sourceRowOffset, sourceColumnOffset, numberOfRow, sourceNumberOfColumn).getValues(); // get all input
    for (let i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][0].toString().trim() === '') {
            let finalSsid = getSsidFromList(clientIndukSheet, targetRange, targetKeyColumn, sourceArray[i][sourceKeyColumn - sourceColumnOffset], finalColumn);
            let result;
            if (finalSsid == null) {
                //  induk not found should put message to source
                result = actionName + ': Vid ' + sourceArray[i][sourceKeyColumn - sourceColumnOffset] + ' not found in spreadsheet. '
                    + targetSsid + ' ' + clientIndukS.getName() + '>' + targetSheetName;
            } else {
                let targetSs = SpreadsheetApp.openById(finalSsid);
                let spreadsheetName = targetSs.getName();
                let finalSheet = targetSs.getSheetByName(finalSheetName);
                let updateResult = directUpdate(sourceArray[i], finalSheet, finalRow, instructionArray, updateFlag);
                result = actionName + ': Done';
                if (resultMode == 1) {
                    result += '. ' + finalSsid + ' ' + spreadsheetName + ' ';
                    result += updateResult + '. ';
                } else {
                    result += '. ';
                } // end if (resultMode == 1)
                if (!updateFlag) {
                    result += ' (not written). ';
                } // end if (!updateFlag)
            } // end if (finalSsid == null
            mySheet.getRange(sourceRowOffset + i, 2).setValue(result);
            SpreadsheetApp.flush();
        } // end if (sourceArray[i][0].toString().trim() !== '')
    } // end for i
} // end of generalSearchOnceAndUpdate

function updateIndukPosition() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Posisi To Induk';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 11;  // @ column K, client vid in Mutasi as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in induk
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 8;        // column H, column to get the final ssid
    const finalRefRange = 'B2:B';
    const finalSheetName = 'Pegawai';
    const iArray = [[8, 8]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, indukListSsid, indukSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRefRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateIndukPosition

function updateAdminPosition() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Posisi to Admin';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 13;  // @ column M, Vid Cost Center as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in Admin list
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 18;        // column R, column to get the final admin ssid
    const finalRange = 'B3:B';
    const finalSheetName = 'Pegawai';
    const iArray = [[8, 9]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, adminListSsid, adminSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateAdminPosition

function updateAdminConfig() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)  let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)  let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Konfig apps to Admin';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 13;  // @ column M, Vid Cost Center as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in final
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 18;        // column R, column to get the final admin ssid
    const finalRange = 'B3:B';
    const finalSheetName = 'Konfigurasi App';
    const iArray = [[9, 5]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, adminListSsid, adminSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateAdminConfig

function updateAdminConfig2() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'AddUser';
    const actionName = '[' + sourceSheetName + '] Konfig apps to Admin';
    const numberOfColumnInSource = numberOfColumnInAddUser;
    const sourceKeyForSeach = 23;  // @ column M, Vid Cost Center as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in final
    const targetRefRange = 'F3:F';
    const targetRefIndexForSearch = 0;
    const finalColumn = 18;        // column R, column to get the final admin ssid
    const finalRange = 'B3:B';
    const finalSheetName = 'Konfigurasi App';
    const iArray = [[12, 5]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, adminListSsid, adminSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, finalRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateAdminConfig2

function updateAUMCP1Invitation() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Phone invitation to Authenium CP1';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3; // @ column C
    const targetSheetName = atiCP1SheetName;
    const targetRefRange = 'B2:B';
    const targetRefIndexForSearch = 0;
    const iArray = [[17, 3], [7, 5]];
    userUpdate(actionName, sourceSheetName, numberOfColumnInSource, sourceKeyForSeach, targetSheetName, targetRefRange, targetRefIndexForSearch, iArray, updateFlag);
} // end of updateAUMCP1Invitation

function updateAdminInvitation() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Phone invitation to Admin';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 13;  // @ column K, client vid in Mutasi as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in induk
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 18;        // column R, column to get the final admin ssid
    const finalSheetName = 'Pegawai';
    const iArray = [[17, 7], [7, 5]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, adminListSsid, adminSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, targetRefRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateAdminInvitation

function getAumCP(vid, version) {
    /*
      version 0 = debug mode
      version 1 = all user are in 1 sheet (Active) -- old, will be discontinued
      version 2 = users are clustered. Search client's vid in Customer B3:B, then extract ssid from Column F
      version 3 = use firebase
    */
    const customerCP = '1voS9mQH1YvqZkBE6Flq3B1QjKIDMMyCyWlGFoN2_0C0'; // authenium | Customer Control Panel
    const customerCPSheetName = 'Customer';
    const vidRange = 'B3:B';
    const urlColumn = 6;     // F
    let result = '';

    try {
        if (version == 3) {
            result = aumCP1; // should be replaced by firebase query
        } else if (version == 2) {
            let listSheet = SpreadsheetApp.openById(customerCP).getSheetByName(customerCPSheetName);
            let listRange = listSheet.getRange(vidRange);
            let listRowOffset = listRange.getRowIndex();
            let listData = listRange.getValues();
            let rowIndex = findInArray(vid, listData, 0);
            if (rowIndex > 0) {
                try {
                    let url = listSheet.getRange(rowIndex + listRowOffset, urlColumn).getValue().toString().trim();
                    result = url.replace('https://docs.google.com/spreadsheets/d/', '');
                } catch (e) {
                    result = '';
                } // end try
            } // if (rowIndex > 0)
        } else if (version == 1) {
            result = aumCP1;
        } else {
            result = aumCP1C;
        } // end if (version == 3)
    } catch (cpError) {
        result = '';
    } // end try
    return result;
} // end of getAumCP

function updateIndukInvitation() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Update Induk Invitation';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 11;  // @ column K, client vid in Mutasi as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in induk
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 8;        // column H, column to get the final ssid
    const finalSheetName = 'Pegawai';
    const iArray = [[17, 6], [7, 7]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, indukListSsid, indukSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, targetRefRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateIndukInvitation

function updateInduk() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Update Induk';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 11;  // @ column K, client vid in Mutasi as key to search
    const sourceKeyForSearchInFinal = 3; // column C as target to search in induk
    const targetRefRange = 'B3:B';
    const targetRefIndexForSearch = 0;
    const finalColumn = 8;        // column H, column to get the final ssid
    const finalSheetName = 'Pegawai';
    const iArray = [[16, 9], ['active', 3]];

    generalSearchAndUpdate(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, indukListSsid, indukSheetName, targetRefRange, targetRefIndexForSearch
        , finalColumn, finalSheetName, targetRefRange, sourceKeyForSearchInFinal, iArray, updateFlag);
} // end of updateInduk

function addAdmin2() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Add Admin';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 13;   // @ column M, client Vid Cost Center in UpdateUser as key to search in reference List
    const refSheetName = auz621CP1SheetName;  // sheet name in reference where the ref data reside (Client)
    const refRange = 'B3:B';        // range in ref sheet where ref data reside.
    const refFinalColumn = 18;      // column R, column in reference where final ssid resides
    const finalSheetName = 'Pegawai'; // sheet in final to be updated
    const iArray = [[3, 2], [4, 4], [10, 3], [17, 7], [8, 9], [16, 10]]; // instruction array, copy from source to final

    generalSearchAndAdd(actionName, sourceSheetName, numberOfColumnInSource
        , sourceKeyForSeach, auzCP1, refSheetName, refRange, 0
        , refFinalColumn, finalSheetName, iArray, updateFlag);
} // end of addAdmin2

function generalSearchAndAdd(actionName, sourceSheetName, sourceNumberOfColumn, sourceKeyColumn, targetSsid, targetSheetName, targetRange, targetKeyColumn, finalColumn, finalSheetName, instructionArray, updateFlag) {
    // search in targetSsid to get the final ssid
    // add record with instructionArray [[source,target column]]
    // if source = string, it will be written in target as it is. Integer = column number in source sheet (C=3)
    // target column = column number in the target ssid
    let clientIndukS = SpreadsheetApp.openById(targetSsid);
    let clientIndukSheet = clientIndukS.getSheetByName(targetSheetName);
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sourceSheetName);
    let numberOfRow = mySheet.getRange('A3').getValue();
    let sourceArray = mySheet.getRange(sourceRowOffset, sourceColumnOffset, numberOfRow, sourceNumberOfColumn).getValues(); // get all input
    for (let i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][0].toString().trim() === '') {
            let finalSsid = getSsidFromList(clientIndukSheet, targetRange, targetKeyColumn, sourceArray[i][sourceKeyColumn - sourceColumnOffset], finalColumn);
            let result;
            if (finalSsid == null) {
                //  induk not found should put message to source
                result = actionName + ': Vid ' + sourceArray[i][sourceKeyColumn - sourceColumnOffset] + ' not found in spreadsheet '
                    + targetSsid + ' ' + clientIndukS.getName() + '>' + targetSheetName;
            } else {
                let finalSs = SpreadsheetApp.openById(finalSsid);
                let finalSheet = finalSs.getSheetByName(finalSheetName);
                let finalSsName = finalSs.getName();
                let emptyRow = getNextFreeData(finalSheet, 'B3:B') + 1;
                let content = [];
                for (let c = 0; c < instructionArray.length; c++) {
                    try {
                        content[instructionArray[c][1] - 1] = sourceArray[i][instructionArray[c][0] - sourceColumnOffset];
                    } catch (e) {
                        // do nothing
                    }
                } // end for instructionArray
                fillArray(content);
                result = actionName + ': Done';
                if (resultMode == 1) {
                    result += '. ' + 'In spreadsheet '
                        + ' ' + finalSsid + ' ' + finalSsName + ' ' + finalSheetName + '!' + emptyRow + '.';
                } else {
                    result += '. ';
                } // end if (resultMode == 1)
                if (updateFlag) {
                    finalSheet.getRange(emptyRow, 1, 1, content.length).setValues([content]);
                } else {
                    result += ' (not written). ';
                }// end if (updateFlag)
            } // end if (finalSsid == null)
            mySheet.getRange(sourceRowOffset + i, 2).setValue(result);
            SpreadsheetApp.flush();
        } // end if (sourceArray[i][0].toString().trim() !== '')
    } // end for i
} // end of generalSearchAndAdd

function generalSearchAndUpdate(actionName, sourceSheetName, sourceNumberOfColumn, sourceKeyColumn, targetSsid, targetSheetName, targetRange, targetKeyColumn, finalColumn, finalSheetName, finalRange, sourceKeyForSearchInFinal, instructionArray, updateFlag) {
    // search in targetSsid to get the final ssid
    // search content in sourceKeyColumn in final ssid
    // then execute instructionArray [[source,target column]]
    // if source = string, it will be written in target as it is. Integer = column number in spreadsheet
    // target column = column number in the target ssid (C=3)
    let clientIndukS = SpreadsheetApp.openById(targetSsid);
    let clientIndukSheet = clientIndukS.getSheetByName(targetSheetName);
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sourceSheetName);
    let numberOfRow = mySheet.getRange('A3').getValue();
    let sourceArray = mySheet.getRange(sourceRowOffset, sourceColumnOffset, numberOfRow, sourceNumberOfColumn).getValues(); // get all input
    for (let i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i][0].toString().trim() === '') {
            let indukSsid = getSsidFromList(clientIndukSheet, targetRange, targetKeyColumn, sourceArray[i][sourceKeyColumn - sourceColumnOffset], finalColumn);
            let result;
            if (indukSsid == null) {
                //  induk not found should put message to source
                result = 'Vid ' + sourceArray[i][sourceKeyColumn - sourceColumnOffset] + ' not found in spreadsheet '
                    + targetSsid + ' ' + clientIndukS.getName() + '>' + targetSheetName;
            } else {
                result = genericUpdate(actionName, sourceArray[i], indukSsid, finalSheetName, finalRange, targetKeyColumn, sourceKeyForSearchInFinal, instructionArray, updateFlag);
            }
            mySheet.getRange(sourceRowOffset + i, 2).setValue(result);
            SpreadsheetApp.flush();
        } // end if (sourceArray[i][0].toString().trim() !== '')
    } // end for i
} // end of generalSearchAndUpdate

function updateAUMCP1() {
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const sourceSheetName = 'UpdateUser';
    const actionName = '[' + sourceSheetName + '] Update Authenium Control Panel1';
    const numberOfColumnInSource = numberOfColumnInUpdateUser;
    const sourceKeyForSeach = 3; // @ column C
    const targetSheetName = atiCP1SheetName;
    const targetRefRange = 'B2:B';
    const targetRefIndexForSearch = 0;
    const iArray = [[6, 10], [29, 9]];
    userUpdate(actionName, sourceSheetName, numberOfColumnInSource, sourceKeyForSeach, targetSheetName, targetRefRange, targetRefIndexForSearch, iArray, updateFlag);
} // end of updateAUMCP1

function genericUpdate(actionName, sourceArray, targetSsid, targetSheetName, targetRange, targetKeyColumn, sourceKeyForSearchInFinal, instructionArray, updateFlag) {
    let updateResult = '';
    let targetSs = SpreadsheetApp.openById(targetSsid)
    let targetSheetHandle = targetSs.getSheetByName(targetSheetName);
    let ssName = targetSs.getName();
    let refRange = targetSheetHandle.getRange(targetRange);
    let refData = refRange.getValues();
    let refBeginRow = refRange.getRowIndex();
    if (sourceArray[0].toString().trim() == '' && sourceArray[1].toString().trim() != '') {
        let vid = sourceArray[sourceKeyForSearchInFinal - sourceColumnOffset];
        let idx = findInArray(vid, refData, targetKeyColumn);
        if (idx >= 0) {
            let changes = ' ';
            for (let c = 0; c < instructionArray.length; c++) {
                let targetContent = targetSheetHandle.getRange(refBeginRow + idx, instructionArray[c][1]).getValue();
                let sourceRaw = instructionArray[c][0];
                let sourceContent;
                if (typeof sourceRaw === 'string') {
                    sourceContent = sourceRaw;
                } else {
                    sourceContent = sourceArray[instructionArray[c][0] - sourceColumnOffset];
                } // end if (typeof sourceRaw === 'string')
                if (0 < c) {
                    changes += ', ';
                }
                if (targetContent.toString().trim() === '') {
                    targetContent = '[BLANK]';
                }
                changes += targetContent + '=>' + sourceContent;
                if (updateFlag) {
                    targetSheetHandle.getRange(refBeginRow + idx, instructionArray[c][1]).setValue(sourceContent);
                } // end if (updateFlag)
            } // end for c
            updateResult = actionName + ': Done';
            if (resultMode == 1) {
                updateResult = '. ' + targetSsid + ' ' + ssName + ' ' + targetSheetName + '!' + (refBeginRow + idx) + changes + '. ';
            } else {
                updateResult += '. ';
            } // end if (resultMode == 1)
            if (!updateFlag) {
                updateResult += ' (not written). ';
            } // end if (updateFlag)
        } else {
            // not found
            updateResult = actionName + ': Vid ' + vid + ' not found in target spreadsheet ' + targetSsid + ' '
                + ssName + '>' + targetSheetName + '!' + targetRange + '. ';
        }
    } // end if sourceArray[0]
    return updateResult
} // end of genericUpdate

function userUpdate(actionName, sourceSheetName, sourceNumberOfColumn, sourceKeyColumn, targetSheetName, targetRange, targetKeyColumn, instructionArray, updateFlag) {
    // get data from sheet Mutasi
    // update authenium CP1's control center flag (Active:J2:J)
    // for corresponding VID, from Mutasi!G5:G
    // instructionArray = [[sourceColumn,targetColumn],[1,2],[sourceString,targetColumn],['Hellow',5]]]
    const sourceColumnOffset = 2;
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sourceSheetName);

    let numberOfRow = mySheet.getRange('A3').getValue();
    let data = mySheet.getRange(sourceRowOffset, sourceColumnOffset, numberOfRow, sourceNumberOfColumn).getValues(); // get all input
    for (let i = 0; i < data.length; i++) {
        if (data[i][0].toString().trim() == '' && data[i][1].toString().trim() != '') {
            let targetSsid = getAumCP(data[i][updateClientVidColumn - sourceColumnOffset], cpVersion);
            let targetSheetHandle = SpreadsheetApp.openById(targetSsid).getSheetByName(targetSheetName);
            let refRange = targetSheetHandle.getRange(targetRange);
            let refData = refRange.getValues();
            let refBeginRow = refRange.getRowIndex();
            let idx = findInArray(data[i][sourceKeyColumn - sourceColumnOffset], refData, targetKeyColumn);
            let updateResult = '';
            if (idx >= 0) {
                let changes = ' ';
                for (let c = 0; c < instructionArray.length; c++) {
                    let targetContent = targetSheetHandle.getRange(refBeginRow + idx, instructionArray[c][1]).getValue();
                    let sourceRaw = instructionArray[c][0];
                    let sourceContent;
                    if (typeof sourceRaw === 'string') {
                        sourceContent = sourceRaw;
                    } else {
                        sourceContent = data[i][instructionArray[c][0] - sourceColumnOffset];
                    } // end if (typeof sourceRaw === 'string')
                    if (0 < c) {
                        changes += ', ';
                    }
                    changes += targetContent + '=>' + sourceContent;
                    if (updateFlag) {
                        targetSheetHandle.getRange(refBeginRow + idx, instructionArray[c][1]).setValue(sourceContent);
                    } // end if (updateFlag)
                } // end for c
                updateResult = actionName + ': Done';
                if (resultMode == 1) {
                    updateResult = '. ' + ' row ' + (refBeginRow + idx) + changes;
                } else {
                    updateResult += '. ';
                } // end if (resultMode == 1)
                if (!updateFlag) {
                    updateResult += ' (not written). ';
                } // end if (updateFlag)
            } else {
                // not found
                updateResult = 'Vid not found in authenium CP1 ' + targetSheetName + '!' + targetRange;
            }
            mySheet.getRange(sourceRowOffset + i, 2).setValue(updateResult);
        } // end if data[i][0]
    } // end for (let i=0;i<data.length;i++)
    let d = 1;
} // end of updateAUMCP1

function addInduk() {
    /*
      read records from autsorz | Support2 > AddUser!B5:J
      search autsorz | Support2!G in auz621 | Control Panel 1 > Client!F3:F , get R (Admin)
    */
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const actionName = '[AddUser] to Induk';
    const finalIndukSsidColumn = 8;  // column H
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    let clientIndukSheet = SpreadsheetApp.getActive().getSheetByName(indukSheetName);
    // let data = mySheet.getRange("B5:K").getValues();
    let data = mySheet.getRange(sourceRowOffset, sourceColumnOffset, mySheet.getLastRow() - sourceRowOffset + 1, numberOfColumnInAddUser).getValues();
    let endOfList = false;
    for (let i = 0; i < data.length && !endOfList; i++) {
        if (data[i][0] === '') {
            if (data[i][3] === '') {
                endOfList = true;
            } else {
                if (false && data[i][1] === '') {
                    mySheet.getRange(sourceRowOffset + i, 2).setValue('Tidak ada VID.');
                } else {
                    let searchString = data[i][4].trim();
                    let indukSsid = getIndukSheet(clientIndukSheet, indukRange, 0, searchString, finalIndukSsidColumn);
                    let indukSheet = SpreadsheetApp.openById(indukSsid).getSheetByName(indukAdminSheetName);
                    let emptyRow = getNextFreeData(indukSheet, 'B3:B') + 1;
                    let phoneNumber = '';
                    if (data[i][22].toString().trim() !== '') {
                        // let phoneArray = getPlainPhone(data[i][22].toString());
                        phoneNumber = data[i][22].toString().trim();
                    } // end if (data[i][2].toString() !== '')
                    if (updateFlag) {
                        indukSheet.getRange(emptyRow, 2, 1, 8).setValues([[data[i][1], 'active', data[i][9], data[i][3], phoneNumber, '', data[i][6], data[i][7]]]);
                        // emptyRow++;
                        mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Done. ');
                    } else {
                        mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Done. (not written). ');
                    } // end if (updateFlag)
                    SpreadsheetApp.flush();
                } // end if (vid === '')
            } // end if (data[i][2] == "")
        } // end if (data[i][0] == "")
        // SpreadsheetApp.flush();
    } // end for (let i = 0; i < data.length && !endOfList; i++) 
} // end of addInduk

function addAdmin() {
    /*
      read records from autsorz | Support2 > AddUser!B5:J
      search autsorz | Support2!G in auz621 | Control Panel 1 > Client!F3:F , get R (Admin)
  
    */
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const actionName = '[AddUser] to Admin';
    const sourceSheetName = 'AddUser';
    let mySheet = SpreadsheetApp.getActive().getSheetByName(sourceSheetName);
    let auzCP1Sheet = SpreadsheetApp.openById(auzCP1).getSheetByName(auz621CP1SheetName);
    // let data = mySheet.getRange("B5:K").getValues();
    let data = mySheet.getRange(sourceRowOffset, sourceColumnOffset, mySheet.getLastRow() - sourceRowOffset + 1, numberOfColumnInAddUser).getValues();
    let endOfList = false;
    for (let i = 0; i < data.length && !endOfList; i++) {
        if (data[i][0] === '') {
            if (data[i][3].toString().trim() === '') {
                endOfList = true;
            } else {
                if (data[i][1] === '') {
                    mySheet.getRange(sourceRowOffset + i, 2).setValue('Tidak ada VID.');
                } else {
                    let searchStringPos = data[i][5].trim().indexOf(String.fromCharCode(0x25C6));
                    let searchString = data[i][5].trim().substring(searchStringPos + 1);
                    let adminSsid = getAdminSheet(auzCP1Sheet, clientRange, searchString);
                    let adminSheet = SpreadsheetApp.openById(adminSsid).getSheetByName(finalAdminSheetName);
                    let emptyRow = getNextFreeData(adminSheet, 'B3:B') + 1;
                    adminSheet.getRange(emptyRow, 2, 1, 3).setValues([[data[i][1], data[i][9], data[i][3]]]);
                    adminSheet.getRange(emptyRow, 9, 1, 2).setValues([[data[i][6], data[i][7]]]);
                    if (data[i][22].toString().trim() !== '') {
                        // let phoneArray = getPlainPhone(data[i][22].toString());
                        let phoneNumber = data[i][22].toString().trim();
                        if (updateFlag) {
                            adminSheet.getRange(emptyRow, 7).setValue(phoneNumber);
                            mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Done. ');
                        } else {
                            mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Done. (not written). ');
                        }// end if (updateFlag)
                    } // end if (data[i][22].toString().trim() !== '')
                    SpreadsheetApp.flush();
                    emptyRow++;
                } // end if (vid === '')
            } // end if (data[i][2] == "")
        } // end if (data[i][0] == "")
        // SpreadsheetApp.flush();
    } // end for (let i = 0; i < data.length && !endOfList; i++) 
} // end of addAdmin

function addUserAumCP1() {
    /*
      read records from autsorz | Support2 > AddUser!B5:J
      assert : no phone number in firebase
      add record to authenium control panel 1 > Active last place in column C
        get vid from B put vid in autsorz | Support2!C
    */
    let updateFlag = true;
    if (thisIsTest) {
        updateFlag = false;
    } // end if (thisIsTest)
    const mySheetName = 'AddUser';
    const actionName = '[AddUser] to Authenium CP1';
    let mySheet = SpreadsheetApp.getActive().getSheetByName(mySheetName);
    // let atiCP1Sheet = SpreadsheetApp.openById(aumCP1).getSheetByName(atiCP1SheetName);
    let data;
    // data = mySheet.getRange("B5:J").getValues();
    data = mySheet.getRange(sourceRowOffset, sourceColumnOffset, mySheet.getLastRow() - sourceRowOffset + 1, numberOfColumnInAddUser).getValues();
    let normalString = normalizeName(data, 3);
    mySheet.getRange(sourceRowOffset, 5, normalString.length, 1).setValues(normalString);
    normalString = normalizeName(data, 6);
    mySheet.getRange(sourceRowOffset, 8, normalString.length, 1).setValues(normalString);
    SpreadsheetApp.flush();
    // data = mySheet.getRange("B5:J").getValues();
    data = mySheet.getRange(sourceRowOffset, sourceColumnOffset, mySheet.getLastRow() - sourceRowOffset + 1, numberOfColumnInAddUser).getValues();
    let endOfList = false;
    //let emptyRow = getNextFreeData(atiCP1Sheet, 'C2:C');
    for (let i = 0; i < data.length && !endOfList; i++) {
        if (data[i][0] === "") {
            if (data[i][3] === "") {
                endOfList = true;
            } else {
                let targetSsid = getAumCP(data[i][addClientVidColumn - sourceColumnOffset], cpVersion);
                let atiCP1Sheet = SpreadsheetApp.openById(targetSsid).getSheetByName(atiCP1SheetName);
                let emptyRow = getNextFreeData(atiCP1Sheet, 'C2:C');
                // let phoneArray = getPlainPhone(data[i][22].toString());
                if (data[i][22].toString().trim() === '') {
                    mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Cannot add user with empty Invitation / Phone. '); // phone # cannot be empty
                } else {
                    let phoneNumber = data[i][22].toString();
                    let em = [
                        ["c", "==", currentCountryCode]
                        , ["i", "==", phoneNumber.substring(1)]
                    ];
                    let fsRec = CiFirestore.fsQuery(collection, em);            // Query email in firebase
                    let documentList = Object.keys(fsRec);
                    if (documentList.length > 0) {
                        // phone is found in firebase
                        mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': Phone exist ' + fsRec[documentList[0]]['e'] + ' ' + fsRec[documentList[0]]['b'] + '. ');
                    } else {
                        let cpData = atiCP1Sheet.getRange(emptyRow, 2, 1, 5).getValues();
                        let vid = cpData[0][0];
                        let ssid = cpData[0][4];
                        if (vid === '') {
                            mySheet.getRange(sourceRowOffset + i, 2).setValue(actionName + ': No Vid available in authenium | Control Panel 1 row ' + emptyRow + '. '); // new vid should be available in column B
                        } else {
                            if (updateFlag) {
                                atiCP1Sheet.getRange(emptyRow, 3, 1, 2).setValues([[phoneNumber, data[i][3]]]);
                                atiCP1Sheet.getRange(emptyRow, 9, 1, 2).setValues([[data[i][4], data[i][5]]]);
                                emptyRow++;
                                mySheet.getRange(sourceRowOffset + i, 13).setValue(ssid);
                                mySheet.getRange(sourceRowOffset + i, 2, 1, 2).setValues([[actionName + ': Done. ', vid]]);
                            } else {
                                mySheet.getRange(sourceRowOffset + i, 13).setValue(ssid);
                                mySheet.getRange(sourceRowOffset + i, 2, 1, 2).setValues([[actionName + ': Done (not written). ', vid]]);
                            }// end if (updateFlag)
                        } // end if (vid === '')
                    } // end if (documentList.length > 0)
                } // end if (data[i][22].toString().trim() === '')
            } // end if (data[i][3] === "")
        } // end if (data[i][0] == "")
        SpreadsheetApp.flush();
    } // end for (let i = 0; i < data.length && !endOfList; i++) 
} // end of addUserAtiCP1

function normalizeName(data, position) {
    let result = [];
    let end = false;
    for (let i = 0; i < data.length && !end; i++) {
        if (data[i][position] === '') {
            end = true;
        } else {
            result.push([titleCase(data[i][position])]);
        }
    }
    return result;
} // end of normalizeName

function titleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        if (splitStr[i].length > 0) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
    }
    return splitStr.join(' ');
} // end of titleCase

function getPlainPhone(phoneNumber) {
    let result = ['62', ''];
    let countryFound = false;
    const countryCode = ['62', '61', '65'];
    let plain = phoneNumber.replace(/\D/g, "");
    for (let c = 0; c < countryCode.length; c++) {
        if (plain.startsWith(countryCode[c])) {
            result[0] = countryCode[c];
            result[1] = plain.substring(countryCode[c].length);
            countryFound = true;
        } // end if (plain.startsWith(countryCode[c]))
    } // end for (let c=0; c<countryCode.length; c++)
    if (!countryFound) {
        result[1] = plain;
    } //if (!countryFound)
    return result;
} // end of getPlainPhone

function getSsidFromList(sheet, range, index, target, finalColumn) {
    let result = null;
    let dataRange = sheet.getRange(range);
    let data = dataRange.getValues();
    let dataOffset = dataRange.getRowIndex();
    let keyColumn = index - dataOffset;
    keyColumn = index; //** delete this for production
    let end = false;
    let found = false;
    let targetStr = target.toString();
    for (let i = 0; i < data.length && !end && !found; i++) {
        if (data[i][keyColumn].toString().trim() === targetStr) {
            found = true;
            result = sheet.getRange(i + dataOffset, finalColumn).getValue();
        } // end if (data[i][keyColumn].trim() === target)
        // if (data[i][keyColumn].toString().trim() === '') {
        //   end = true;
        // } // end if (data[i][keyColumn].toString().trim() === target.toString())
    } // end for (let i = 0; i < data.length; i++)
    return result;
} // end of getSsidFromList

function getIndukSheet(sheet, range, index, target, finalColumn) {
    let result = null;
    let dataRange = sheet.getRange(range);
    let data = dataRange.getValues();
    let dataOffset = dataRange.getRowIndex();
    let end = false;
    let found = false;
    for (let i = 0; i < data.length && !end && !found; i++) {
        if (data[i][index].toString().trim() === target.toString()) {
            found = true;
            //result = data[i][finalColumn];
            result = sheet.getRange(i + dataOffset, finalColumn).getValue();
        } // end if (data[i][index].trim() === target)
        if (data[i][index].toString().trim() === '') {
            end = true;
        } // end if (data[i][index].toString().trim() === target.toString())
    } // end for (let i = 0; i < data.length; i++)
    return result;
} // end of getIndukSheet

function getAdminSheet(sheet, range, target) {
    let result = null;
    let row = 0;
    let data = sheet.getRange(range).getValues();
    let end = false;
    let found = false;
    for (let i = 0; i < data.length && !end && !found; i++) {
        if (data[i][0].trim() === target) {
            found = true;
            row = i;
        } // end if (data[i][0].trim() === target)
        if (data[i][0].trim() === '') {
            end = true;
        } // end if (data[i][0].trim() === target)
    } // end for (let i = 0; i < data.length; i++)
    if (row > 0) {
        result = sheet.getRange(row + 3, 18).getValue();
    } // end if (row > 0)
    return result;
} // end of getAdminSheet

function getNextFreeData(sheet, range) {
    let content = sheet.getRange(range).getValues();
    let found = false;
    let result = content.length - 1;
    for (let i = content.length - 1; i >= 0 && !found; i--) {
        if (content[i][0] === '') {
            result = i;
        } else {
            found = true;
        }
    } // end for (let i = content.length - 1; i >= 0 && !found; i++)
    return result + 2;
} // end of getLast

function findInArray(target, ref, position) {
    let result = -1;
    let found = false;
    let end = false;
    for (let i = 0; i < ref.length && !found && !end; i++) {
        if (ref[i][position] == target) {
            found = true;
            result = i;
        }
        // if (ref[i][position] === '') {
        //   end = true;
        // }
    }
    return result;
} // end of findInArray

function lastData(ref, position) {
    // return index of last non empty data in ref[i][position]
    // when # of content = 1, will return 0 
    // if ref has no non-blank data, will return -1
    let result = -1;
    let found = false;
    for (let i = 0; i < ref.length || found; i++) {
        if (ref[i][position].toString().trim() == '') {
            found = true;
            result = i;
        }
    }
    return result;
} // end of lastData

function fillArray(myArray) {
    // fill undefined cell element
    for (let i = 0; i < myArray.length; i++) {
        if (typeof myArray[i] === 'undefined') {
            myArray[i] = '';
        }
    } // end for i
} // end of fillArray
