"use client";

import { createContext, startTransition, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "mr";

const STORAGE_KEY = "silent-recall-traceability-language";

export const translations = {
  en: {
    appName: "Silent Recall Traceability",
    navHome: "Home",
    navDebug: "Debug",
    navBackwardTrace: "Backward Trace",
    navForwardTrace: "Forward Trace",
    navDashboard: "Dashboard",
    navEntryRawMaterial: "Raw Material Entry",
    navEntryBatch: "Batch Entry",
    navEntryQc: "QC Entry",
    navEntryDispatch: "Dispatch Entry",
    toggleLanguage: "EN / MR",
    online: "Online",
    offline: "Offline",
    syncNow: "Sync Now",
    syncing: "Syncing...",
    synced: "Synced",
    changesStoredLocally: "changes stored locally, will sync when connected.",
    scanQrDemo: "Scan QR (demo)",
    applyScan: "Apply scan",
    close: "Close",
    chooseExistingId: "Choose an existing ID",
    printableTag: "Printable tag",
    printTag: "Print tag",
    saveRecord: "Save record",
    resolveChain: "Resolve chain",
    resolveImpact: "Resolve impact",
    fieldDispatchOrder: "Dispatch order",
    fieldLotOrBatch: "Raw material lot or batch",
    loadingDashboard: "Loading dashboard metrics...",
    fullyTraceable: "Fully traceable",
    qcPassRate: "QC pass rate",
    totalUnitsDispatched: "Total units dispatched",
    batchTable: "Batch table",
    completeness: "Completeness",
    downstreamShipments: "Downstream shipments",
    affectedClients: "Dispatch orders and affected clients",
    loadingData: "Loading seeded data...",
    notRecorded: "Not recorded",
    homeTitle: "Home",
    homeSubtitle: "Offline-first traceability demo for auto-parts manufacturing.",
    debugTitle: "Seeded Traceability Data",
    debugSubtitle: "Plain table dump of the Dexie database for quick verification.",
    backwardTitle: "Dispatch Order to Supplier chain",
    backwardSubtitle: "Trace a dispatch order backward from shipment to supplier using only local IndexedDB data.",
    forwardTitle: "Raw material lot to shipment impact",
    forwardSubtitle: "Trace a raw lot or batch forward to every affected dispatch order and client, locally.",
    dashboardTitle: "Production traceability overview",
    dashboardSubtitle: "Review seeded production, QC, and traceability completeness at a glance.",
    rawMaterialTitle: "Raw material entry",
    batchTitle: "Production batch entry",
    qcTitle: "QC result entry",
    dispatchTitle: "Dispatch order entry",
    tagTitle: "Printable tag",
    tagSubtitle: "QR only, no RFID hardware.",
    fieldId: "ID",
    fieldSupplier: "Supplier",
    fieldContactInfo: "Contact info",
    fieldMaterialType: "Material type",
    fieldReceivedDate: "Received date",
    fieldQuantity: "Quantity",
    fieldLotNumber: "Lot number",
    fieldMachine: "Machine",
    fieldProductionLine: "Production line",
    fieldShift: "Shift",
    fieldOperatorName: "Operator name",
    fieldStartTime: "Start time",
    fieldEndTime: "End time",
    fieldUnitsProduced: "Units produced",
    fieldRawMaterialLots: "Raw material lots",
    fieldBatchNumber: "Batch number",
    fieldInspectorName: "Inspector name",
    fieldResult: "Result",
    fieldDefects: "Defects",
    fieldInspectionDate: "Inspection date",
    fieldOrderNumber: "Order number",
    fieldClientName: "Client name",
    fieldDispatchDate: "Dispatch date",
    fieldDestination: "Destination",
    fieldBatchIds: "Batch IDs",
  },
  mr: {
    appName: "सायलेंट रिकॉल ट्रेसेबिलिटी",
    navHome: "मुख्य",
    navDebug: "डिबग",
    navBackwardTrace: "मागचा मागोवा",
    navForwardTrace: "पुढचा मागोवा",
    navDashboard: "डॅशबोर्ड",
    navEntryRawMaterial: "कच्चा माल नोंद",
    navEntryBatch: "बॅच नोंद",
    navEntryQc: "QC नोंद",
    navEntryDispatch: "डिस्पॅच नोंद",
    toggleLanguage: "EN / MR",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    syncNow: "आता सिंक करा",
    syncing: "सिंक होत आहे...",
    synced: "सिंक झाले",
    changesStoredLocally: "बदल स्थानिकरित्या साठवले आहेत, कनेक्शन आल्यावर सिंक होतील.",
    scanQrDemo: "QR स्कॅन (डेमो)",
    applyScan: "स्कॅन लागू करा",
    close: "बंद",
    chooseExistingId: "अस्तित्वातील ID निवडा",
    printableTag: "प्रिंटेबल टॅग",
    printTag: "टॅग प्रिंट करा",
    saveRecord: "नोंद जतन करा",
    resolveChain: "साखळी शोधा",
    resolveImpact: "परिणाम शोधा",
    fieldDispatchOrder: "डिस्पॅच ऑर्डर",
    fieldLotOrBatch: "कच्चा माल लॉट किंवा बॅच",
    loadingDashboard: "डॅशबोर्ड मेट्रिक्स लोड होत आहेत...",
    fullyTraceable: "पूर्ण ट्रेसेबल",
    qcPassRate: "QC पास दर",
    totalUnitsDispatched: "डिस्पॅच केलेले एकूण युनिट्स",
    batchTable: "बॅच टेबल",
    completeness: "पूर्णता",
    downstreamShipments: "पुढील शिपमेंट्स",
    affectedClients: "डिस्पॅच ऑर्डर आणि प्रभावित ग्राहक",
    loadingData: "सीडेड डेटा लोड होत आहे...",
    notRecorded: "नोंद नाही",
    homeTitle: "मुख्य",
    homeSubtitle: "ऑटो-पार्ट्स उत्पादनासाठी ऑफलाइन-फर्स्ट ट्रेसेबिलिटी डेमो.",
    debugTitle: "सीडेड ट्रेसेबिलिटी डेटा",
    debugSubtitle: "जलद पडताळणीसाठी Dexie डेटाबेसचा साधा टेबल डंप.",
    backwardTitle: "डिस्पॅच ऑर्डर ते सप्लायर साखळी",
    backwardSubtitle: "स्थानिक IndexedDB डेटावरून डिस्पॅच ऑर्डर मागे ट्रेस करा.",
    forwardTitle: "कच्च्या मालापासून शिपमेंट परिणाम",
    forwardSubtitle: "कच्चा माल किंवा बॅच पुढे ट्रेस करून प्रभावित ऑर्डर आणि ग्राहक पहा.",
    dashboardTitle: "उत्पादन ट्रेसेबिलिटी आढावा",
    dashboardSubtitle: "सीडेड उत्पादन, QC आणि ट्रेसेबिलिटी स्थिती एकाच ठिकाणी पहा.",
    rawMaterialTitle: "कच्चा माल नोंद",
    batchTitle: "उत्पादन बॅच नोंद",
    qcTitle: "QC निकाल नोंद",
    dispatchTitle: "डिस्पॅच ऑर्डर नोंद",
    tagTitle: "प्रिंटेबल टॅग",
    tagSubtitle: "फक्त QR, RFID हार्डवेअर नाही.",
    fieldId: "ID",
    fieldSupplier: "सप्लायर",
    fieldContactInfo: "संपर्क माहिती",
    fieldMaterialType: "मटेरियल प्रकार",
    fieldReceivedDate: "प्राप्त तारीख",
    fieldQuantity: "प्रमाण",
    fieldLotNumber: "लॉट नंबर",
    fieldMachine: "मशीन",
    fieldProductionLine: "उत्पादन लाईन",
    fieldShift: "शिफ्ट",
    fieldOperatorName: "ऑपरेटरचे नाव",
    fieldStartTime: "सुरुवात वेळ",
    fieldEndTime: "समाप्ती वेळ",
    fieldUnitsProduced: "निर्मित युनिट्स",
    fieldRawMaterialLots: "कच्च्या मालाचे लॉट्स",
    fieldBatchNumber: "बॅच नंबर",
    fieldInspectorName: "इन्स्पेक्टरचे नाव",
    fieldResult: "निकाल",
    fieldDefects: "दोष",
    fieldInspectionDate: "तपासणी तारीख",
    fieldOrderNumber: "ऑर्डर नंबर",
    fieldClientName: "क्लायंटचे नाव",
    fieldDispatchDate: "डिस्पॅच तारीख",
    fieldDestination: "गंतव्य",
    fieldBatchIds: "बॅच ID",
  },
} as const;

type TranslationMap = typeof translations.en;
export type TranslationKey = keyof TranslationMap;

function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return storedLanguage === "mr" ? "mr" : "en";
}

interface AppLocaleContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedLanguage = getStoredLanguage();

    startTransition(() => {
      setLanguageState(storedLanguage);
      setHydrated(true);
    });
  }, []);

  const value = useMemo<AppLocaleContextValue>(
    () => {
      const setLanguage = (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      };

      return {
        language,
        setLanguage,
        toggleLanguage: () => setLanguage(language === "en" ? "mr" : "en"),
        t: (key: TranslationKey) => translations[hydrated ? language : "en"][key],
      };
    },
    [hydrated, language],
  );

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale() {
  const context = useContext(AppLocaleContext);

  if (!context) {
    throw new Error("useAppLocale must be used within AppLocaleProvider");
  }

  return context;
}