// HH 210605 210601
// CiFirestore = https://script.google.com/home/projects/1CbViL4xew2U3V6RqdzY5bmsCyXM48k6rSTGeIVJk-kY2P1V3Cz9_XYbU
// Script Id for lib : 1CbViL4xew2U3V6RqdzY5bmsCyXM48k6rSTGeIVJk-kY2P1V3Cz9_XYbU = Collanium Firestore V8 Lib
//
// Collanium Event Lib:
//.   https://script.google.com/home/projects/1ujI5ZRTvmxKG05ybNs0y4CVqyW0biExHZsyk3HOM926hplN4Zd80i8Y3/edit
// need to give user read access to above scripts

var activeSheetName = "Active";               // change to "Active" for production
const collection = "users_a1";                // users collection
var startTime = new Date().getTime();         // current time
const diamond = '◆';

function onOpen() {
    var s1 = SpreadsheetApp.getActive();
    var menus = [
        { name: "Get active user", functionName: "getUserData" },
        null,
        { name: "Update email", functionName: "updateEmail" },
        { name: "Update phone", functionName: "updatePhone" },
        { name: "Update phone and invitation", functionName: "updatePhoneInvitation" },
        { name: "Update flag", functionName: "updateFlag" },
        { name: "Reset device", functionName: "changeDevice" },
        { name: "Reset device by invitation", functionName: "resetDeviceByPhone" },
        { name: "Share / Unshare", functionName: "shareSS" },
        null,                                                                               // Menu separator
        { name: "Search by proxy", functionName: "getProxy" },
        null,
        { name: "Clear data", functionName: "clearAll" },
        null,
        { name: "Send to Event (uploadToEvent)", functionName: "addEvent" }
    ];
    s1.addMenu("Autsorz", menus);
}; // end of onOpen

function addEvent() {
    const appVid = '70027002611015';
    const s = SpreadsheetApp.getActive().getId(); // current ssid
    const n = 'uploadToEvent';
    const acc = ' Spreadsheet script addEvent';
    CollaniumEventLib.insertEvent(s, n, appVid, acc);
}

function shareSS() {
    const shareSheetName = 'ShareSpreadsheet';
    const startRow = 5;
    let shareSheet = SpreadsheetApp.getActive().getSheetByName(shareSheetName);
    let numData = shareSheet.getRange("B3").getValue(); // number of data
    let userData = shareSheet.getRange(startRow, 6, numData, 4).getValues();
    for (var i = 0; i < userData.length; i++) {
        if (userData[i][3].toString().length <= 0) {
            let status = "Error";
            try {
                let emailList = userData[i][2].toString().trim().split(diamond);
                if (emailList.length > 0) {
                    let targetSs = SpreadsheetApp.openById(userData[i][0]);
                    if (userData[i][1].toString().trim().toLowerCase() == 'share as editor') {
                        targetSs.addEditors(emailList);
                    } else if (userData[i][1].toString().trim().toLowerCase() == 'share as viewer') {
                        for (var e of emailList) {
                            targetSs.removeEditor(e);                                 // unshare as editor
                        } // end for e
                        targetSs.addViewers(emailList);
                    } else if (userData[i][1].toString().trim().toLowerCase() == 'unshare') {
                        for (var e of emailList) {
                            targetSs.removeEditor(e);                                 // unshare as editor
                        } // end for e
                    } // end if (userData[1].toString().trim().toLowerCase() == 'editor')
                    status = 'Done';
                } // end if (emailList.length > 0)
            } catch (e) {
                status += e.message;
            }
            shareSheet.getRange(startRow + i, 9).setValue(status);
            SpreadsheetApp.flush();
        } // end if userData
    } // end for i
} // end of shareSS

function getUserData() {
    //=IMPORTRANGE(System!$B$6, "Active!A1:N")
    let currentSs = SpreadsheetApp.getActive();
    let ssid = currentSs.getRange('System!B6').getValue();
    let data = SpreadsheetApp.openById(ssid).getRange('Active!A1:N').getValues();
    currentSs.getRange('Active!A1:N').setValue('');
    currentSs.getSheetByName('Active').getRange(1, 1, data.length, data[0].length).setValues(data);
} // end of getUserData

