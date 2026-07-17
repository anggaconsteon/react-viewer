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
        , { name: "[Autsorz] Inactive", functionName: "autsorzInactive" }
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
    menus = [
        { name: "[Inactive] Delete Pegawai (+ blank row at bottom)", functionName: "inactiveFunction1RemoveFromClientPegawai" }
        , { name: "[Inactive] Set `Inactive`", functionName: "inactiveFunction2SetIndukInactive" }
        , { name: "[Inactive] Reset Device (Update Firestore)", functionName: "inactiveFunction3FirestoreDeactivate" }
        , { name: "[Inactive] Copy Paste op1!B6:F14 From Astrid", functionName: "inactiveFunction4CopyOp1Template" }
        ,
    ];
    s1.addMenu("Inactive", menus);
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

function cleanIndonesianPhone(phoneNumber) {
    // strip non-digits, then strip a leading '62' or a single leading '0' -> plain national number (e.g. '812xxx')
    let plain = phoneNumber.toString().replace(/\D/g, '');
    if (plain.startsWith('62')) {
        plain = plain.substring(2);
    } else if (plain.startsWith('0')) {
        plain = plain.substring(1);
    } // end if (plain.startsWith('62'))
    return plain;
} // end of cleanIndonesianPhone

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

// set to false to actually delete rows in 'Pegawai' and check the Process box in 'Inactive'
// while true, the function only logs (via Logger.log) what it WOULD do
const INACTIVE_DRY_RUN = true;

// column layout of the 'Inactive' sheet, shared by removeInactiveFromPegawai and the standalone
// inactiveFunction1..4 (each below runs one logic step for every row, regardless of the others)
const inactiveSourceSheetName = 'Inactive';
const inactiveSourceStartRow = 3;
const inactiveSourceProcessColumn = 2;       // column B, "Process" checkbox
const inactiveSourceVidColumn = 3;           // column C, VID
const inactiveSourcePhoneColumn = 7;         // column G, No. Ponsel
const inactiveSourceClientNameColumn = 9;    // column I, "Client" / Nama Cost Center
const inactiveSourceCostCenterVidColumn = 10; // column J, VID Cost Center

const inactiveClientSheetName = auz621CP1SheetName; // 'Client'
const inactiveClientStartRow = 3;
const inactiveClientKeyColumn = 2;   // column B, VID Cost Center
const inactiveClientSsidColumn = 9;  // column I, target spreadsheet id

const inactiveIndukSheetName = 'ClientInduk-active';
const inactiveIndukStartRow = 3;
const inactiveIndukKeyColumn = 3;   // column C, Nama Cost Center
const inactiveIndukSsidColumn = 8;  // column H, target spreadsheet id

const inactivePegawaiSheetName = 'Pegawai';
const inactivePegawaiStartRow = 3;
const inactivePegawaiVidColumn = 2;    // column B, VID
const inactivePegawaiStatusColumn = 3; // column C, Status

const inactiveOp1SourceSsid = '17n7HygBtbipPhvbbwY2r7yoJKVb3m8ESnPob-bMGZsY';
const inactiveOp1SheetName = 'op1';
const inactiveOp1RangeA1 = 'B6:F14';

const inactiveActiveSheetName = atiCP1SheetName; // 'Active'
const inactiveActiveStartRow = 2;
const inactiveActiveVidColumn = 2;  // column B, VID
const inactiveActiveUrlColumn = 12; // column L, target spreadsheet URL

