# BACKUP — Web Menu 2 L2/M2/N2 + Web JSON C6 (MAP lama)

Spreadsheet `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`, diambil 2026-06-01 sebelum rewrite idiom.
Revert: paste balik string ini ke cell anchor (L2/M2/N2 = MAP spill; C6 = MAP spill).

## Web Menu 2!L2 (Detail JSON, Level-3)
```
=MAP(B2:B200;F2:F200;G2:G200;H2:H200;I2:I200;J2:J200;K2:K200;LAMBDA(xlvl;xlb;xic;xph;xus;xpr;xky;IF(xlvl<>3;"";LET(q;CHAR(34);"{" &q&"label"&q&":"&q&xlb&q&","&q&"icon"&q&":"&q&xic&q&","&q&"path"&q&":"&q&xph&q&","&q&"key"&q&":"&q&xky&q&","&q&"urlSheet"&q&":"&q&xus&q&","&q&"parent"&q&":"&q&xpr&q&"}"))))
```

## Web Menu 2!M2 (Sub JSON, Level-2)
```
=MAP(B2:B200;F2:F200;G2:G200;H2:H200;I2:I200;J2:J200;K2:K200;LAMBDA(xlvl;xlb;xic;xph;xus;xpr;xky;IF(xlvl<>2;"";LET(q;CHAR(34);hch;COUNTIFS(B$2:B$200;3;J$2:J$200;xlb)>0;ch;IF(hch;"["&IFERROR(TEXTJOIN(",";TRUE;FILTER(L$2:L$200;B$2:B$200=3;J$2:J$200=xlb));"")&"]";"");"{" &q&"label"&q&":"&q&xlb&q&","&q&"icon"&q&":"&q&xic&q&","&q&"path"&q&":"&q&xph&q&","&q&"key"&q&":"&q&xky&q&","&q&"urlSheet"&q&":"&q&xus&q&","&q&"parent"&q&":"&q&xpr&q&IF(hch;","&q&"children"&q&":"&ch;"")&"}"))))
```

## Web Menu 2!N2 (Main JSON, Level-1)
```
=MAP(B2:B200;F2:F200;G2:G200;H2:H200;I2:I200;J2:J200;K2:K200;LAMBDA(xlvl;xlb;xic;xph;xus;xpr;xky;IF(xlvl<>1;"";LET(q;CHAR(34);ch;"["&IFERROR(TEXTJOIN(",";TRUE;FILTER(M$2:M$200;B$2:B$200=2;J$2:J$200=xlb));"")&"]";"{" &q&"label"&q&":"&q&xlb&q&","&q&"icon"&q&":"&q&xic&q&","&q&"path"&q&":"&q&xph&q&","&q&"key"&q&":"&q&xky&q&","&q&"urlSheet"&q&":"&q&xus&q&","&q&"children"&q&":"&ch&"}"))))
```

## Web JSON!C6 (envelope MAP — dari sesi sebelumnya)
```
=MAP(B6:B100;LAMBDA(eml;IF(eml="";"";LET(q;CHAR(34);ccstr;IFERROR(TEXTJOIN("◆";TRUE;FILTER('Otorisasi Cost Center'!$B$2:$B$200;INDEX('Otorisasi Cost Center'!$A$2:$Z$200;0;MATCH(eml;'Otorisasi Cost Center'!1:1;0))=TRUE));"");mrow;MATCH(eml;'Otorisasi Menu Web'!$D:$D;0);existingInner;IFERROR(TEXTJOIN(",";TRUE;MAP(FILTER(TRANSPOSE('Otorisasi Menu Web'!$E$2:$J$2);TRANSPOSE(INDEX('Otorisasi Menu Web'!$E:$J;mrow;0))=TRUE);LAMBDA(lbl;IFERROR(INDEX('Web Menu 2'!$N:$N;MATCH(1;('Web Menu 2'!$F:$F=lbl)*('Web Menu 2'!$B:$B=1);0));"{}"))));"");webScreenInner;IFERROR(TEXTJOIN(",";TRUE;FILTER('Web Screen'!$B$2:$B$1000;ISTEXT('Web Screen'!$A$2:$A$1000);'Web Screen'!$B$2:$B$1000<>""));"");combined;IF(existingInner="";webScreenInner;IF(webScreenInner="";existingInner;existingInner&","&webScreenInner));children;SUBSTITUTE("["&combined&"]";"[CC_LIST]";ccstr);"{"&q&"type"&q&":"&q&"MENU"&q&","&q&"name"&q&":"&q&$B$1&q&","&q&"description"&q&":"&q&$B$2&q&","&q&"logoUrl"&q&":"&q&$B$3&q&","&q&"email"&q&":"&q&eml&q&","&q&"costCenters"&q&":"&q&ccstr&q&","&q&"footer"&q&":"&q&"Powered by "&$E$3&q&","&q&"children"&q&":"&children&"}"))))
```
