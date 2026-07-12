(function () {
  "use strict";

  var defaultConfig = {
    apiKey: "AIzaSyAcPJCPDH8OUTLBBk3_0XRALoIhQAFikqU",
    authDomain: "hai-software-intellegence.firebaseapp.com",
    projectId: "hai-software-intellegence",
    storageBucket: "hai-software-intellegence.firebasestorage.app",
    messagingSenderId: "631699619139",
    appId: "1:631699619139:web:e05a15747939c45ded83f6"
  };

  /*
    You can still hardcode your config here, but now admin can also save it
    in localStorage under key: hai_firebase_config.
  */
  var localConfig = null;
  try {
    var raw = localStorage.getItem("hai_firebase_config");
    if (raw) {
      localConfig = JSON.parse(raw);
    }
  } catch (error) {
    localConfig = null;
  }

  function isValidConfig(cfg) {
    return !!(
      cfg &&
      typeof cfg === "object" &&
      cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.storageBucket &&
      cfg.messagingSenderId &&
      cfg.appId &&
      cfg.apiKey !== "REPLACE_API_KEY"
    );
  }

  window.HaiFirebaseConfig = isValidConfig(localConfig) ? localConfig : defaultConfig;

  /*
    Content location in Firestore:
    collection: siteContent
    document: main
  */
  window.HaiFirebaseCollection = "siteContent";
  window.HaiFirebaseDocument = "main";
})();