function inactiveLoadSourceRows() {
    // returns every 'Inactive' row that has a VID filled in
    let sourceSheet = SpreadsheetApp.getActive().getSheetByName(inactiveSourceSheetName);
    let sourceLastRow = sourceSheet.getLastRow();
    let rows = [];
    if (sourceLastRow >= inactiveSourceStartRow) {
        let sourceData = sourceSheet.getRange(inactiveSourceStartRow, 1, sourceLastRow - inactiveSourceStartRow + 1, inactiveSourceCostCenterVidColumn).getValues();
        for (let i = 0; i < sourceData.length; i++) {
            let vid = sourceData[i][inactiveSourceVidColumn - 1].toString().trim();
            if (vid === '') {
                continue; // no VID in this row, nothing to do
            } // end if (vid === '')
            rows.push({
                sourceRow: inactiveSourceStartRow + i,
                vid: vid,
                phone: sourceData[i][inactiveSourcePhoneColumn - 1].toString(),
                namaCostCenter: sourceData[i][inactiveSourceClientNameColumn - 1].toString().trim(),
                vidCostCenter: sourceData[i][inactiveSourceCostCenterVidColumn - 1].toString().trim()
            });
        } // end for i
    } // end if (sourceLastRow >= inactiveSourceStartRow)
    return { sourceSheet: sourceSheet, rows: rows };
} // end of inactiveLoadSourceRows

function inactiveLoadClientData() {
    let clientSheet = SpreadsheetApp.getActive().getSheetByName(inactiveClientSheetName);
    let clientLastRow = clientSheet.getLastRow();
    if (clientLastRow < inactiveClientStartRow) {
        return [];
    } // end if (clientLastRow < inactiveClientStartRow)
    return clientSheet.getRange(inactiveClientStartRow, inactiveClientKeyColumn, clientLastRow - inactiveClientStartRow + 1, inactiveClientSsidColumn - inactiveClientKeyColumn + 1).getValues();
} // end of inactiveLoadClientData

function inactiveLoadIndukData() {
    let indukSheet = SpreadsheetApp.getActive().getSheetByName(inactiveIndukSheetName);
    let indukLastRow = indukSheet.getLastRow();
    if (indukLastRow < inactiveIndukStartRow) {
        return [];
    } // end if (indukLastRow < inactiveIndukStartRow)
    return indukSheet.getRange(inactiveIndukStartRow, inactiveIndukKeyColumn, indukLastRow - inactiveIndukStartRow + 1, inactiveIndukSsidColumn - inactiveIndukKeyColumn + 1).getValues();
} // end of inactiveLoadIndukData

function inactiveLoadActiveData() {
    let activeSheet = SpreadsheetApp.openById(aumCP1).getSheetByName(inactiveActiveSheetName);
    let activeLastRow = activeSheet.getLastRow();
    if (activeLastRow < inactiveActiveStartRow) {
        return [];
    } // end if (activeLastRow < inactiveActiveStartRow)
    return activeSheet.getRange(inactiveActiveStartRow, inactiveActiveVidColumn, activeLastRow - inactiveActiveStartRow + 1, inactiveActiveUrlColumn - inactiveActiveVidColumn + 1).getValues();
} // end of inactiveLoadActiveData

function inactiveLoadOp1Template() {
    return SpreadsheetApp.openById(inactiveOp1SourceSsid).getSheetByName(inactiveOp1SheetName).getRange(inactiveOp1RangeA1).getValues();
} // end of inactiveLoadOp1Template