function updateEmail() {
    /*
      Assert : H is not null, G & I-K is null
      Update firebase field e=H; u=TBD in user_a1; did=TBD, in=false in dvc where e = H
      Update Active!E = H 
      Update VM System!J5 where ssid = Active!F
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                              // Get current sheet
    //let mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");      // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                    // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                             // Get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                                 // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11].toString().trim().length < 1) {                                  // Status check
            let newEmail = updateData[i][6].toString().trim();
            if (newEmail.length > 0) {                                                          // Check H (email) is not blank
                let fieldBlank = updateData[i][5].toString().trim().length + updateData[i][7].toString().trim().length +
                    updateData[i][8].toString().trim().length + updateData[i][9].toString().trim().length;
                if (fieldBlank < 1) {                                                                          // Check G & I - K is blank
                    try {
                        let activeSsid = SpreadsheetApp.getActiveSpreadsheet().getRange("System!B6").getValue();  // Get active ssid
                        let activeSheet = SpreadsheetApp.openById(activeSsid).getSheetByName(activeSheetName);    // Get active sheet
                        activeSheet.getRange(updateData[i][10], 5).setValue(updateData[i][6].toString().trim());   // Change email data
                        SpreadsheetApp.flush();
                        let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();                        // Get VM Ssid
                        let vmEmailRg = SpreadsheetApp.openById(vmSsid).getRange("System!J5");                    // Get email cell in VM
                        vmEmailRg.setValue(updateData[i][6].toString().trim());                                   // Update email in VM
                        let myEmail = updateData[i][2].toString();
                        let em = [["e", "==", myEmail]];
                        let fsRec = CiFirestore.fsQuery(collection, em);                                          // Get data from firebase where e = Email
                        documentList = Object.keys(fsRec);
                        if (documentList.length > 0) {
                            let docName = documentList[0];
                            // put data in firebase p
                            let newData = {
                                "e": newEmail,
                                "u": "TBD"
                            }
                            CiFirestore.fsUpdateDocument(docName, newData);                                          // Update field e & u in user data
                            // get all doc in dvc and set did=TBD and in=false
                            let dvcRec = CiFirestore.fsGetDocuments(docName + "/dvc");
                            let dvcList = Object.keys(dvcRec);
                            let newDvc = {
                                "in": false,
                                "did": "TBD"
                            }
                            try {
                                for (let j = 0; j < dvcList.length; j++) {
                                    let loc = dvcRec[j].name.search(collection);
                                    let dvcName = dvcRec[j].name.slice(loc);
                                    CiFirestore.fsUpdateDocument(dvcName, newDvc)                                            // Update field e & u in user data
                                } // end for dvcList
                            } catch (ef) {
                                mySheet.getRange(10 + i, 13).setValue(ef.message);                                           // Error trap
                            }
                            mySheet.getRange(10 + i, 13).setValue("Done");                                                 // Put final status in col K
                        } else {
                            mySheet.getRange(10 + i, 13).setValue("No user has this email.");
                        } // end if documentList.length
                    } catch (e) {
                        mySheet.getRange(10 + i, 13).setValue(e.message);                                                // Error trap
                    }
                } else {
                    mySheet.getRange(10 + i, 13).setValue("Column G & I - K must be blank.");
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column H (New email) cannot be blank.");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                                   // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of updateEmail

function updatePhoneInvitation() {
    /*
      Assert : E (old phone) & G (new phone) is not null, H & I is null
      Update Active!C where Active!B = B
      Update VM System!I5=Active!H where ssid = Active!F
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                            // Get current sheet
    //let mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");    // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                  // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                        // get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                             // get elapsed time in minutes
    let newDid = { "did": "TBD", "in": false };
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11] !== "Done") {
            if (updateData[i][3].toString().length > 0 && updateData[i][5].toString().length > 0) {
                if (updateData[i][6].toString().length < 1 && updateData[i][7].toString().length < 1) {
                    let oldPhone;
                    try {
                        let activeSsid = SpreadsheetApp.getActiveSpreadsheet().getRange("System!B6").getValue(); // Get active ssid
                        let activeSheet = SpreadsheetApp.openById(activeSsid).getSheetByName(activeSheetName);   // Get active sheet
                        oldPhone = activeSheet.getRange(updateData[i][10], 3).getValue();                        // Get old phone value 
                        activeSheet.getRange(updateData[i][10], 3).setValue(updateData[i][5].toString());        // Update phone data in Active sheet
                        activeSheet.getRange(updateData[i][10], 5).setValue("");                                 // delete email data in Active sheet
                        SpreadsheetApp.flush();
                        Utilities.sleep(100);                                                                    // let data set in Active sheet
                        let gotError = false;
                        // update firebase here
                        let getInv = updateData[i][9].toString().split("◆");                      // Split old invitation to country & phone
                        if (getInv.length >= 2) {
                            let oldC = getInv[0].toString();                                          // Get old country code
                            let oldInv = getInv[1].toString();                                        // Get old invitation code
                            let em = [
                                ["c", "==", oldC],
                                ["i", "==", oldInv]
                            ];
                            let fsRec = CiFirestore.fsQuery(collection, em);            // Query email in firebase
                            let documentList = Object.keys(fsRec);
                            if (documentList.length > 0) {
                                let docName = documentList[0];
                                // put data in firebase p
                                getInv = updateData[i][8].toString().split("◆");          // Split new invitation to country & phone
                                if (getInv.length >= 2) {
                                    let newC = getInv[0].toString();                        // Get old country code
                                    let newInv = getInv[1].toString();                      // Get old invitation code
                                    let newData = {
                                        "c": newC,
                                        "i": newInv,
                                        "e": "-",                                             // reset email value in firebase
                                        "u": "-"
                                    }

                                    let dvcCollection = docName + "/dvc";
                                    let dvcRec = CiFirestore.fsGetDocuments(dvcCollection);
                                    if (dvcRec.length == 1) {
                                        let dvcDocPart = dvcRec[0].name.split(collection);
                                        let dvcName = collection + dvcDocPart[1];
                                        CiFirestore.fsUpdateDocument(docName, newData);
                                        CiFirestore.fsUpdateDocument(dvcName, newDid);
                                        let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();           // Get VM Ssid
                                        let vmSs = SpreadsheetApp.openById(vmSsid);                                   // Get phone cell in VM
                                        let normalizedPhone = activeSheet.getRange(updateData[i][10], 8).getValue();  // Get normalized phone from Active sheet
                                        vmSs.getRange("System!I5:J5").setValues([[normalizedPhone, ""]]);              // Update phone & reset email in VM
                                        mySheet.getRange(10 + i, 13).setValue("Done");                                // Put status in col K
                                    } else {
                                        CiFirestore.fsUpdateDocument(docName, newData);
                                        let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();           // Get VM Ssid
                                        let vmSs = SpreadsheetApp.openById(vmSsid);                                   // Get phone cell in VM
                                        let normalizedPhone = activeSheet.getRange(updateData[i][10], 8).getValue();  // Get normalized phone from Active sheet
                                        vmSs.getRange("System!I5:J5").setValues([[normalizedPhone, ""]]);              // Update phone & reset email in VM
                                        mySheet.getRange(10 + i, 13).setValue("Done, however more than 1 devices found."
                                            + " Field 'did' & 'in' not reset. This should be a development / demo account. "
                                            + "You must edit field 'did' & 'in' for a particular device with another tool, to activate this invitation."); // Put status in col K
                                    } // end of dvcRec.length
                                } else {
                                    gotError = true;
                                    mySheet.getRange(10 + i, 13).setValue("New invitation format should be <country>◆<phone>"); // Put status in col K
                                }// end if new getInv.length >= 2
                            } else {
                                gotError = true;
                                mySheet.getRange(10 + i, 13).setValue("Invitation not found!"); // Put status in col K
                            } // end if old documentList
                        } else {
                            gotError = true;
                            mySheet.getRange(10 + i, 13).setValue("Old invitation format should be <country>◆<phone>");
                        } // end if old getInv.length >= 2
                        if (gotError) {
                            activeSheet.getRange(updateData[i][10], 3).setValue(oldPhone);  // roll back data in active sheet
                        }
                    } catch (e) {
                        mySheet.getRange(10 + i, 13)
                            .setValue("Error, please check phone data in Active sheet of authenium | Subscriber Control Panel. "
                                + e.message);                                           // Error trap
                    } // end of try catch
                } else {
                    mySheet.getRange(10 + i, 13).setValue("Column H & I must be blank!");
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column G (New phone) cannot blank!");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                               // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of updatePhoneInvitation

function updatePhone() {
    /*
      Assert : G is not null, H & I is null
      Update Active!C where Active!B = B
      Update VM System!I5=Active!H where ssid = Active!F
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                            // Get current sheet
    //let mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");    // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                  // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                           // get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                               // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11] !== "Done") {
            if (updateData[i][5].toString().length > 0) {
                if (updateData[i][6].toString().length < 1 && updateData[i][7].toString().length < 1) {
                    try {
                        let activeSsid = SpreadsheetApp.getActiveSpreadsheet().getRange("System!B6").getValue(); // Get active ssid
                        let activeSheet = SpreadsheetApp.openById(activeSsid).getSheetByName(activeSheetName);   // Get active sheet
                        activeSheet.getRange(updateData[i][10], 3).setValue(updateData[i][5].toString());         // Change phone data
                        SpreadsheetApp.flush();
                        Utilities.sleep(100);                                                                    // let data set in Active sheet
                        let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();                       // Get VM Ssid
                        let vmPhoneRg = SpreadsheetApp.openById(vmSsid).getRange("System!I5");                   // Get phone cell in VM
                        let normalizedPhone = activeSheet.getRange(updateData[i][10], 8).getValue();               // Get normalized phone from Active sheet
                        vmPhoneRg.setValue(normalizedPhone);                                                     // Update phone in VM
                        mySheet.getRange(10 + i, 13).setValue("Done");                                              // Put status in col K
                    } catch (e) {
                        mySheet.getRange(10 + i, 13).setValue(e.message);                                           // Error trap
                    }
                } else {
                    mySheet.getRange(10 + i, 13).setValue("Column H & I must be blank!");
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column G (New phone) cannot blank!");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                               // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of updatePhone

function resetInv() {
    /*
      Condition : D & K is not null
      Update firebase field e = "-", u = "-", set c=country code ("62"), i=phone# (8123...).
      Invitation can be accessed by version 0.9.15I and beyond.
    */
    let msg = "--";
    let newDid = { "did": "TBD", "in": false };
    let oldPhone;
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                            // Get current sheet
    //let mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");    // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                  // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                        // get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                             // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][2].toString().length > 3 && updateData[i][11].toString().length <= 0) {
            let myEmail = updateData[i][2].toString();
            if (updateData[i][8].toString().length > 3) {
                try {
                    let getInv = updateData[i][8].toString().split("◆");                      // Split invitation to country & phone
                    if (getInv.length >= 2) {
                        let cCode = getInv[0].toString();                                       // Get country code
                        let invCode = getInv[1].toString();                                    // Get phone# in format 8122...
                        // let exp = updateData[i][9].getTime() + 86400000;   // expire date Add 24 hours  until the end of the day
                        let em = [
                            ["c", "==", cCode],
                            ["i", "==", invCode]
                        ];
                        let fsRec = CiFirestore.fsQuery(collection, em);                        // check uniqueness of invitation
                        let documentList = Object.keys(fsRec);
                        if (true || documentList.length <= 0) {                           // if invitation not found
                            em = [["e", "==", myEmail]];
                            fsRec = CiFirestore.fsQuery(collection, em);            // Query email in firebase
                            documentList = Object.keys(fsRec);
                            if (documentList.length > 0) {
                                let docName = documentList[0];
                                // put data in firebase p
                                let newData = {
                                    "c": cCode,
                                    "i": invCode,
                                    "e": "-",
                                    "u": "-"
                                }
                                let activeSsid = SpreadsheetApp.getActiveSpreadsheet().getRange("System!B6").getValue();  // Get active ssid
                                let activeSheet = SpreadsheetApp.openById(activeSsid).getSheetByName(activeSheetName);    // Get active sheet
                                oldPhone = activeSheet.getRange(updateData[i][10], 3).getValue();                         // Get old phone value 
                                activeSheet.getRange(updateData[i][10], 3).setValue(updateData[i][5].toString());         // Update phone data in Active sheet
                                activeSheet.getRange(updateData[i][10], 5).setValue("");                                  // delete email data in Active sheet
                                SpreadsheetApp.flush();
                                Utilities.sleep(100);
                                let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();                       // Get VM Ssid
                                let vmSs = SpreadsheetApp.openById(vmSsid);                                               // Get  VM
                                let dvcCollection = docName + "/dvc";
                                let dvcRec = CiFirestore.fsGetDocuments(dvcCollection);
                                if (dvcRec.length == 1) {
                                    let dvcDocPart = dvcRec[0].name.split(collection);
                                    let dvcName = collection + dvcDocPart[1];
                                    CiFirestore.fsUpdateDocument(docName, newData);
                                    CiFirestore.fsUpdateDocument(dvcName, newDid);
                                    let normalizedPhone = activeSheet.getRange(updateData[i][10], 8).getValue();              // Get normalized phone from Active sheet
                                    vmSs.getRange("System!I5:J5").setValues([[normalizedPhone, ""]]);                          // Update phone & reset email in VM
                                    mySheet.getRange(10 + i, 13).setValue("Done");                                            // Put status in col K
                                } else {
                                    CiFirestore.fsUpdateDocument(docName, newData);
                                    let normalizedPhone = activeSheet.getRange(updateData[i][10], 8).getValue();              // Get normalized phone from Active sheet
                                    vmSs.getRange("System!I5:J5").setValues([[normalizedPhone, ""]]);                          // Update phone & reset email in VM
                                    mySheet.getRange(10 + i, 13).setValue("Done, however more than 1 devices found."
                                        + " Field 'did' & 'in' not reset. This should be a development / demo account. "
                                        + "You must edit field 'did' & 'in' for a particular device with another tool, to activate this invitation."); // Put status in col K
                                } // end if dvcRec.length == 1               
                            } else {
                                mySheet.getRange(10 + i, 13).setValue("No user has this email.");
                            } // end if doucmentList.length email
                        } else {
                            if (fsRec[documentList[0]].e === "-") msg = "This invitation has been set before. Please merge proxy."
                            else msg = "This user exist with email = " + fsRec[documentList[0]].e + ". Please merge proxy";
                            mySheet.getRange(10 + i, 13).setValue(msg);
                        }  // end if documentList.length > 0 invitation
                    } else {
                        mySheet.getRange(10 + i, 13).setValue("Invitation format should be: <Country code>◆<Phone>.");
                    } // end if invCode.length
                } catch (e) {
                    mySheet.getRange(10 + i, 13).setValue(e.message);                                                // Error trap
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column D (Email) & J(Invitation code) cannot be blank.");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                                   // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of resetInv

function deleteInvitation() {
    /*
      Assert : G-K is null
      delete firebase field c,i,x
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                            // Get current sheet
    //let mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");    // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                  // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                           // get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                               // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11].toString().length < 1) {
            let fieldLen = updateData[i][5].toString().trim().length + updateData[i][6].toString().trim().length +
                updateData[i][7].toString().trim().length + updateData[i][8].toString().trim().length +
                updateData[i][5].toString().trim().length;
            if (fieldLen < 1) {
                try {
                    let myEmail = updateData[i][2].toString();
                    em = [["e", "==", myEmail]];
                    fsRec = CiFirestore.fsQuery(collection, em);
                    documentList = Object.keys(fsRec);
                    if (documentList.length > 0) {
                        let docName = documentList[0];
                        CiFirestore.fsDeleteField(docName, "c");
                        CiFirestore.fsDeleteField(docName, "i");
                        CiFirestore.fsDeleteField(docName, "x");
                        mySheet.getRange(10 + i, 13).setValue("Done");                                 // Put status in col K
                    } else {
                        mySheet.getRange(10 + i, 13).setValue("No user has this email.");
                    } // end if doucmentList.length
                } catch (e) {
                    mySheet.getRange(10 + i, 13).setValue(e.message);                                // Error trap
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column G - K must be blank.");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                 // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of deleteInvitation

function updateFlag() {
    /*
      Assert : I is not blank, G-H & J-K is blank
      Update Active!J = I where Active!B=B
      Update VM op1!C4=I where ssid = Active!F
      Update Firebase user_a1 doc field b=I
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                                // Get current sheet
    // mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDev");           // Get current sheet
    // activeSheetName = "Active2";                                                           // Dev only, comment out this line for production
    let num = Number(mySheet.getRange("A8").getValue());                                      // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                               // Get all record
    let vmSheetName = mySheet.getRange("I5").getValues();                                     // Get target sheet name in VM
    let activeSsid = SpreadsheetApp.getActiveSpreadsheet().getRange("System!B6").getValue();  // Get active ssid
    let activeSheet = SpreadsheetApp.openById(activeSsid).getSheetByName(activeSheetName);    // Get active sheet
    let elapsed = (new Date().getTime() - startTime) / 60000;                                   // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11].toString().trim().length < 1) {                                    // Status check
            let newFlag = updateData[i][7].toString().trim();
            if (newFlag.length > 0) {                                                             // Check I (New flag) is not blank
                let fieldBlank = updateData[i][5].toString().trim().length + updateData[i][6].toString().trim().length +
                    updateData[i][8].toString().trim().length + updateData[i][9].toString().trim().length;
                if (fieldBlank < 1) {                                                                // Check column G-H & J-K are blank
                    try {
                        activeSheet.getRange(updateData[i][10], 10).setValue(newFlag);                   // Update flag in Active!J (col 10)
                        let vmSsid = activeSheet.getRange(updateData[i][10], 6).getValue();              // Get VM Ssid
                        let vmFlagRg = SpreadsheetApp.openById(vmSsid).getRange(vmSheetName + "!C4");     // Get flag cell in VM target sheet
                        vmFlagRg.setValue(newFlag);                                                     // Update flag in VM
                        let myEmail = updateData[i][2].toString();
                        let em = [["e", "==", myEmail]];
                        let fsRec = CiFirestore.fsQuery(collection, em);                                // Get data from firebase where e = Email
                        documentList = Object.keys(fsRec);
                        if (documentList.length > 0) {
                            let docName = documentList[0];                                                // Get only first doc name for updating data
                            // put data in firebase p
                            let newData = {
                                "b": newFlag
                            }
                            CiFirestore.fsUpdateDocument(docName, newData);                                // Update field b in user data doc in firebase
                            mySheet.getRange(10 + i, 13).setValue("Done");                                   // Put final status in col K
                        } else {
                            mySheet.getRange(10 + i, 13).setValue("No user has this email.");
                        } // end if documentList.length
                    } catch (e) {
                        mySheet.getRange(10 + i, 13).setValue(e.message);                                  // Error trap
                    }
                } else {
                    mySheet.getRange(10 + i, 13).setValue("Column G & I - K must be blank.");
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column I (New flag) cannot be blank.");
            } // end if data
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                     // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of updateFlag

function resetDeviceByPhone() {
    /*
      Assert : K is not blank,G-J is blank
      Update firebase field  u=TBD in users_a1 where i = E; update did=TBD, in=false in all dvc for respective user
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                              // Get current sheet
    // mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDEV");         // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                    // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                          // Get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                               // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11].toString().trim().length < 1) {                                 // Status check
            if (updateData[i][9].toString().trim().length > 0) {
                let fieldBlank = updateData[i][5].toString().trim().length + updateData[i][6].toString().trim().length +
                    updateData[i][7].toString().trim().length + updateData[i][8].toString().trim().length;
                if (fieldBlank < 1) {                                                              // Check if G-J is blank
                    try {
                        let phonePart = updateData[i][9].toString().trim().split("◆");                 // Split invitation to country & phone
                        if (phonePart.length >= 2) {
                            let em = [["c", "==", phonePart[0]], ["i", "==", phonePart[1]]];
                            let fsRec = CiFirestore.fsQuery(collection, em);                              // Get data from firebase where e = Email
                            documentList = Object.keys(fsRec);
                            if (documentList.length > 0) {
                                let docName = documentList[0];
                                CiFirestore.fsUpdateDocument(docName, { "u": "TBD" });                         // Update field u @ user data
                                // get all doc in dvc and set did=TBD and in=false
                                let dvcRec = CiFirestore.fsGetDocuments(docName + "/dvc");
                                let dvcList = Object.keys(dvcRec);
                                let err = false;
                                try {
                                    for (let j = 0; j < dvcList.length; j++) {
                                        let loc = dvcRec[j].name.search(collection);
                                        let dvcName = dvcRec[j].name.slice(loc);
                                        CiFirestore.fsUpdateDocument(dvcName, { "in": false, "did": "TBD" });        // Update field in & did @ user data
                                    } // end for dvcList
                                } catch (ef) {
                                    err = true;
                                    mySheet.getRange(10 + i, 13).setValue(ef.message);                           // Error trap
                                }
                                if (!err) mySheet.getRange(10 + i, 13).setValue("Done");                       // Put final status in col K
                            } else {
                                mySheet.getRange(10 + i, 13).setValue("No user has this invitation.");
                            } // end if documentList.length
                        } else {
                            mySheet.getRange(10 + i, 13).setValue("Phone format (column K) should be: <Country code>◆<Phone>.");
                        } // end if phonePart.length >= 2
                    } catch (e) {
                        mySheet.getRange(10 + i, 13).setValue(e.message);                                   // Error trap
                    }
                } else {
                    mySheet.getRange(10 + i, 13).setValue("Column G & I - J must be blank.");
                } // end if fieldBlank
            } else {
                mySheet.getRange(10 + i, 13).setValue("Phone (column K) cannot be blank.");
            } // end if updateData[i][3] (phone)
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                 // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of resetDeviceByPhone

function changeDevice() {
    /*
      Assert : G-K is blank
      Update firebase field  u=TBD in users_a1 where e = D; update did=TBD, in=false in all dvc for respective user
    */
    let mySheet = SpreadsheetApp.getActive().getActiveSheet();                              // Get current sheet
    // mySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UpdateDEV");         // Get current sheet
    let num = Number(mySheet.getRange("A8").getValue());                                    // Get number of record to process
    let updateData = mySheet.getRange(10, 2, num, 12).getValues();                             // Get all record
    let elapsed = (new Date().getTime() - startTime) / 60000;                                 // get elapsed time in minutes
    for (let i = 0; i < updateData.length && elapsed < 5.5; i++) {
        if (updateData[i][11].toString().trim().length < 1) {                                  // Status check
            let fieldBlank = updateData[i][5].toString().trim().length + updateData[i][6].toString().trim().length +
                updateData[i][7].toString().trim().length + updateData[i][8].toString().trim().length + updateData[i][9].toString().trim().length;
            if (fieldBlank < 1) {                                                              // Check if G-K is blank
                try {
                    let myEmail = updateData[i][2].toString();
                    let em = [["e", "==", myEmail]];
                    let fsRec = CiFirestore.fsQuery(collection, em);                              // Get data from firebase where e = Email
                    documentList = Object.keys(fsRec);
                    if (documentList.length > 0) {
                        let docName = documentList[0];
                        let newData = {
                            "u": "TBD"
                        }
                        CiFirestore.fsUpdateDocument(docName, newData);                              //>Update fieldu in user data
                        // get all doc in dvc and set did=TBD and in=false
                        let dvcRec = CiFirestore.fsGetDocuments(docName + "/dvc");
                        let dvcList = Object.keys(dvcRec);
                        let newDvc = {
                            "in": false,
                            "did": "TBD"
                        }
                        let err = false;
                        try {
                            for (let j = 0; j < dvcList.length; j++) {
                                let loc = dvcRec[j].name.search(collection);
                                let dvcName = dvcRec[j].name.slice(loc);
                                CiFirestore.fsUpdateDocument(dvcName, newDvc);                            //>Update field in & did in user data
                            } // end for dvcList
                        } catch (ef) {
                            err = true;
                            mySheet.getRange(10 + i, 13).setValue(ef.message);                           // Error trap
                        }
                        if (!err) mySheet.getRange(10 + i, 13).setValue("Done");                       // Put final status in col K
                    } else {
                        mySheet.getRange(10 + i, 13).setValue("No user has this email.");
                    } // end if documentList.length
                } catch (e) {
                    mySheet.getRange(10 + i, 13).setValue(e.message);                                // Error trap
                }
            } else {
                mySheet.getRange(10 + i, 13).setValue("Column G & I - K must be blank.");
            } // end if fieldBlank
        } // end if Done
        elapsed = (new Date().getTime() - startTime) / 60000;                                 // get elapsed time in minutes
    } // end for i
    SpreadsheetApp.flush();
} // end of changeDevice

function clearAll() {
    SpreadsheetApp.getActive().getActiveSheet().getRange("M10:M").setValue("");         // Clear all status
    SpreadsheetApp.getActive().getActiveSheet().getRange("C10:C").setValue("");         // Clear all name
    SpreadsheetApp.getActive().getActiveSheet().getRange("G10:K").setValue("");         // Clear all data
}

function getProxyTest() {
    getProxy('autsorz◆bijak◆menara-jamsostek', '16nsozk7O2ONO0TmJXO7wRqyBZ-Hu6By5cZaOnCeSgRM');
} // end of getProxyTest

function getProxy() {
    let result = [];
    let mySheet = SpreadsheetApp.getActive().getSheetByName("Search")
    let target = mySheet.getRange("B8:C8").getValues();
    mySheet.getRange("D8:G").setValue("");
    SpreadsheetApp.flush();
    flag = target[0][0];
    ssid = target[0][1];
    let em = [["b", "==", flag]];
    let fsRec = CiFirestore.fsQuery(collection, em);
    let documentList = Object.keys(fsRec);
    for (let i = 0; i < documentList.length; i++) {
        let docName = documentList[i];
        let email = fsRec[docName].e;
        let uid = fsRec[docName].u;
        let inv = fsRec[docName].i;
        let dvcRec = CiFirestore.fsGetDocuments(docName + "/dvc");
        for (let j = 0; j < dvcRec.length; j++) {
            let lif = dvcRec[j].fields.lif.stringValue;
            if (lif == ssid) {
                let vid = dvcRec[j].fields.vid.stringValue;
                result.push([email, uid, inv, vid]);
            }
        }
    } // for documentList
    if (result.length < 1) {
        result.push(['-', '-', '-', '-']);
    }
    mySheet.getRange(8, 4, result.length, 4).setValues(result);
} // end of getProxy

function binarySearch2DArray(target, array) {
    /*
      return value:
      -1 if the number is smaller than all elements.
      -2 if the number is larger than all elements.
      -3 if the number is found.
      The index of the largest element smaller than the target if the number is not found.
    */
    if (!array || array.length === 0) {
        return -1; // Or any suitable error code for an empty array.
    }
    const firstElement = array[0][0];
    const lastElement = array[array.length - 1][0];
    if (target < firstElement) {
        return -1;
    }
    if (target > lastElement) {
        return -2;
    }
    let left = 0;
    let right = array.length - 1;
    let result = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midElement = array[mid][0];
        if (midElement === target) {
            return -3;
        } else if (midElement < target) {
            result = mid; // Store the index of the largest element smaller than target.
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return result;
} // end of binarySearch2DArray(target, array)
ri
// Example usage:
function testBinarySearch() {
    const sortedArray = [
        [1, 'a'],
        [3, 'b'],
        [5, 'c'],
        [7, 'd'],
        [9, 'e'],
    ];
    Logger.log(binarySearch2DArray(4, sortedArray)); // Output: 1
    Logger.log(binarySearch2DArray(10, sortedArray)); // Output: -2
    Logger.log(binarySearch2DArray(0, sortedArray)); // output: -1
    Logger.log(binarySearch2DArray(7, sortedArray)); // output: -3
} // end of testBinarySearch()