function inactiveRunLogic1(row, clientData) {
    // logic 1:
    // - look up 'VID Cost Center' (col J) in Client!B:I to get the target spreadsheet id (col I)
    // - in that spreadsheet's 'Pegawai' sheet, find the row whose VID (col B) matches the user's VID (col C)
    // - delete that row and insert a blank row at the bottom to keep the row count unchanged
    let clientSsid = null;
    for (let c = 0; c < clientData.length; c++) {
        if (clientData[c][0].toString().trim() === row.vidCostCenter) {
            clientSsid = clientData[c][inactiveClientSsidColumn - inactiveClientKeyColumn].toString().trim();
            break;
        } // end if (clientData[c][0]...)
    } // end for c
    if (!clientSsid) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': VID Cost Center ' + row.vidCostCenter + ' not found in ' + inactiveClientSheetName + '.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (!clientSsid)
    let pegawaiSheet1 = SpreadsheetApp.openById(clientSsid).getSheetByName(inactivePegawaiSheetName);
    let pegawaiLastRow1 = pegawaiSheet1.getLastRow();
    let matchRow1 = -1;
    if (pegawaiLastRow1 >= inactivePegawaiStartRow) {
        let pegawaiVids1 = pegawaiSheet1.getRange(inactivePegawaiStartRow, inactivePegawaiVidColumn, pegawaiLastRow1 - inactivePegawaiStartRow + 1, 1).getValues();
        for (let p = 0; p < pegawaiVids1.length; p++) {
            if (pegawaiVids1[p][0].toString().trim() === row.vid) {
                matchRow1 = inactivePegawaiStartRow + p;
                break;
            } // end if (pegawaiVids1[p][0]...)
        } // end for p
    } // end if (pegawaiLastRow1 >= inactivePegawaiStartRow)
    if (matchRow1 === -1) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': VID ' + row.vid + ' not found in Pegawai of ' + clientSsid + '.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (matchRow1 === -1)
    if (INACTIVE_DRY_RUN) {
        let message = '[DRY RUN] Would delete row ' + matchRow1 + ' (VID ' + row.vid + ') in Pegawai of ' + clientSsid + ', insert blank row at bottom.';
        Logger.log(message);
        return { ok: true, message: message };
    } // end if (INACTIVE_DRY_RUN)
    pegawaiSheet1.deleteRow(matchRow1);
    pegawaiSheet1.insertRowAfter(pegawaiSheet1.getLastRow());
    return { ok: true, message: 'Deleted row ' + matchRow1 + ' (VID ' + row.vid + ') in Pegawai of ' + clientSsid + '.' };
} // end of inactiveRunLogic1

function inactiveRunLogic2(row, indukData) {
    // logic 2:
    // - look up 'Client' / Nama Cost Center (Inactive col I) in ClientInduk-active!C:H to get the target spreadsheet id (col H)
    // - in that spreadsheet's 'Pegawai' sheet, find the row whose VID (col B) matches the user's VID (col C)
    // - set that row's column C to 'inactive'
    let indukSsid = null;
    for (let c = 0; c < indukData.length; c++) {
        if (indukData[c][0].toString().trim() === row.namaCostCenter) {
            indukSsid = indukData[c][inactiveIndukSsidColumn - inactiveIndukKeyColumn].toString().trim();
            break;
        } // end if (indukData[c][0]...)
    } // end for c
    if (!indukSsid) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': Nama Cost Center ' + row.namaCostCenter + ' not found in ' + inactiveIndukSheetName + '.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (!indukSsid)
    let pegawaiSheet2 = SpreadsheetApp.openById(indukSsid).getSheetByName(inactivePegawaiSheetName);
    let pegawaiLastRow2 = pegawaiSheet2.getLastRow();
    let matchRow2 = -1;
    if (pegawaiLastRow2 >= inactivePegawaiStartRow) {
        let pegawaiVids2 = pegawaiSheet2.getRange(inactivePegawaiStartRow, inactivePegawaiVidColumn, pegawaiLastRow2 - inactivePegawaiStartRow + 1, 1).getValues();
        for (let p = 0; p < pegawaiVids2.length; p++) {
            if (pegawaiVids2[p][0].toString().trim() === row.vid) {
                matchRow2 = inactivePegawaiStartRow + p;
                break;
            } // end if (pegawaiVids2[p][0]...)
        } // end for p
    } // end if (pegawaiLastRow2 >= inactivePegawaiStartRow)
    if (matchRow2 === -1) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': VID ' + row.vid + ' not found in Pegawai of ' + indukSsid + '.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (matchRow2 === -1)
    if (INACTIVE_DRY_RUN) {
        let message = '[DRY RUN] Would set Pegawai row ' + matchRow2 + ' (VID ' + row.vid + ') col C to \'inactive\' in ' + indukSsid + '.';
        Logger.log(message);
        return { ok: true, message: message };
    } // end if (INACTIVE_DRY_RUN)
    pegawaiSheet2.getRange(matchRow2, inactivePegawaiStatusColumn).setValue('inactive');
    return { ok: true, message: 'Set Pegawai row ' + matchRow2 + ' (VID ' + row.vid + ') col C to \'inactive\' in ' + indukSsid + '.' };
} // end of inactiveRunLogic2

function inactiveRunLogic3(row) {
    // logic 3:
    // - clean up No. Ponsel (Inactive col G) to a plain national number (no '0'/'62' prefix)
    // - query Firestore 'users_a1' by i == cleaned phone, then manually filter c === '62' (avoids a composite index)
    // - set the matched document's u field to '-'
    // - for every device in its 'dvc' subcollection, reset {did: 'TBD', in: false}; 0 devices logs 'no_device' (not a failure)
    let cleanPhone = cleanIndonesianPhone(row.phone);
    let fsRec = CiFirestore.fsQuery(collection, [["i", "==", cleanPhone]]);
    let fsDocId = null;
    let docKeys = Object.keys(fsRec);
    for (let d = 0; d < docKeys.length; d++) {
        if (fsRec[docKeys[d]]['c'] === currentCountryCode) {
            fsDocId = docKeys[d];
            break;
        } // end if (fsRec[docKeys[d]]['c'] === currentCountryCode)
    } // end for d
    if (!fsDocId) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': phone ' + cleanPhone + ' (c=' + currentCountryCode + ') not_found in Firestore collection ' + collection + '.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (!fsDocId)
    if (INACTIVE_DRY_RUN) {
        Logger.log('[DRY RUN] Would set Firestore doc ' + fsDocId + ' field u to \'-\'.');
    } else {
        CiFirestore.fsUpdateDocument(fsDocId, { u: '-' });
    } // end if (INACTIVE_DRY_RUN)

    let deviceRec = CiFirestore.fsQuery(fsDocId + '/dvc', []);
    let deviceDocIds = Object.keys(deviceRec);
    if (deviceDocIds.length === 0) {
        Logger.log('[INFO] Inactive row ' + row.sourceRow + ': no_device, Firestore doc ' + fsDocId + ' has no device to reset.');
    } else {
        for (let d = 0; d < deviceDocIds.length; d++) {
            if (INACTIVE_DRY_RUN) {
                Logger.log('[DRY RUN] Would reset device ' + deviceDocIds[d] + ' (did: TBD, in: false).');
            } else {
                CiFirestore.fsUpdateDocument(deviceDocIds[d], { did: 'TBD', in: false });
            } // end if (INACTIVE_DRY_RUN)
        } // end for d
    } // end if (deviceDocIds.length === 0)
    return { ok: true, message: (INACTIVE_DRY_RUN ? '[DRY RUN] ' : '') + 'Firestore doc ' + fsDocId + ' processed (' + deviceDocIds.length + ' device(s)).' };
} // end of inactiveRunLogic3

function inactiveRunLogic4(row, activeData, op1TemplateValues) {
    // logic 4:
    // - find the VID in aumCP1!Active col B (rowStartData: 2), get the target spreadsheet URL from col L
    // - copy op1SourceSsid's 'op1'!B6:F14 (values only) into that spreadsheet's 'op1'!B6:F14
    let targetUrl = null;
    for (let a = 0; a < activeData.length; a++) {
        if (activeData[a][0].toString().trim() === row.vid) {
            targetUrl = activeData[a][inactiveActiveUrlColumn - inactiveActiveVidColumn].toString().trim();
            break;
        } // end if (activeData[a][0]...)
    } // end for a
    if (!targetUrl) {
        let message = '[ERROR] Inactive row ' + row.sourceRow + ': VID ' + row.vid + ' not found in ' + inactiveActiveSheetName + ' of aumCP1.';
        Logger.log(message);
        return { ok: false, message: message };
    } // end if (!targetUrl)
    if (INACTIVE_DRY_RUN) {
        let message = '[DRY RUN] Would copy op1 template values (' + inactiveOp1SourceSsid + '!' + inactiveOp1SheetName + '!' + inactiveOp1RangeA1
            + ') into ' + targetUrl + ' ' + inactiveOp1SheetName + '!' + inactiveOp1RangeA1 + '.';
        Logger.log(message);
        return { ok: true, message: message };
    } // end if (INACTIVE_DRY_RUN)
    let targetOp1Sheet = SpreadsheetApp.openByUrl(targetUrl).getSheetByName(inactiveOp1SheetName);
    targetOp1Sheet.getRange(inactiveOp1RangeA1).setValues(op1TemplateValues);
    return { ok: true, message: 'Copied op1 template values into ' + targetUrl + ' ' + inactiveOp1SheetName + '!' + inactiveOp1RangeA1 + '.' };
} // end of inactiveRunLogic4

function inactiveFunction1RemoveFromClientPegawai() { // [Inactive] -- Function_1
    let clientData = inactiveLoadClientData();
    let source = inactiveLoadSourceRows();
    source.rows.forEach(function (row) {
        try {
            inactiveRunLogic1(row, clientData);
        } catch (e) {
            Logger.log('[ERROR] Inactive row ' + row.sourceRow + ': unexpected exception, skipping row: ' + e);
        } // end try/catch
    });
} // end of inactiveFunction1RemoveFromClientPegawai

function inactiveFunction2SetIndukInactive() { // [Inactive] -- Function_2
    let indukData = inactiveLoadIndukData();
    let source = inactiveLoadSourceRows();
    source.rows.forEach(function (row) {
        try {
            inactiveRunLogic2(row, indukData);
        } catch (e) {
            Logger.log('[ERROR] Inactive row ' + row.sourceRow + ': unexpected exception, skipping row: ' + e);
        } // end try/catch
    });
} // end of inactiveFunction2SetIndukInactive

function inactiveFunction3FirestoreDeactivate() { // [Inactive] -- Function_3
    let source = inactiveLoadSourceRows();
    source.rows.forEach(function (row) {
        try {
            inactiveRunLogic3(row);
        } catch (e) {
            Logger.log('[ERROR] Inactive row ' + row.sourceRow + ': unexpected exception, skipping row: ' + e);
        } // end try/catch
    });
} // end of inactiveFunction3FirestoreDeactivate

function inactiveFunction4CopyOp1Template() { // [Inactive] -- Function_4
    let activeData = inactiveLoadActiveData();
    let op1TemplateValues = inactiveLoadOp1Template();
    let source = inactiveLoadSourceRows();
    source.rows.forEach(function (row) {
        try {
            inactiveRunLogic4(row, activeData, op1TemplateValues);
        } catch (e) {
            Logger.log('[ERROR] Inactive row ' + row.sourceRow + ': unexpected exception, skipping row: ' + e);
        } // end try/catch
    });
} // end of inactiveFunction4CopyOp1Template

// name of the sheet that mirrors 'Inactive' and collects every row whose Process succeeded
const inactiveDeleteSheetName = 'Delete Inactive';

function inactiveGetOrCreateDeleteSheet(sourceSheet, sourceLastColumn) {
    // returns the 'Delete Inactive' sheet, creating it (and mirroring the 'Inactive' header rows)
    // the first time it is needed so its columns/structure match 'Inactive' exactly.
    let ss = SpreadsheetApp.getActive();
    let deleteSheet = ss.getSheetByName(inactiveDeleteSheetName);
    if (!deleteSheet) {
        deleteSheet = ss.insertSheet(inactiveDeleteSheetName);
        let headerRowCount = inactiveSourceStartRow - 1; // rows above the data start row in 'Inactive'
        if (headerRowCount > 0) {
            let headerValues = sourceSheet.getRange(1, 1, headerRowCount, sourceLastColumn).getValues();
            deleteSheet.getRange(1, 1, headerRowCount, sourceLastColumn).setValues(headerValues);
        } // end if (headerRowCount > 0)
    } // end if (!deleteSheet)
    return deleteSheet;
} // end of inactiveGetOrCreateDeleteSheet

function inactiveAppendToDeleteSheet(sourceSheet, rowsValues, sourceLastColumn) {
    // appends the given full-row values (read from 'Inactive') to 'Delete Inactive'.
    if (rowsValues.length === 0) {
        return;
    } // end if (rowsValues.length === 0)
    let deleteSheet = inactiveGetOrCreateDeleteSheet(sourceSheet, sourceLastColumn);
    let startRow = deleteSheet.getLastRow() + 1;
    if (startRow < inactiveSourceStartRow) {
        startRow = inactiveSourceStartRow; // keep the same data-start layout as 'Inactive'
    } // end if (startRow < inactiveSourceStartRow)
    deleteSheet.getRange(startRow, 1, rowsValues.length, sourceLastColumn).setValues(rowsValues);
    Logger.log('[INFO] Appended ' + rowsValues.length + ' row(s) to ' + inactiveDeleteSheetName + '.');
} // end of inactiveAppendToDeleteSheet

function removeInactiveFromPegawai() { // [Inactive] Remove from Pegawai (all steps)
    // for every row in 'Inactive' with a VID filled in, run logic 1-4 (see inactiveRunLogic1..4) in order.
    // a logic step only runs if the previous one succeeded; the 'Process' checkbox (col B)
    // is only checked once ALL logic steps for that row have succeeded.
    let clientData = inactiveLoadClientData();
    let indukData = inactiveLoadIndukData();
    let activeData = inactiveLoadActiveData();
    let op1TemplateValues = inactiveLoadOp1Template();
    let source = inactiveLoadSourceRows();

    let sourceLastColumn = source.sourceSheet.getLastColumn();
    let successRows = []; // full row values from 'Inactive' for rows that fully succeeded

    source.rows.forEach(function (row) {
        try {
            // The first logic is not used during function inactive, but opted to user to run it manually
            // let r1 = inactiveRunLogic1(row, clientData);
            // if (!r1.ok) {
            //   return;
            // } // end if (!r1.ok)
            let r2 = inactiveRunLogic2(row, indukData);
            if (!r2.ok) {
                return;
            } // end if (!r2.ok)
            let r3 = inactiveRunLogic3(row);
            if (!r3.ok) {
                return;
            } // end if (!r3.ok)
            let r4 = inactiveRunLogic4(row, activeData, op1TemplateValues);
            if (!r4.ok) {
                return;
            } // end if (!r4.ok)
            if (INACTIVE_DRY_RUN) {
                Logger.log('[DRY RUN] Would check Process for Inactive row ' + row.sourceRow + '.');
                Logger.log('[DRY RUN] Would append Inactive row ' + row.sourceRow + ' to ' + inactiveDeleteSheetName + '.');
            } else {
                // grab the whole row BEFORE checking Process so the Process column stays unchecked in
                // 'Delete Inactive', while keeping the exact same columns as 'Inactive'
                let rowValues = source.sourceSheet.getRange(row.sourceRow, 1, 1, sourceLastColumn).getValues()[0];
                successRows.push(rowValues);
                source.sourceSheet.getRange(row.sourceRow, inactiveSourceProcessColumn).setValue(true);
            } // end if (INACTIVE_DRY_RUN)
        } catch (e) {
            Logger.log('[ERROR] Inactive row ' + row.sourceRow + ': unexpected exception, skipping row: ' + e);
        } // end try/catch
    });

    if (!INACTIVE_DRY_RUN) {
        inactiveAppendToDeleteSheet(source.sourceSheet, successRows, sourceLastColumn);
    } // end if (!INACTIVE_DRY_RUN)
} // end of removeInactiveFromPegawai

function autsorzInactive() { // [Autsorz] Inactive
    removeInactiveFromPegawai();
} // end of autsorzInactive
